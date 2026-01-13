import { app, audio, dom, texts, setCurrentLang } from "./globals.js";

/* ===== UI Language & Settings ===== */
function updateUIText() {
  setCurrentLang(dom.langSelect.value);
  document.getElementById("appTitleHeader").textContent =
    texts[app.currentLang].appTitleHeader;
  dom.hours.placeholder = texts[app.currentLang].hoursPlaceholder;
  dom.minutes.placeholder = texts[app.currentLang].minutesPlaceholder;
  // Pomodoro modal text
  dom.pomodoroModal.querySelector("h3").textContent =
    texts[app.currentLang].pomodoroTitle;
  dom.pomodoroModal.querySelector('label[for="pomoWork"]').textContent =
    texts[app.currentLang].studyLabel;
  dom.pomodoroModal.querySelector('label[for="pomoShort"]').textContent =
    texts[app.currentLang].shortBreakLabel;
  dom.pomodoroModal.querySelector('label[for="pomoLong"]').textContent =
    texts[app.currentLang].longBreakLabel;
  dom.pomodoroModal.querySelector('label[for="pomoCycles"]').textContent =
    texts[app.currentLang].cyclesLabel;
  dom.pomoOkBtn.textContent = texts[app.currentLang].modalOk;
  dom.pomoCancelBtn.textContent = texts[app.currentLang].cancelButton;

  // Settings modal text
  dom.settingsModal.querySelector("h3").textContent =
    texts[app.currentLang].settingsTitle;
  document.getElementById("langSelectLabel").textContent =
    texts[app.currentLang].langSelectLabel;
  dom.settingsOkBtn.textContent = texts[app.currentLang].modalOk;

  // Button labels
  document.querySelector(".start").textContent =
    texts[app.currentLang].startBtn;
  document.querySelector(".stop").textContent =
    texts[app.currentLang].stopTimerBtn;
  document.querySelector(".reset").textContent =
    texts[app.currentLang].resetBtn;
  document.querySelector(".test").textContent = texts[app.currentLang].testBtn;
  document.querySelector(".mute").textContent = texts[app.currentLang].stopBtn;

  // Settings labels
  document.querySelector('label[for="soundType"]').textContent =
    texts[app.currentLang].soundTypeLabel;
  document.querySelector('label[for="freq"]').textContent =
    texts[app.currentLang].freqLabel;
  document.querySelector('label[for="volume"]').textContent =
    texts[app.currentLang].volumeLabel;
  document.querySelector("#customFile").previousElementSibling.textContent =
    texts[app.currentLang].uploadLabel;
  document.querySelector("#pomodoroLabel").textContent =
    texts[app.currentLang].pomodoroCycleLabel;
  document.getElementById("autostartLabel").textContent =
    texts[app.currentLang].autostartLabel;
  document.getElementById("customOption").textContent =
    texts[app.currentLang].customOption;

  // Update sound options
  document.querySelector('option[value="bell"]').textContent =
    texts[app.currentLang].bell;
  document.querySelector('option[value="digital"]').textContent =
    texts[app.currentLang].digital;
  document.querySelector('option[value="birds"]').textContent =
    texts[app.currentLang].birds;
  document.querySelector('option[value="piano"]').textContent =
    texts[app.currentLang].piano;
  document.querySelector('option[value="magic"]').textContent =
    texts[app.currentLang].magic;

  document.getElementById("sineOption").textContent =
    texts[app.currentLang].sineOption;
  document.getElementById("triangleOption").textContent =
    texts[app.currentLang].triangleOption;
  document.getElementById("squareOption").textContent =
    texts[app.currentLang].squareOption;
  document.getElementById("sawtoothOption").textContent =
    texts[app.currentLang].sawtoothOption;

  // Theme Options Localization
  document.getElementById("themeSelectLabel").textContent =
    texts[app.currentLang].themeSelectLabel;
  document.querySelector('option[value="primary"]').textContent =
    texts[app.currentLang].primaryTheme;
  document.querySelector('option[value="dark"]').textContent =
    texts[app.currentLang].darkTheme;
  document.querySelector('option[value="light"]').textContent =
    texts[app.currentLang].lightTheme;
  document.querySelector('option[value="glassy"]').textContent =
    texts[app.currentLang].glassyTheme;

  // Study Schedule Button
  if (document.getElementById("studyScheduleBtn")) {
    document.getElementById("studyScheduleBtn").textContent =
      texts[app.currentLang].studyScheduleBtn;
  }

  // Update Study Schedule if initialized
  if (window.studySchedule) {
    window.studySchedule.updateLocalizedText();
    window.studySchedule.updateUI();
  }
}

function applyTheme(theme) {
  document.body.setAttribute("data-theme", theme);
}

function saveSettings() {
  localStorage.setItem("soundType", dom.soundType.value);
  localStorage.setItem("freq", dom.freq.value);
  localStorage.setItem("volume", dom.volume.value);
  localStorage.setItem("theme", dom.themeSelect.value);
}

function loadSettings() {
  const savedType = localStorage.getItem("soundType");
  if (savedType && savedType !== "custom") {
    dom.soundType.value = savedType;
  } else {
    dom.soundType.value = "sine";
    localStorage.setItem("soundType", "sine");
  }

  if (localStorage.getItem("freq"))
    dom.freq.value = localStorage.getItem("freq");
  if (localStorage.getItem("volume"))
    dom.volume.value = localStorage.getItem("volume");
  if (localStorage.getItem("lang")) {
    const saved = localStorage.getItem("lang");
    dom.langSelect.value = saved;
    setCurrentLang(saved);
  }

  const savedTheme = localStorage.getItem("theme") || "primary";
  dom.themeSelect.value = savedTheme;
  applyTheme(savedTheme);

  // Apply sound settings if active
  if (audio.osc) {
    audio.osc.frequency.value = dom.freq.value;
    if (audio.gain) audio.gain.gain.value = dom.volume.value;
  }
  if (audio.mediaMedia) audio.mediaMedia.volume = dom.volume.value;
}

// Initial settings load + texts update
loadSettings();
updateUIText();


// ---------- Update localStorage on sound changes only ---------- //
dom.soundType.addEventListener("change", () => {
  localStorage.setItem("soundType", dom.soundType.value);
});

dom.freq.addEventListener("input", () => {
  localStorage.setItem("freq", dom.freq.value);
});

dom.volume.addEventListener("input", () => {
  localStorage.setItem("volume", dom.volume.value);
});

dom.customFile.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  localStorage.setItem("customFileName", file.name);
});



// Listeners for UI settings
dom.langSelect.addEventListener("change", () => {
  updateUIText();
});

dom.themeSelect.addEventListener("change", () => {
  applyTheme(dom.themeSelect.value);
  saveSettings();
});

// Settings Modal open/close
dom.settingsBtn.addEventListener("click", () => {
  dom.settingsModal.style.display = "flex";
});

// Study Schedule Modal open/close
if (document.getElementById("studyScheduleBtn")) {
  document.getElementById("studyScheduleBtn").addEventListener("click", () => {
    // Wait for study schedule to be initialized
    const tryShowModal = () => {
      if (window.studySchedule && window.studySchedule.showModal) {
        window.studySchedule.showModal();
      } else {
        // Retry after a short delay
        setTimeout(tryShowModal, 100);
      }
    };
    tryShowModal();
  });
}

dom.settingsOkBtn.addEventListener("click", () => {
  dom.settingsModal.style.display = "none";
  updateUIText();
});

export { updateUIText, applyTheme, saveSettings, loadSettings };
