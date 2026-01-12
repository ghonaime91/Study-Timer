import {
  SessionStatus,
  DaysOfWeek,
  StudySession,
  TimerState,
  studyState,
  studyTexts,
  studyUtils,
} from "./study-globals.js";
import { app, texts, dom } from "./globals.js";
import { playSound, stopSound } from "./sound.js";
import { stopTimer as stopMainTimer } from "./timer.js";

class StudyScheduleManager {
  constructor() {
    this.timerInterval = null;
    this.updateInterval = null;
    this.domElements = {};
    this.editingSessionId = null;
    this.init();
  }

  init() {
    this.setupDOMElements();
    this.loadFromStorage();
    this.setupEventListeners();
    this.updateUI();
    this.startUpdateLoop();

    // Request notification permission
    if (
      "Notification" in window &&
      Notification.permission !== "granted" &&
      Notification.permission !== "denied"
    ) {
      Notification.requestPermission();
    }
  }

  setupDOMElements() {
    // Modal elements
    this.domElements.studyScheduleModal =
      document.getElementById("studyScheduleModal");
    this.domElements.studyScheduleClose =
      document.getElementById("studyScheduleClose");
    this.domElements.studyScheduleTitle =
      document.getElementById("studyScheduleTitle");

    // Global timer elements
    this.domElements.globalTimerDisplay =
      document.getElementById("globalTimerDisplay");
    this.domElements.currentSessionInfo =
      document.getElementById("currentSessionInfo");

    // Form elements
    this.domElements.sessionForm = document.getElementById("sessionForm");
    this.domElements.sessionDay = document.getElementById("sessionDay");
    this.domElements.sessionSubject = document.getElementById("sessionSubject");
    this.domElements.sessionStudyDuration = document.getElementById(
      "sessionStudyDuration"
    );
    this.domElements.sessionBreakDuration = document.getElementById(
      "sessionBreakDuration"
    );
    this.domElements.addSessionBtn = document.getElementById("addSessionBtn");

    // Table elements
    this.domElements.sessionsTableBody =
      document.getElementById("sessionsTableBody");

    // Alert modal elements
    this.domElements.studyAlertModal =
      document.getElementById("studyAlertModal");
    this.domElements.studyAlertMessage =
      document.getElementById("studyAlertText"); // Fixed ID
    this.domElements.studyAlertOk = document.getElementById("studyAlertOkBtn"); // Fixed ID
    this.domElements.studyAlertCancel =
      document.getElementById("studyAlertCancel");

    // Settings button
    this.domElements.studyScheduleBtn =
      document.getElementById("studyScheduleBtn");
  }

