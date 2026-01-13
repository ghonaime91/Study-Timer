import { app, audio, dom, texts } from "./globals.js";
import { playSound, stopSound } from "./sound.js";

/* ===== Core Timer & Pomodoro & Notifications (ES Module) ===== */
function updateDisplay() {
  const h = Math.floor(app.totalSeconds / 3600);
  const m = Math.floor((app.totalSeconds % 3600) / 60);
  const s = app.totalSeconds % 60;
  dom.timeEl.textContent = `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
}

function startTimerReal(callbackEnd = null, ignoreInput = false, resume = false) {
  if (app.running) return;

  // If not resuming and totalSeconds is 0, read input values
  if (!resume && app.totalSeconds === 0 && !ignoreInput) {
    const h = +dom.hours.value || 0;
    const m = +dom.minutes.value || 0;
    app.totalSeconds = h * 3600 + m * 60;
    if (!app.totalSeconds) return showModal(texts[app.currentLang].timerEmpty);
  }

  // If not resuming, set a new endTime
  if (!resume) {
    app.endTime = Date.now() + app.totalSeconds * 1000;
    localStorage.setItem("timerEndTime", app.endTime.toString());
  }

  // Clear any leftover paused state so a fresh start doesn't keep old paused data
  localStorage.removeItem("timerRemaining");
  localStorage.removeItem("timerStopped");

  localStorage.setItem("timerRunning", "true");

  if (callbackEnd) localStorage.setItem("timerCallback", "pomodoro");
  else localStorage.removeItem("timerCallback");

  // Clear any previous interval to prevent duplicates
  clearInterval(app.timer);
  app.running = true; 

  function checkTime() {
    if (!app.running) return;

    // Calculate remaining seconds based on real time
    app.totalSeconds = Math.round((app.endTime - Date.now()) / 1000);

    if (app.totalSeconds <= 0) {
      app.totalSeconds = 0;
      updateDisplay();
      stopTimer();
      beep();

      showModal(
        callbackEnd
          ? app.pomodoroState.session === "work"
            ? texts[app.currentLang].studyFinished
            : texts[app.currentLang].breakFinished
          : texts[app.currentLang].alertFinished
      );

      if (callbackEnd) callbackEnd();
      return;
    }

    updateDisplay();
  }

  // Run interval every 200ms for smooth update
  app.timer = setInterval(checkTime, 200);
  checkTime();
}


function stopTimer() {
  clearInterval(app.timer);
  app.running = false;
  // Save remaining seconds and mark as stopped so we can resume after a refresh
  localStorage.setItem("timerRemaining", String(app.totalSeconds));
  localStorage.setItem("timerStopped", "true");
  // Remove absolute end time but keep remaining - also mark running as false
  localStorage.removeItem("timerEndTime");
  localStorage.setItem("timerRunning", "false");
  if(!dom.pomodoroCycle.checked) localStorage.removeItem("pomodoroState");
} 

function resetTimer() {
  stopTimer();
  app.totalSeconds = 0;
  updateDisplay();
  dom.hours.value = dom.minutes.value = "";
  // Fully clear any saved timer state
  localStorage.removeItem("timerRemaining");
  localStorage.removeItem("timerStopped");
  localStorage.removeItem("timerRunning");
  localStorage.removeItem("timerEndTime");
  localStorage.removeItem("timerCallback");
  localStorage.removeItem("pomodoroState");
} 

/* ===== Start Pomodoro Cycle ===== */
function pomodoroNextSession() {
  if (!dom.pomodoroCycle.checked) return;
  const settings = (app.pomodoroState && app.pomodoroState.settings) ? app.pomodoroState.settings : { workMinutes: 25, shortBreak: 5, longBreak: 15, maxCycles: 4 };
  if (!app.pomodoroState) app.pomodoroState = { session: "work", cycle: 0 };

  if (app.pomodoroState.session === "work") {
    app.pomodoroState.cycle++;

    if (app.pomodoroState.cycle >= settings.maxCycles) {
      app.totalSeconds = settings.longBreak * 60;
      app.pomodoroState.session = "longBreak";
      app.pomodoroState.cycle = 0;
    } else {
      app.totalSeconds = settings.shortBreak * 60;
      app.pomodoroState.session = "break";
    }
  } else if (app.pomodoroState.session === "break" || app.pomodoroState.session === "longBreak") {
    app.totalSeconds = settings.workMinutes * 60;
    app.pomodoroState.session = "work";
  }

  app.endTime = Date.now() + app.totalSeconds * 1000;
  updateDisplay();
  localStorage.setItem("pomodoroState", JSON.stringify(app.pomodoroState));
  startTimerReal(pomodoroNextSession, true);
}

function startPomodoroCycle(workMinutes=25, shortBreak=5, longBreak=15, maxCycles=4) {
  if(!app.pomodoroState) app.pomodoroState = { session:"work", cycle:0 };

  // Store Pomodoro settings
  app.pomodoroState.settings = { workMinutes, shortBreak, longBreak, maxCycles };

  // Start the first work session
  app.totalSeconds = workMinutes*60;
  app.pomodoroState.session = "work";
  updateDisplay();
  localStorage.setItem("pomodoroState", JSON.stringify(app.pomodoroState));

  app.endTime = Date.now() + app.totalSeconds*1000;
  startTimerReal(pomodoroNextSession,true);
}

function loadPomodoroSettings() {
  dom.pomoWork.value   = localStorage.getItem("pomoWork")   || 25;
  dom.pomoShort.value  = localStorage.getItem("pomoShort")  || 5;
  dom.pomoLong.value   = localStorage.getItem("pomoLong")   || 15;
  dom.pomoCycles.value = localStorage.getItem("pomoCycles") || 4;
}


/* ===== Pomodoro UI Events ===== */
dom.pomodoroCycle.addEventListener("change", ()=>{
  if(dom.pomodoroCycle.checked) {
    loadPomodoroSettings(); 
    dom.pomodoroModal.style.display = "flex";
  } else {
    // Stop pomodoro and clear runtime state, but KEEP the last form inputs in localStorage
    stopTimer();
    app.totalSeconds = 0;
    updateDisplay();
    // Hide modal
    if (dom.pomodoroModal) dom.pomodoroModal.style.display = "none";

    // Remove only runtime pomodoro state (session/cycle) but do NOT remove saved settings
    localStorage.removeItem("pomodoroState");

    // Remove any pomodoro callback/paused state so it won't resume automatically
    localStorage.removeItem("timerCallback");
    localStorage.removeItem("timerRemaining");
    localStorage.removeItem("timerStopped");
  }
});

dom.pomoOkBtn.addEventListener("click", ()=>{
  if("Notification" in window && Notification.permission==="default") {
    Notification.requestPermission();
  }

  dom.pomodoroModal.style.display = "none";

  localStorage.setItem("pomoWork", dom.pomoWork.value);
  localStorage.setItem("pomoShort", dom.pomoShort.value);
  localStorage.setItem("pomoLong", dom.pomoLong.value);
  localStorage.setItem("pomoCycles", dom.pomoCycles.value);

  startPomodoroCycle(+dom.pomoWork.value, +dom.pomoShort.value, +dom.pomoLong.value, +dom.pomoCycles.value);
});


dom.pomoCancelBtn.addEventListener("click",()=>{

  dom.pomodoroCycle.checked = false;
  dom.pomodoroModal.style.display = "none";
});

/* ===== Notifications ===== */
function beep() {
  if(window.__TAURI__) {
    const invoke = window.__TAURI__.core.invoke;
    invoke("show_notification", {
      title: app.currentLang==="ar"?"مؤقت المذاكرة":"Study Timer",
      body: app.pomodoroState.session==="work"?texts[app.currentLang].studyFinished:texts[app.currentLang].breakFinished
    }).catch(err=>console.error("Tauri notification failed:",err));
  }
  else if(document.hidden && "Notification" in window && Notification.permission==="granted") {
    new Notification(app.currentLang==="ar"?"مؤقت المذاكرة":"Study Timer",{
      body: app.pomodoroState.session==="work"?texts[app.currentLang].studyFinished:texts[app.currentLang].breakFinished,
      icon:"icon.ico"
    });
  }

  if(audio.audioCtx.state==="suspended") audio.audioCtx.resume().then(()=>playSound()).catch(()=>{});
  else playSound();
}

/* ===== Modal Utilities ===== */
function showModal(text){ dom.modalText.textContent=text; dom.alertModal.style.display="flex";}
function closeModal(e){ if(e)e.preventDefault(); try{ stopSound(); } catch(err){ console.error(err);} if(dom.alertModal) dom.alertModal.style.display="none"; }

dom.alertOkBtn.addEventListener("click",closeModal);

/* ===== Restore Timer on Load ===== */
function resumeTimerOnLoad() {
  const savedEndTime = localStorage.getItem("timerEndTime");
  const savedRunning = localStorage.getItem("timerRunning");
  const savedRemaining = localStorage.getItem("timerRemaining");
  const savedStopped = localStorage.getItem("timerStopped");

  if (savedEndTime && savedRunning === "true") {
    const savedPomodoroState = localStorage.getItem("pomodoroState");
    const now = Date.now();
    const savedEnd = parseInt(savedEndTime);
    const remaining = Math.round((savedEnd - now) / 1000);

    if (savedPomodoroState) {
      // Restore Pomodoro state
      app.pomodoroState = JSON.parse(savedPomodoroState);
      dom.pomodoroCycle.checked = true;
    }

    if (remaining <= 0) {
      // Timer already finished
      app.totalSeconds = 0;
      updateDisplay();
      localStorage.removeItem("timerEndTime");
      localStorage.removeItem("timerRunning");
      localStorage.removeItem("timerCallback");
      localStorage.removeItem("pomodoroState");
      dom.pomodoroCycle.checked = false;
      // If a study schedule exists, let it handle notifications and modals — do not show external modal
      if (!localStorage.getItem("studyScheduleData")) {
        beep();
        showModal(texts[app.currentLang].alertFinished);
      } else {
        // Ensure any external paused flags are cleared so external timer stays quiet
        localStorage.removeItem("timerRemaining");
        localStorage.removeItem("timerStopped");
      }
    } else {
      // Timer still running, resume
      app.totalSeconds = remaining;
      app.endTime = savedEnd;
      updateDisplay();

      const hasCallback = localStorage.getItem("timerCallback") === "pomodoro";

      if (hasCallback && dom.pomodoroCycle.checked) {
        startTimerReal(pomodoroNextSession, true, true);
      } else {
        startTimerReal(null, true, true);
      }
    }
  } else if (savedRemaining && savedStopped === "true") {
    const remaining = parseInt(savedRemaining);
    const savedPomodoroState = localStorage.getItem("pomodoroState");

    if (savedPomodoroState) {
      // Restore Pomodoro state configuration but do NOT auto-start
      app.pomodoroState = JSON.parse(savedPomodoroState);
      dom.pomodoroCycle.checked = true;
    }

    if (remaining <= 0) {
      app.totalSeconds = 0;
      updateDisplay();
      localStorage.removeItem("timerRemaining");
      localStorage.removeItem("timerStopped");
      localStorage.removeItem("timerRunning");
      localStorage.removeItem("timerCallback");
      if (!dom.pomodoroCycle.checked) localStorage.removeItem("pomodoroState");
      // If study schedule exists, let it handle the completion modal/notification
      if (!localStorage.getItem("studyScheduleData")) {
        beep();
        showModal(texts[app.currentLang].alertFinished);
      }
    } else {
      // Keep timer stopped at the saved remaining seconds; do NOT auto-resume.
      app.totalSeconds = remaining;
      updateDisplay();
      // Ensure we are marked as stopped
      app.running = false;
      localStorage.setItem("timerRunning", "false");
      // Leave timerRemaining and timerStopped in localStorage so user can press Start to resume
    }
  }
}

window.addEventListener("load", resumeTimerOnLoad);
window.addEventListener("focus", resumeTimerOnLoad);


window.addEventListener("load",resumeTimerOnLoad);
window.addEventListener("focus",resumeTimerOnLoad);

/* ===== Background Time Check ===== */
setInterval(()=>{
  const savedEndTime = localStorage.getItem("timerEndTime");
  const savedRunning = localStorage.getItem("timerRunning");
  if(savedEndTime && savedRunning==="true"){
    // If a study schedule exists, skip external beep as the schedule will handle notifications
    if (localStorage.getItem("studyScheduleData")) return;
    const now = Date.now();
    const savedEnd = parseInt(savedEndTime);
    if(now>=savedEnd) beep();
  }
},1000);

/* ===== Control Buttons ===== */
document.getElementById("startBtn").addEventListener("click",()=>{
  if("Notification" in window && Notification.permission==="default") Notification.requestPermission();
  const hasCallback = localStorage.getItem("timerCallback") === "pomodoro";
  if (hasCallback && dom.pomodoroCycle.checked) {
    startTimerReal(pomodoroNextSession);
  } else {
    startTimerReal();
  }
});
document.getElementById("stopBtn").addEventListener("click",()=>stopTimer());
document.getElementById("resetBtn").addEventListener("click",()=>{
  dom.pomodoroCycle.checked=false;
  resetTimer();
});

export { startTimerReal, stopTimer, resetTimer, startPomodoroCycle, beep, showModal, closeModal };
