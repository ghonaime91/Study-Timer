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
  localStorage.removeItem("timerEndTime");
  localStorage.removeItem("timerRunning");
  localStorage.removeItem("timerCallback");
  if(!dom.pomodoroCycle.checked) localStorage.removeItem("pomodoroState");
}

function resetTimer() {
  stopTimer();
  app.totalSeconds = 0;
  updateDisplay();
  dom.hours.value = dom.minutes.value = "";
  localStorage.removeItem("pomodoroState");
}

/* ===== Start Pomodoro Cycle ===== */
function startPomodoroCycle(workMinutes=25, shortBreak=5, longBreak=15, maxCycles=4) {
  if(!app.pomodoroState) app.pomodoroState = { session:"work", cycle:0 };

  // Store Pomodoro settings
  app.pomodoroState.settings = { workMinutes, shortBreak, longBreak, maxCycles };

  // Start the first work session
  app.totalSeconds = workMinutes*60;
  app.pomodoroState.session = "work";
  updateDisplay();
  localStorage.setItem("pomodoroState", JSON.stringify(app.pomodoroState));

function nextSession() {
  if(!dom.pomodoroCycle.checked) return; // Stop if Pomodoro is disabled

  const settings = app.pomodoroState.settings;

  if(app.pomodoroState.session === "work") {
    // Finished work session
    app.pomodoroState.cycle++; 

    if(app.pomodoroState.cycle >= settings.maxCycles) {
      // Last work session completed → long break
      app.totalSeconds = settings.longBreak*60;
      app.pomodoroState.session = "longBreak";
      // reset for next Pomodoro round
      app.pomodoroState.cycle = 0; 
    } else {
      // Normal work session → short break
      app.totalSeconds = settings.shortBreak*60;
      app.pomodoroState.session = "break";
    }

  } else if(app.pomodoroState.session === "break") {
    // After short break → start next work session
    app.totalSeconds = settings.workMinutes*60;
    app.pomodoroState.session = "work";
  } else if(app.pomodoroState.session === "longBreak") {
    // After long break → start fresh work session
    app.totalSeconds = settings.workMinutes*60;
    app.pomodoroState.session = "work";
  }

  app.endTime = Date.now() + app.totalSeconds*1000;
  updateDisplay();
  localStorage.setItem("pomodoroState", JSON.stringify(app.pomodoroState));
  startTimerReal(nextSession,true);
}

  app.endTime = Date.now() + app.totalSeconds*1000;
  startTimerReal(nextSession,true);
}

/* ===== Pomodoro UI Events ===== */
dom.pomodoroCycle.addEventListener("change", ()=>{
  if(dom.pomodoroCycle.checked) dom.pomodoroModal.style.display = "flex";
  else {
    stopTimer();
    app.totalSeconds = 0;
    updateDisplay();
    localStorage.removeItem("pomodoroState");
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
      beep();
      showModal(texts[app.currentLang].alertFinished);
    } else {
      // Timer still running, resume
      app.totalSeconds = remaining;
      app.endTime = savedEnd;
      updateDisplay();

      const hasCallback = localStorage.getItem("timerCallback") === "pomodoro";

      if (hasCallback && dom.pomodoroCycle.checked) {
        startTimerReal(() => {
          if (dom.pomodoroCycle.checked) {
            const settings = app.pomodoroState.settings || {
              workMinutes: 25,
              shortBreak: 5,
              longBreak: 15,
              maxCycles: 4,
            };
            startPomodoroCycle(
              settings.workMinutes,
              settings.shortBreak,
              settings.longBreak,
              settings.maxCycles
            );
          }
        }, true, true);
      } else {
        startTimerReal(null, true, true);
      }
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
    const now = Date.now();
    const savedEnd = parseInt(savedEndTime);
    if(now>=savedEnd) beep();
  }
},1000);

/* ===== Control Buttons ===== */
document.getElementById("startBtn").addEventListener("click",()=>{
  if("Notification" in window && Notification.permission==="default") Notification.requestPermission();
  startTimerReal();
});
document.getElementById("stopBtn").addEventListener("click",()=>stopTimer());
document.getElementById("resetBtn").addEventListener("click",()=>{
  dom.pomodoroCycle.checked=false;
  resetTimer();
});

export { startTimerReal, stopTimer, resetTimer, startPomodoroCycle, beep, showModal, closeModal };