  setupEventListeners() {

    if (this.domElements.sessionDay) {
      this.domElements.sessionDay.addEventListener("change", () => {
        this.updateSessionsTable(); 
      });
    }

    // Modal controls
    this.domElements.studyScheduleBtn?.addEventListener("click", () =>
      this.showModal()
    );
    this.domElements.studyScheduleClose?.addEventListener("click", () =>
      this.hideModal()
    );

    // Form submission
    this.domElements.addSessionBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      if (this.editingSessionId) {
        this.updateSession(this.editingSessionId);
      } else {
        this.addSession();
      }
    });

    // Alert modal
    this.domElements.studyAlertOk?.addEventListener("click", () => {
      if (this.currentAlertAction) {
        this.currentAlertAction();
        this.currentAlertAction = null;
      }
      this.hideAlert();
    });

    // Click outside modal to close
    this.domElements.studyScheduleModal?.addEventListener("click", (e) => {
      if (e.target === this.domElements.studyScheduleModal) {
        this.hideModal();
      }
    });

    // Escape key to close modal
    document.addEventListener("keydown", (e) => {
      if (
        e.key === "Escape" &&
        this.domElements.studyScheduleModal?.style.display === "block"
      ) {
        this.hideModal();
      }
    });
  }

  // Timer Management
  startTimer(sessionId, phase = "study") {
    const session = studyState.sessions.find((s) => s.id === sessionId);
    if (!session || session.status === SessionStatus.COMPLETED) return false;

    // Stop any currently running timer (internal)
    this.stopTimer(false); 

    // Stop main app timer to prevent conflict
    stopMainTimer();

    // Disable main timer controls
    this.toggleMainControls(true);

    // Set the active session
    studyState.timerState.activeSessionId = sessionId;
    studyState.timerState.phase = phase; // Set phase

    session.status = SessionStatus.RUNNING;

    // Initialize global timer
    studyState.timerState.globalTimer.isRunning = true;
    studyState.timerState.globalTimer.isPaused = false;

    // Set duration based on phase
    const duration =
      phase === "study" ? session.studyDuration : session.breakDuration;
    studyState.timerState.globalTimer.totalTime = duration * 60;

    // Use targetTime for countdown logic based on Date.now()
    // current time (elapsed) is 0 initially
    studyState.timerState.globalTimer.currentTime = 0;
    // Target time is now + duration
    studyState.timerState.globalTimer.targetTime =
      Date.now() + duration * 60 * 1000;

    studyState.timerState.globalTimer.startTime = Date.now(); 

    // Start the timer interval
    this.timerInterval = setInterval(() => this.updateTimer(), 1000);

    this.saveToStorage();
    this.updateUI();

    // Notification for start
    if (phase === "break") {
      this.showNotification(
        `${studyUtils.getText("breakPhase")}: ${session.subject}`
      );
    }

    return true;
  }

  startBreak(sessionId) {
    return this.startTimer(sessionId, "break");
  }

  pauseTimer() {
    if (
      !studyState.timerState.globalTimer.isRunning ||
      studyState.timerState.globalTimer.isPaused
    )
      return false;

    studyState.timerState.globalTimer.isPaused = true;

    // Calculate remaining time precisely
    const now = Date.now();
    const remainingMS = studyState.timerState.globalTimer.targetTime - now;
    studyState.timerState.globalTimer.remainingTimeMS = Math.max(
      0,
      remainingMS
    );

    // We don't need targetTime while paused
    studyState.timerState.globalTimer.targetTime = null;

    const session = studyState.sessions.find(
      (s) => s.id === studyState.timerState.activeSessionId
    );
    if (session) {
      session.status = SessionStatus.PAUSED;
    }

    this.saveToStorage();
    this.updateUI();

    return true;
  }

  resumeTimer() {
    if (
      !studyState.timerState.globalTimer.isRunning ||
      !studyState.timerState.globalTimer.isPaused
    )
      return false;

    studyState.timerState.globalTimer.isPaused = false;

    // Restore target time from remaining
    const now = Date.now();
    const remainingMS = studyState.timerState.globalTimer.remainingTimeMS || 0;
    studyState.timerState.globalTimer.targetTime = now + remainingMS;

    const session = studyState.sessions.find(
      (s) => s.id === studyState.timerState.activeSessionId
    );
    if (session) {
      session.status = SessionStatus.RUNNING;
    }

    this.saveToStorage();
    this.updateUI();

    return true;
  }

  stopTimer(resetState = true) {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Enable main timer controls
    this.toggleMainControls(false);

    const session = studyState.sessions.find(
      (s) => s.id === studyState.timerState.activeSessionId
    );
    if (session) {
      session.status = SessionStatus.IDLE;
    }

    if (resetState) {
      studyState.timerState.activeSessionId = null;
      studyState.timerState.phase = "study";
      studyState.timerState.globalTimer.isRunning = false;
      studyState.timerState.globalTimer.isPaused = false;
      studyState.timerState.globalTimer.currentTime = 0;
      studyState.timerState.globalTimer.totalTime = 0;
      studyState.timerState.globalTimer.targetTime = null;
      studyState.timerState.globalTimer.remainingTimeMS = 0;

      // Reset displays
      if (this.domElements.globalTimerDisplay) {
        this.domElements.globalTimerDisplay.textContent = "00:00:00";
      }
      if (dom.timeEl) {
        dom.timeEl.textContent = "00:00:00";
      }
    }

    this.saveToStorage();
    this.updateUI();
  }

  resetTimer() {
    const session = studyState.sessions.find(
      (s) => s.id === studyState.timerState.activeSessionId
    );
    if (!session) return false;

    // Record completed study time
    if (studyState.timerState.globalTimer.isRunning) {
      session.totalStudyTime += studyState.timerState.globalTimer.currentTime;
    }

    this.stopTimer();
    session.status = SessionStatus.IDLE;
    session.currentTime = 0;

    this.saveToStorage();
    this.updateUI();

    return true;
  }

  toggleMainControls(disabled) {
    const startBtn = document.getElementById("startBtn");
    const stopBtn = document.getElementById("stopBtn");
    const resetBtn = document.getElementById("resetBtn");

    if (startBtn) startBtn.disabled = disabled;
    if (stopBtn) stopBtn.disabled = disabled;
    if (resetBtn) resetBtn.disabled = disabled;

    // Add visual feedback
    if (disabled) {
      if (startBtn) startBtn.style.opacity = "0.5";
      if (stopBtn) stopBtn.style.opacity = "0.5";
      if (resetBtn) resetBtn.style.opacity = "0.5";
    } else {
      if (startBtn) startBtn.style.opacity = "";
      if (stopBtn) stopBtn.style.opacity = "";
      if (resetBtn) resetBtn.style.opacity = "";
    }
  }

  updateTimer() {
    if (
      !studyState.timerState.globalTimer.isRunning ||
      studyState.timerState.globalTimer.isPaused
    )
      return;

    // Use Date.now() and targetTime for drift-free calculation
    const now = Date.now();
    const targetTime = studyState.timerState.globalTimer.targetTime;

    // Safety check
    if (!targetTime) return;

    const remainingMS = Math.max(0, targetTime - now);
    const remainingSeconds = Math.ceil(remainingMS / 1000);

    // Update elapsed for consistency (total - remaining)
    const totalTime = studyState.timerState.globalTimer.totalTime;
    const elapsed = totalTime - remainingSeconds;
    studyState.timerState.globalTimer.currentTime = elapsed;

    const session = studyState.sessions.find(
      (s) => s.id === studyState.timerState.activeSessionId
    );
    if (!session) return;

    // Update displays with remaining time (Countdown)
    this.updateTimerDisplays(remainingSeconds);

    // Check if session is complete
    if (remainingSeconds <= 0) {
      if (studyState.timerState.phase === "break") {
        this.completeBreakPhase(session);
      } else {
        this.completeStudyPhase(session);
      }
    }
  }

  updateTimerDisplays(remainingSeconds) {
    if (remainingSeconds < 0) remainingSeconds = 0;

    const h = Math.floor(remainingSeconds / 3600);
    const m = Math.floor((remainingSeconds % 3600) / 60);
    const s = remainingSeconds % 60;
    const timeString = `${String(h).padStart(2, "0")}:${String(m).padStart(
      2,
      "0"
    )}:${String(s).padStart(2, "0")}`;

    // Update internal
    if (this.domElements.globalTimerDisplay) {
      this.domElements.globalTimerDisplay.textContent = timeString;
    }

    // Update external (Main Timer)
    if (dom.timeEl) {
      dom.timeEl.textContent = timeString;
    }
  }

  completeStudyPhase(session) {
    // 1. Stop timer
    this.stopTimer(true); // Reset state

    // 2. Play sound
    playSound();

    // 3. Notification
    this.showNotification(
      `${studyUtils.getText("studyTimeUp")}: ${session.subject}`
    );

    // 4. Show Modal to start break
    // Use a dedicated method for alert actions
    this.currentAlertAction = () => {
      // Stop sound when user clicks OK
      stopSound();
      this.startBreak(session.id);
    };

    this.showAlert(
      `${studyUtils.getText("studyTimeUp")} ${studyUtils.getText(
        "forSubject"
      )} ${session.subject}. ${studyUtils.getText("startBreakQuestion")}`
    );
  }

  completeBreakPhase(session) {
    // 1. Mark as completed
    session.status = SessionStatus.COMPLETED;
    session.totalStudyTime += session.studyDuration * 60;
    session.currentTime = 0;

    // 2. Stop timer
    this.stopTimer(true);

    // 3. Play sound
    playSound();

    // 4. Notification
    this.showNotification(
      `${studyUtils.getText("breakTimeUp")}: ${session.subject}`
    );

    // 5. Find next session
    const nextSession = this.findNextSession(session);

    if (nextSession) {
      this.currentAlertAction = () => {
        // Stop sound when user clicks OK
        stopSound();
        this.startTimer(nextSession.id);
      };
      this.showAlert(
        `${studyUtils.getText("breakTimeUp")} ${studyUtils.getText(
          "startNextSessionQuestion"
        )} ${studyUtils.getText("forSubject")} ${nextSession.subject}`
      );
    } else {
      this.currentAlertAction = () => {
        // Stop sound when user clicks OK
        stopSound();
      };
      this.showAlert(`${studyUtils.getText("allSessionsCompleted")}`);
    }

    this.saveToStorage();
    this.updateUI();
  }

  findNextSession(currentSession) {
    const currentIndex = studyState.sessions.findIndex(
      (s) => s.id === currentSession.id
    );
    if (currentIndex === -1) return null;

    // Look for next idle session
    for (let i = currentIndex + 1; i < studyState.sessions.length; i++) {
      if (studyState.sessions[i].status === SessionStatus.IDLE) {
        return studyState.sessions[i];
      }
    }
    return null;
  }

  completeSession(session) {
    // Legacy method - kept for compatibility if needed, but now logic is split
    this.completeStudyPhase(session);
  }

  // Session Management
  addSession() {
    const day = parseInt(this.domElements.sessionDay.value);
    const subject = this.domElements.sessionSubject.value.trim();
    const studyDuration = parseInt(this.domElements.sessionStudyDuration.value);
    const breakDuration = parseInt(this.domElements.sessionBreakDuration.value);

    // Validation
    if (!this.validateSession(subject, studyDuration)) {
      return;
    }

    const session = new StudySession({
      day,
      subject,
      studyDuration,
      breakDuration,
    });

    studyState.sessions.push(session);
    this.saveToStorage();
    this.updateUI();
    this.clearForm();

    // this.showNotification(`Session added: ${subject}`);
  }

  editSession(sessionId) {
    const session = studyState.sessions.find((s) => s.id === sessionId);
    if (!session) return;

    // Set editing session ID
    this.editingSessionId = sessionId;

    // Populate form with session data
    this.domElements.sessionDay.value = session.day;
    this.domElements.sessionSubject.value = session.subject;
    this.domElements.sessionStudyDuration.value = session.studyDuration;
    this.domElements.sessionBreakDuration.value = session.breakDuration;

    // Change add button to update
    this.domElements.addSessionBtn.textContent =
      studyUtils.getText("saveButton");
  }


updateSession(sessionId) {
  const session = studyState.sessions.find(s => s.id === sessionId);
  if (!session) return;

  const day = parseInt(this.domElements.sessionDay.value);
  const subject = this.domElements.sessionSubject.value.trim();
  const studyDuration = parseInt(this.domElements.sessionStudyDuration.value);
  const breakDuration = parseInt(this.domElements.sessionBreakDuration.value);

  // Validation
  if (!this.validateSession(subject, studyDuration)) return;

  // Update session data
  session.day = day;
  session.subject = subject;
  session.studyDuration = studyDuration;
  session.breakDuration = breakDuration;
  session.updatedAt = new Date().toISOString();

  // Sync timer if this is the active session
  if (studyState.timerState.activeSessionId === sessionId) {
    const timer = studyState.timerState.globalTimer;

    // Adjust remaining time if necessary
    if (!timer.isPaused && timer.isRunning) {
      const now = Date.now();
      const remainingSeconds =
        (session.status === SessionStatus.RUNNING ? session.studyDuration : session.breakDuration) * 60 -
        timer.currentTime;
      timer.totalTime =
        session.status === SessionStatus.RUNNING
          ? session.studyDuration * 60
          : session.breakDuration * 60;
      timer.targetTime = now + remainingSeconds * 1000;
    }

    // Update session status to match timer
    if (session.status === SessionStatus.IDLE) {
      timer.isRunning = false;
      timer.isPaused = false;
    } else if (session.status === SessionStatus.RUNNING) {
      timer.isRunning = true;
      timer.isPaused = false;
    } else if (session.status === SessionStatus.PAUSED) {
      timer.isRunning = true;
      timer.isPaused = true;
    }
  }

  this.saveToStorage();
  this.updateUI();
  this.clearForm();

  // this.showNotification(`Session updated: ${subject}`);
}





deleteSession(sessionId) {
  const sessionIndex = studyState.sessions.findIndex(
    (s) => s.id === sessionId
  );
  if (sessionIndex === -1) return;

  const session = studyState.sessions[sessionIndex];

  // Stop timer if this session is running
  if (studyState.timerState.activeSessionId === sessionId) {
    this.stopTimer();
  }

  // Delete session from array
  studyState.sessions.splice(sessionIndex, 1);

  // If we were editing this session, exit editing mode
  if (this.editingSessionId === sessionId) {
    this.editingSessionId = null;

    if (this.domElements.addSessionBtn) {
      this.domElements.addSessionBtn.textContent =
        studyUtils.getText("addSession");
    }

    this.clearForm();
  }

  this.saveToStorage();
  this.updateUI();

  // this.showNotification(`Session deleted: ${session.subject}`);
}


  validateSession(subject, studyDuration) {
    if (!subject || subject.length === 0) {
      this.showAlert(studyUtils.getText("subjectRequired"));
      return false;
    }

    if (studyDuration <= 0) {
      this.showAlert(studyUtils.getText("durationRequired"));
      return false;
    }

    return true;
  }

  // UI Management
  updateUI() {
    this.updateGlobalTimer();
    this.updateSessionsTable();
    this.updateCurrentSessionInfo();

    // Ensure external display is synced if timer is running or paused
    if (studyState.timerState.globalTimer.isRunning) {
      if (studyState.timerState.globalTimer.isPaused) {
        const remainingMS =
          studyState.timerState.globalTimer.remainingTimeMS || 0;
        const remainingSeconds = Math.ceil(remainingMS / 1000);
        this.updateTimerDisplays(remainingSeconds);
      } else {
        const now = Date.now();
        const targetTime = studyState.timerState.globalTimer.targetTime;
        if (targetTime) {
          const remainingMS = Math.max(0, targetTime - now);
          const remainingSeconds = Math.ceil(remainingMS / 1000);
          this.updateTimerDisplays(remainingSeconds);
        }
      }
    }
  }

  updateGlobalTimer() {
    if (!this.domElements.globalTimerDisplay) return;

    if (studyState.timerState.globalTimer.isRunning) {
      if (studyState.timerState.globalTimer.isPaused) {
        // If paused, use the stored remaining time
        const remainingMS =
          studyState.timerState.globalTimer.remainingTimeMS || 0;
        const remainingSeconds = Math.ceil(remainingMS / 1000);
        this.updateTimerDisplays(remainingSeconds);
      } else {
        // If running, calculate based on target
        const now = Date.now();
        const targetTime = studyState.timerState.globalTimer.targetTime;
        if (targetTime) {
          const remainingMS = Math.max(0, targetTime - now);
          const remainingSeconds = Math.ceil(remainingMS / 1000);
          this.updateTimerDisplays(remainingSeconds);
        }
      }
    } else {
      // Reset or 0
      this.domElements.globalTimerDisplay.textContent = "00:00:00";
    }
  }

updateSessionsTable() {
  if (!this.domElements.sessionsTableBody) return;

  const tbody = this.domElements.sessionsTableBody;
  tbody.innerHTML = "";

  if (studyState.sessions.length === 0) {
    const row = document.createElement("tr");
    row.className = "no-sessions";
    row.innerHTML = `<td colspan="6">${studyUtils.getText("noSessionsMessage")}</td>`;
    tbody.appendChild(row);
    return;
  }

  const selectedDay = parseInt(this.domElements.sessionDay.value); 
  const lang = app.currentLang || localStorage.getItem("lang") || "en";

  const daySessions = studyState.sessions.filter(s => s.day === selectedDay);

   const dayRow = document.createElement("tr");
  dayRow.className = "day-header";
  dayRow.id = `day-${selectedDay}`;
  dayRow.innerHTML = `<td colspan="6"><strong>${DaysOfWeek[lang][selectedDay]}</strong></td>`;
  tbody.appendChild(dayRow);

  if (daySessions.length === 0) {
    const row = document.createElement("tr");
    row.className = "no-sessions";
    row.innerHTML = `<td colspan="6">${studyUtils.getText('noSessionsForDay')}</td>`;
    tbody.appendChild(row);
    return;
  }

  daySessions.forEach(session => {
    const row = this.createSessionRow(session);
    tbody.appendChild(row);
  });
}




  createSessionRow(session) {
    const row = document.createElement("tr");

    // Ensure language is valid
    let lang = app.currentLang;
    if (!lang || !DaysOfWeek[lang]) {
      lang = localStorage.getItem("lang") || "en";
    }

    const dayName = DaysOfWeek[lang]
      ? DaysOfWeek[lang][session.day]
      : DaysOfWeek["en"][session.day];
    const statusClass = `status-${session.status}`;
    const statusText = studyUtils.getText(
      `session${
        session.status.charAt(0).toUpperCase() + session.status.slice(1)
      }`
    );

    row.innerHTML = `
      <td>${dayName}</td>
      <td>${session.subject}</td>
      <td>${session.studyDuration} min</td>
      <td>${session.breakDuration} min</td>
      <td><span class="status-badge ${statusClass}">${statusText}</span></td>
      <td>
        <div class="action-buttons">
          ${this.getActionButtons(session)}
        </div>
      </td>
    `;

    return row;
  }

  getActionButtons(session) {
    const isActive = studyState.timerState.activeSessionId === session.id;
    let buttons = "";

    if (session.status === SessionStatus.RUNNING) {
      buttons += `<button class="btn btn-warning btn-sm" onclick="studySchedule.pauseTimer()">${studyUtils.getText(
        "pauseSession"
      )}</button>`;
      buttons += `<button class="btn btn-danger btn-sm" onclick="studySchedule.resetTimer()">${studyUtils.getText(
        "resetSession"
      )}</button>`;
    } else if (session.status === SessionStatus.PAUSED) {
      buttons += `<button class="btn btn-primary btn-sm" onclick="studySchedule.resumeTimer()">${studyUtils.getText(
        "resumeSession"
      )}</button>`;
      buttons += `<button class="btn btn-danger btn-sm" onclick="studySchedule.resetTimer()">${studyUtils.getText(
        "resetSession"
      )}</button>`;
    } else if (session.status === SessionStatus.IDLE) {
      buttons += `<button class="btn btn-primary btn-sm" onclick="studySchedule.startTimer('${
        session.id
      }')">${studyUtils.getText("startSession")}</button>`;
    }

    if (!isActive) {
      buttons += `<button class="btn btn-secondary btn-sm" onclick="studySchedule.editSession('${
        session.id
      }')">${studyUtils.getText("editSession")}</button>`;
      buttons += `<button class="btn btn-danger btn-sm" onclick="studySchedule.deleteSession('${
        session.id
      }')">${studyUtils.getText("deleteSession")}</button>`;
    }

    return buttons;
  }

 


  updateCurrentSessionInfo() {
    if (!this.domElements.currentSessionInfo) return;

    const session = studyState.sessions.find(
      (s) => s.id === studyState.timerState.activeSessionId
    );
    if (session) {
      this.domElements.currentSessionInfo.textContent = `${studyUtils.getText(
        "currentSessionLabel"
      )}: ${session.subject}`;
    } else {
      this.domElements.currentSessionInfo.textContent = `${studyUtils.getText(
        "currentSessionLabel"
      )}: ${studyUtils.getText("sessionIdle")}`;
    }
  }

  // Modal Management
async showModal() {
  if (!this.domElements.studyScheduleModal) return;

  const daySelect = this.domElements.sessionDay;
  if (daySelect) {
    const today = new Date().getDay(); 
    daySelect.value = today;
  }

  // Force show the modal
  this.domElements.studyScheduleModal.style.display = "flex";
  this.domElements.studyScheduleModal.style.visibility = "visible";
  this.domElements.studyScheduleModal.style.opacity = "1";

  this.updateUI();
  this.updateLocalizedText();
}

  async hideModal() {
    if (!this.domElements.studyScheduleModal) return;
    this.domElements.studyScheduleModal.style.display = "none";

    // Restore original window size
    /*
    try {
        if (window.__TAURI__) {
            const { getCurrentWindow, LogicalSize } = window.__TAURI__.window;
            const appWindow = getCurrentWindow();
            // Restore to default size 400x770
            await appWindow.setSize(new LogicalSize(400, 770));
            // Optional: Center the window after resizing
            await appWindow.center();
        }
    } catch (e) {
        // Ignore errors
    }
    */
  }

  showAlert(message) {
    if (
      !this.domElements.studyAlertModal ||
      !this.domElements.studyAlertMessage
    )
      return;

    this.domElements.studyAlertMessage.textContent = message;
    this.domElements.studyAlertModal.style.display = "flex";
  }

  hideAlert() {
    if (!this.domElements.studyAlertModal) return;
    this.domElements.studyAlertModal.style.display = "none";
  }

  // Localization
  updateLocalizedText() {
    // Ensure language is valid
    let lang = app.currentLang;
    if (!lang || !DaysOfWeek[lang]) {
      lang = localStorage.getItem("lang") || "en";
    }

    // Update modal title and labels
    const elements = [
      "studyScheduleTitle",
      "dayLabel",
      "subjectLabel",
      "studyDurationLabel",
      "breakDurationLabel",
      "statusLabel",
      "actionsLabel",
      "globalTimerLabel",
      "currentSessionLabel",
      "addSession",
      "okButton",
      "cancelButton",
    ];

    elements.forEach((id) => {
      const elList = document.querySelectorAll(`[data-i18n="${id}"]`);
      elList.forEach((element) => {
        element.textContent = studyUtils.getText(id);
      });
    });

    // Update placeholders
    const subjectInput = document.getElementById("sessionSubject");
    if (subjectInput) {
      subjectInput.placeholder = studyUtils.getText("subjectPlaceholder");
    }

    // Update day options
    const daySelect = document.getElementById("sessionDay");
    if (daySelect) {
      Array.from(daySelect.options).forEach((option, index) => {
        if (DaysOfWeek[lang] && DaysOfWeek[lang][index]) {
          option.textContent = DaysOfWeek[lang][index];
        }
      });
    }
  }

  // Storage Management
  loadFromStorage() {
    try {
      const stored = localStorage.getItem("studyScheduleData");
      if (stored) {
        const data = JSON.parse(stored);

        // Load sessions
        if (data.sessions) {
          studyState.sessions = data.sessions.map((s) => new StudySession(s));
        }

        // Load timer state
        if (data.timerState) {
          Object.assign(studyState.timerState, data.timerState);

          // Restore UI state if in a session
          if (studyState.timerState.activeSessionId) {
            // Ensure main timer is stopped and controls disabled
            stopMainTimer();
            this.toggleMainControls(true);
          }

          // Fix timer state if it was running
          if (
            studyState.timerState.globalTimer.isRunning &&
            !studyState.timerState.globalTimer.isPaused
          ) {
            // Check if time has passed while closed
            const now = Date.now();
            const targetTime = studyState.timerState.globalTimer.targetTime;

            if (targetTime) {
              if (now >= targetTime) {
                // Session finished while closed
                const session = studyState.sessions.find(
                  (s) => s.id === studyState.timerState.activeSessionId
                );
                if (session) {
                  this.completeSession(session);
                } else {
                  this.stopTimer();
                }
              } else {
                // Resume timer
                this.timerInterval = setInterval(
                  () => this.updateTimer(),
                  1000
                );

                // Immediately update UI
                this.updateTimer();
              }
            } else {
              // Invalid state, stop
              this.stopTimer();
            }
          }
        }
      }
    } catch (error) {
      console.error("Error loading study schedule data:", error);
    }
  }

  saveToStorage() {
    try {
      const data = {
        sessions: studyState.sessions,
        timerState: studyState.timerState,
      };
      localStorage.setItem("studyScheduleData", JSON.stringify(data));
    } catch (error) {
      console.error("Error saving study schedule data:", error);
    }
  }

  // Utility Methods
clearForm() {
    if (this.domElements.sessionForm) {

      const currentDay = this.domElements.sessionDay.value;
      this.domElements.sessionForm.reset();

      this.domElements.sessionDay.value = currentDay;
    }

    this.editingSessionId = null;

    if (this.domElements.addSessionBtn) {
      this.domElements.addSessionBtn.textContent =
        studyUtils.getText("addSession");
    }
}


  async showNotification(message) {
    // 1. Try Tauri Invoke (Rust Command) - Most Reliable for this App
    if (window.__TAURI__) {
      try {
        const invoke = window.__TAURI__.core.invoke || window.__TAURI__.invoke;
        if (invoke) {
          await invoke("show_notification", {
            title: studyUtils.getText("studyScheduleTitle"),
            body: message,
          });
          return; // Success
        }
      } catch (e) {
        console.error("Tauri notification failed:", e);
      }
    }

    // 2. Try standard Web Notification API
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("Study Schedule", {
          body: message,
          icon: "assets/icon.png",
        });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification("Study Schedule", {
              body: message,
              icon: "assets/icon.png",
            });
          }
        });
      }
    }

    // 3. Fallback to existing internal notification if defined
    if (window.showNotification) {
      window.showNotification(message);
    }
  }

  startUpdateLoop() {
    this.updateInterval = setInterval(() => {
      this.updateUI();
    }, 1000);
  }

  destroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}

// Initialize the study schedule manager
let studySchedule;

// Initialize when DOM is ready
function initializeStudySchedule() {
  if (!studySchedule) {
    studySchedule = new StudyScheduleManager();
    window.studySchedule = studySchedule;
  }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeStudySchedule);
} else {
  initializeStudySchedule();
}

// Make it globally available
window.studySchedule = studySchedule;
