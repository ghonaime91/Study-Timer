/* ===== Variables ===== */
let timer = null;
let totalSeconds = 0;
let running = false;
let endTime = 0;
let pomodoroState = { session: "work", cycle: 0 };

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let osc = null,
    gain = null;
let mediaMedia = null;
let soundLoopTimer = null; // Timer for sound loops
let soundAutoStopTimer = null; // Timer for 60s stop

/* ===== UI Elements ===== */
const soundType = document.getElementById("soundType");
const freq = document.getElementById("freq");
const volume = document.getElementById("volume");
const pomodoroCycle = document.getElementById("pomodoroCycle");
const timeEl = document.getElementById("time");
const hours = document.getElementById("hours");
const minutes = document.getElementById("minutes");
const alertModal = document.getElementById("alertModal");
const modalText = document.getElementById("modalText");
const customFile = document.getElementById("customFile");
const playBtn = document.getElementById("playBtn");

const pomoWork = document.getElementById("pomoWork");
const pomoShort = document.getElementById("pomoShort");
const pomoLong = document.getElementById("pomoLong");
const pomoCycles = document.getElementById("pomoCycles");
const pomoOkBtn = document.getElementById("pomoOkBtn");
const pomodoroModal = document.getElementById("pomodoroModal");

const langSelect = document.getElementById("langSelect");
const autostartToggle = document.getElementById("autostartToggle");
const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settingsModal");
const settingsOkBtn = document.getElementById("settingsOkBtn");

let currentLang = localStorage.getItem("lang") || "en";

/* ===== Localization Text ===== */
const texts = {
    en: {
        appTitleHeader: "Study Timer",
        timerEmpty: "Set a time first ⏱️",
        studyFinished: "Finished study!",
        breakFinished: "Finished break!",
        pomodoroFinished: "Finished session!",
        alertFinished: "Time's up!",
        pomodoroTitle: "Pomodoro Settings",
        selectLang: "Select Language",
        modalOk: "OK",
        studyLabel: "Study (min)",
        shortBreakLabel: "Short Break (min)",
        longBreakLabel: "Long Break (min)",
        cyclesLabel: "Cycles",
        soundTypeLabel: "Sound Type",
        freqLabel: "Frequency",
        volumeLabel: "Volume",
        testBtn: "Test Sound",
        stopBtn: "Stop Sound",
        startBtn: "Start",
        stopTimerBtn: "Stop",
        resetBtn: "Reset",
        pomodoroCycleLabel: "Pomodoro Auto Cycle",
        uploadLabel: "Upload Sound / Video",
        hoursPlaceholder: "Hours",
        minutesPlaceholder: "Minutes",
        autostartLabel: "Start with Windows",
        settingsTitle: "Settings",
        langSelectLabel: "Language",
        customOption: "Custom Media",
        bell: "Bell 🔔",
        digital: "Digital ⏰",
        birds: "Birds 🐦",
        piano: "Piano 🎹",
        magic: "Magic ✨",
        sineOption: "Sine 〰️",
        triangleOption: "Triangle 🔺",
        squareOption: "Square ⬛",
        sawtoothOption: "Sawtooth 📉",
        autostartError:
            "Failed to update startup settings. Antivirus might be blocking it.",
    },
    ar: {
        appTitleHeader: "مؤقت المذاكرة",
        timerEmpty: "حدد وقت الأول ⏱️",
        studyFinished: "انتهت جلسة المذاكرة!",
        breakFinished: "انتهت الاستراحة!",
        pomodoroFinished: "انتهت الجلسة!",
        alertFinished: "خلصت المذاكرة 👏",
        pomodoroTitle: "إعدادات البومودورو",
        selectLang: "اختر اللغة",
        modalOk: "حسناً",
        studyLabel: "المذاكرة (دقيقة)",
        shortBreakLabel: "استراحة قصيرة (دقيقة)",
        longBreakLabel: "استراحة طويلة (دقيقة)",
        cyclesLabel: "عدد الدورات",
        soundTypeLabel: "نوع الصوت",
        freqLabel: "التردد",
        volumeLabel: "مستوى الصوت",
        testBtn: "تشغيل الصوت",
        stopBtn: "إيقاف الصوت",
        startBtn: "ابدأ",
        stopTimerBtn: "توقف",
        resetBtn: "إعادة ضبط",
        pomodoroCycleLabel: "دورة بومودورو تلقائية",
        uploadLabel: "رفع ملف صوت/فيديو",
        hoursPlaceholder: "ساعات",
        minutesPlaceholder: "دقائق",
        autostartLabel: "بدء مع تشغيل ويندوز",
        settingsTitle: "الإعدادات",
        langSelectLabel: "اللغة",
        customOption: "ملف مخصص",
        bell: "جرس 🔔",
        digital: "رقمي ⏰",
        birds: "عصافير 🐦",
        piano: "بيانو 🎹",
        magic: "سحر ✨",
        sineOption: "موجة جيبية 〰️",
        triangleOption: "مثلث 🔺",
        squareOption: "مربع ⬛",
        sawtoothOption: "سن المنشار 📉",
        autostartError:
            "فشل تحديث إعدادات بدء التشغيل. قد يكون برنامج الحماية يمنع ذلك.",
    },
};

/* ===== Update UI Language ===== */
function updateUIText() {
    currentLang = langSelect.value;
    localStorage.setItem("lang", currentLang);
    document.getElementById("appTitleHeader").textContent =
        texts[currentLang].appTitleHeader;
    hours.placeholder = texts[currentLang].hoursPlaceholder;
    minutes.placeholder = texts[currentLang].minutesPlaceholder;
    // Pomodoro modal text
    pomodoroModal.querySelector("h3").textContent =
        texts[currentLang].pomodoroTitle;
    pomodoroModal.querySelector('label[for="pomoWork"]').textContent =
        texts[currentLang].studyLabel;
    pomodoroModal.querySelector('label[for="pomoShort"]').textContent =
        texts[currentLang].shortBreakLabel;
    pomodoroModal.querySelector('label[for="pomoLong"]').textContent =
        texts[currentLang].longBreakLabel;
    pomodoroModal.querySelector('label[for="pomoCycles"]').textContent =
        texts[currentLang].cyclesLabel;
    pomoOkBtn.textContent = texts[currentLang].modalOk;

    // Settings modal text
    settingsModal.querySelector("h3").textContent =
        texts[currentLang].settingsTitle;
    document.getElementById("langSelectLabel").textContent =
        texts[currentLang].langSelectLabel;
    settingsOkBtn.textContent = texts[currentLang].modalOk;

    // Button labels
    document.querySelector(".start").textContent = texts[currentLang].startBtn;
    document.querySelector(".stop").textContent = texts[currentLang].stopTimerBtn;
    document.querySelector(".reset").textContent = texts[currentLang].resetBtn;
    document.querySelector(".test").textContent = texts[currentLang].testBtn;
    document.querySelector(".mute").textContent = texts[currentLang].stopBtn;

    // Settings labels
    document.querySelector('label[for="soundType"]').textContent =
        texts[currentLang].soundTypeLabel;
    document.querySelector('label[for="freq"]').textContent =
        texts[currentLang].freqLabel;
    document.querySelector('label[for="volume"]').textContent =
        texts[currentLang].volumeLabel;
    document.querySelector("#customFile").previousElementSibling.textContent =
        texts[currentLang].uploadLabel;
    document.querySelector("#pomodoroLabel").textContent =
        texts[currentLang].pomodoroCycleLabel;
    document.getElementById("autostartLabel").textContent =
        texts[currentLang].autostartLabel;
    document.getElementById("customOption").textContent =
        texts[currentLang].customOption;

    // Update sound options
    document.querySelector('option[value="bell"]').textContent =
        texts[currentLang].bell;
    document.querySelector('option[value="digital"]').textContent =
        texts[currentLang].digital;
    document.querySelector('option[value="birds"]').textContent =
        texts[currentLang].birds;
    document.querySelector('option[value="piano"]').textContent =
        texts[currentLang].piano;
    document.querySelector('option[value="magic"]').textContent =
        texts[currentLang].magic;

    document.getElementById("sineOption").textContent =
        texts[currentLang].sineOption;
    document.getElementById("triangleOption").textContent =
        texts[currentLang].triangleOption;
    document.getElementById("squareOption").textContent =
        texts[currentLang].squareOption;
    document.getElementById("sawtoothOption").textContent =
        texts[currentLang].sawtoothOption;
}

/* ===== Save & Load User Preferences ===== */
function saveSettings() {
    localStorage.setItem("soundType", soundType.value);
    localStorage.setItem("freq", freq.value);
    localStorage.setItem("volume", volume.value);
}
function loadSettings() {
    const savedType = localStorage.getItem("soundType");
    if (savedType && savedType !== "custom") {
        soundType.value = savedType;
    } else {
        // Reset to sine if it was custom (since file is lost on refresh) or not set
        soundType.value = "sine";
        localStorage.setItem("soundType", "sine");
    }

    if (localStorage.getItem("freq")) freq.value = localStorage.getItem("freq");
    if (localStorage.getItem("volume"))
        volume.value = localStorage.getItem("volume");
    if (localStorage.getItem("lang")) {
        currentLang = localStorage.getItem("lang");
        langSelect.value = currentLang;
    }

    // Apply sound settings if active
    if (osc) {
        osc.frequency.value = freq.value;
        gain.gain.value = volume.value;
    }
    if (mediaMedia) mediaMedia.volume = volume.value;
}
loadSettings();
updateUIText();

/* ===== Autostart Toggle (UI + Plugin Integration) ===== */
async function initAutostartUI() {
    const saved = localStorage.getItem("autostart");
    autostartToggle.checked = saved === "true";
    if (window.__TAURI__) {
        try {
            const invoke = window.__TAURI__.core.invoke;
            const isEnabled = await invoke("plugin:autostart|is_enabled");
            autostartToggle.checked = !!isEnabled;
            const savedPref = saved === "true";
            if (savedPref !== !!isEnabled) {
                if (savedPref) await invoke("plugin:autostart|enable");
                else await invoke("plugin:autostart|disable");
                autostartToggle.checked = savedPref;
            }
        } catch (error) {
            console.error("Autostart state check failed:", error);
        }
    }
}

autostartToggle.addEventListener("change", async () => {
    const wantEnable = autostartToggle.checked;
    localStorage.setItem("autostart", wantEnable ? "true" : "false");
    if (window.__TAURI__) {
        try {
            const invoke = window.__TAURI__.core.invoke;
            if (wantEnable) {
                await invoke("plugin:autostart|enable");
                // Verify if it was actually enabled
                const isEnabled = await invoke("plugin:autostart|is_enabled");
                if (!isEnabled) throw new Error("Verification failed");
            } else await invoke("plugin:autostart|disable");
        } catch (error) {
            console.error("Failed to toggle autostart:", error);
            autostartToggle.checked = !wantEnable; // Revert UI
            showModal(
                texts[currentLang].autostartError ||
                "Failed to update startup settings: " + error
            );
        }
    }
});
/* ===== Sound Generation Logic ===== */
// Helper to play a tone
function playTone(freq, type, duration, startTime = 0, vol = 1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;

    // Envelope
    gain.gain.setValueAtTime(0, audioCtx.currentTime + startTime);
    gain.gain.linearRampToValueAtTime(
        vol * volume.value,
        audioCtx.currentTime + startTime + 0.05
    );
    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioCtx.currentTime + startTime + duration
    );

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(audioCtx.currentTime + startTime);
    osc.stop(audioCtx.currentTime + startTime + duration);

    return { osc, gain };
}

function createSound() {
    stopSound();

    // Check if user selected "Custom Media"
    if (soundType.value === "custom") {
        if (mediaMedia) {
            mediaMedia.loop = true; // Loop indefinitely
            mediaMedia.currentTime = 0;
            mediaMedia.play();
        }
        return;
    }

    // Synthesized Sounds
    const type = soundType.value;

    // Auto-stop after 60 seconds for all built-in sounds
    soundAutoStopTimer = setTimeout(stopSound, 60000);

    if (type === "bell") {
        const playBell = () => {
            const baseFreq = 523.25; // C5
            playTone(baseFreq, "sine", 2);
            playTone(baseFreq * 2, "sine", 1.5, 0, 0.5);
            playTone(baseFreq * 3, "sine", 1, 0, 0.25);
        };
        playBell();
        soundLoopTimer = setInterval(playBell, 3000);
        return;
    }

    if (type === "digital") {
        const playDigital = () => {
            playTone(880, "square", 0.1, 0);
            playTone(880, "square", 0.1, 0.2);
            playTone(880, "square", 0.1, 0.4);
        };
        playDigital();
        soundLoopTimer = setInterval(playDigital, 1000);
        return;
    }

    if (type === "birds") {
        const playBirds = () => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.frequency.setValueAtTime(1500, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(
                2500,
                audioCtx.currentTime + 0.1
            );
            osc.frequency.exponentialRampToValueAtTime(
                1500,
                audioCtx.currentTime + 0.2
            );

            gain.gain.setValueAtTime(0, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(
                volume.value,
                audioCtx.currentTime + 0.05
            );
            gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);

            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);

            setTimeout(() => {
                const osc2 = audioCtx.createOscillator();
                const gain2 = audioCtx.createGain();
                osc2.frequency.setValueAtTime(2500, audioCtx.currentTime);
                osc2.frequency.linearRampToValueAtTime(
                    1800,
                    audioCtx.currentTime + 0.1
                );
                gain2.gain.setValueAtTime(0, audioCtx.currentTime);
                gain2.gain.linearRampToValueAtTime(
                    volume.value,
                    audioCtx.currentTime + 0.05
                );
                gain2.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
                osc2.connect(gain2);
                gain2.connect(audioCtx.destination);
                osc2.start();
                osc2.stop(audioCtx.currentTime + 0.2);
            }, 300);
        };
        playBirds();
        soundLoopTimer = setInterval(playBirds, 2000);
        return;
    }

    if (type === "piano") {
        const playPiano = () => {
            playTone(440, "triangle", 1.5); // A4
            playTone(554.37, "triangle", 1.5, 0.1); // C#5
            playTone(659.25, "triangle", 1.5, 0.2); // E5
        };
        playPiano();
        soundLoopTimer = setInterval(playPiano, 3000);
        return;
    }

    if (type === "magic") {
        const playMagic = () => {
            const notes = [880, 1108, 1318, 1760];
            notes.forEach((f, i) => {
                playTone(f, "sine", 0.5, i * 0.1, 0.5);
            });
        };
        playMagic();
        soundLoopTimer = setInterval(playMagic, 2000);
        return;
    }

    // Standard Waveforms (Sine, Triangle, etc.)
    osc = audioCtx.createOscillator();
    gain = audioCtx.createGain();
    osc.type = soundType.value;
    osc.frequency.value = freq.value;
    gain.gain.value = volume.value;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
}

function stopSound() {
    if (soundLoopTimer) {
        clearInterval(soundLoopTimer);
        soundLoopTimer = null;
    }
    if (soundAutoStopTimer) {
        clearTimeout(soundAutoStopTimer);
        soundAutoStopTimer = null;
    }
    if (mediaMedia) {
        mediaMedia.pause();
        mediaMedia.currentTime = 0;
    }
    if (osc) {
        try {
            osc.stop();
        } catch (e) { }
        osc.disconnect();
        if (gain) gain.disconnect();
        osc = null;
        gain = null;
    }
}

soundType.addEventListener("click", (e) => { });

function handleSoundSelection() {
    saveSettings();
    if (audioCtx.state === "suspended") audioCtx.resume();
    stopSound();
    createSound();
}

soundType.addEventListener("change", handleSoundSelection);

// Try to support re-selection of same option
// Note: This is browser dependent and might not work in all browsers for standard selects
for (let i = 0; i < soundType.options.length; i++) {
    soundType.options[i].addEventListener("click", handleSoundSelection);
}
// Also handle 'input' just in case
soundType.addEventListener("input", handleSoundSelection);

[freq, volume].forEach((el) => {
    el.addEventListener("input", () => {
        saveSettings();
        if (osc && soundType.value !== "custom") {
            osc.frequency.value = freq.value;
            if (gain) gain.gain.value = volume.value;
        }
        if (mediaMedia) mediaMedia.volume = volume.value;
    });
});

/* ===== Custom Media Handling ===== */
customFile.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    stopSound();
    const url = URL.createObjectURL(file);
    if (file.type.startsWith("audio")) mediaMedia = new Audio(url);
    else if (file.type.startsWith("video")) {
        mediaMedia = document.createElement("video");
        mediaMedia.src = url;
        mediaMedia.style.display = "none";
        mediaMedia.muted = false;
        document.body.appendChild(mediaMedia);
    }
    mediaMedia.volume = volume.value;

    // Enable and select custom option
    const customOpt = document.getElementById("customOption");
    customOpt.style.display = "block";
    soundType.value = "custom";
    saveSettings();
});

/* ===== Play Sound Trigger ===== */
function playSound() {
    if (audioCtx.state === "suspended") audioCtx.resume();
    stopSound();
    createSound();
}
playBtn.addEventListener("click", playSound);

/* ===== Core Timer Logic ===== */
function updateDisplay() {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    timeEl.textContent = `${String(h).padStart(2, "0")}:${String(m).padStart(
        2,
        "0"
    )}:${String(s).padStart(2, "0")}`;
}

function startTimerReal(callbackEnd = null, ignoreInput = false) {
    if (running) return;
    if (totalSeconds === 0 && !ignoreInput) {
        const h = +hours.value || 0;
        const m = +minutes.value || 0;
        totalSeconds = h * 3600 + m * 60;
        if (!totalSeconds) return showModal(texts[currentLang].timerEmpty);
    }
    endTime = Date.now() + totalSeconds * 1000;
    localStorage.setItem("timerEndTime", endTime.toString());
    localStorage.setItem("timerRunning", "true");
    if (callbackEnd) localStorage.setItem("timerCallback", "pomodoro");
    else localStorage.removeItem("timerCallback");
    running = true;

    function checkTime() {
        if (!running) return;
        totalSeconds = Math.round((endTime - Date.now()) / 1000);
        if (totalSeconds <= 0) {
            totalSeconds = 0;
            updateDisplay();
            stopTimer();
            beep();
            showModal(
                callbackEnd? pomodoroState.session === "work"
                        ? texts[currentLang].studyFinished
                        : texts[currentLang].breakFinished
                    : texts[currentLang].alertFinished
            );
            if (callbackEnd) callbackEnd();
            return;
        }
        updateDisplay();
    }

    timer = setInterval(checkTime, 200);
    checkTime();
}

function stopTimer() {
    clearInterval(timer);
    running = false;
    localStorage.removeItem("timerEndTime");
    localStorage.removeItem("timerRunning");
    localStorage.removeItem("timerCallback");
    if (!pomodoroCycle.checked) localStorage.removeItem("pomodoroState");
}

function resetTimer() {
    stopTimer();
    totalSeconds = 0;
    updateDisplay();
    hours.value = minutes.value = "";
    localStorage.removeItem("pomodoroState");
}

/* ===== Pomodoro Cycle Management ===== */
function startPomodoroCycle(
    workMinutes = 25,
    shortBreak = 5,
    longBreak = 15,
    cycles = 4
) {
    pomodoroState = { session: "work", cycle: 0 };
    totalSeconds = workMinutes * 60;
    updateDisplay();
    localStorage.setItem("pomodoroState", JSON.stringify(pomodoroState));

    function nextSession() {
        if (!pomodoroCycle.checked) return;
        let isLongBreak =
            pomodoroState.cycle > 0 && pomodoroState.cycle % cycles === 0;
        if (isLongBreak) {
            totalSeconds = longBreak * 60;
            pomodoroState.session = "break";
        } else {
            totalSeconds =
                pomodoroState.session === "work" ? shortBreak * 60 : workMinutes * 60;
            pomodoroState.session =
                pomodoroState.session === "work" ? "break" : "work";
        }
        endTime = Date.now() + totalSeconds * 1000;
        updateDisplay();
        pomodoroState.cycle++;
        localStorage.setItem("pomodoroState", JSON.stringify(pomodoroState));
        startTimerReal(nextSession, true);
    }

    endTime = Date.now() + totalSeconds * 1000;
    startTimerReal(nextSession, true);
}

pomodoroCycle.addEventListener("change", () => {
    if (pomodoroCycle.checked) pomodoroModal.style.display = "flex";
    else {
        stopTimer();
        totalSeconds = 0;
        updateDisplay();
        localStorage.removeItem("pomodoroState");
    }
});

pomoOkBtn.addEventListener("click", () => {
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }
    pomodoroModal.style.display = "none";
    startPomodoroCycle(
        +pomoWork.value,
        +pomoShort.value,
        +pomoLong.value,
        +pomoCycles.value
    );
});

/* ===== Notification System ===== */
function beep() {
    // Try to send notification via Tauri Rust plugin
    if (window.__TAURI__) {
        const invoke = window.__TAURI__.core.invoke;
        invoke("show_notification", {
            title: currentLang === "ar" ? "مؤقت المذاكرة" : "Study Timer",
            body:
                pomodoroState.session === "work"
                    ? texts[currentLang].studyFinished
                    : texts[currentLang].breakFinished,
        }).catch((err) => console.error("Tauri notification failed:", err));
    }
    // Fallback to standard Web Notification API
    else if (
        document.hidden &&
        "Notification" in window &&
        Notification.permission === "granted"
    ) {
        new Notification(currentLang === "ar" ? "مؤقت المذاكرة" : "Study Timer", {
            body:
                pomodoroState.session === "work"
                    ? texts[currentLang].studyFinished
                    : texts[currentLang].breakFinished,
            icon: "icon.ico",
        });
    }

    if (audioCtx.state === "suspended")
        audioCtx
            .resume()
            .then(() => playSound())
            .catch(() => { });
    else playSound();
}

/* ===== Modal Utilities ===== */
function showModal(text) {
    modalText.textContent = text;
    alertModal.style.display = "flex";
}
function closeModal() {
    stopSound();
    alertModal.style.display = "none";
}

/* ===== Restore Timer State on Load ===== */
function resumeTimerOnLoad() {
    const savedEndTime = localStorage.getItem("timerEndTime");
    const savedRunning = localStorage.getItem("timerRunning");
    if (savedEndTime && savedRunning === "true") {
        const now = Date.now();
        const savedEnd = parseInt(savedEndTime);
        const remaining = Math.round((savedEnd - now) / 1000);
        const savedPomodoroState = localStorage.getItem("pomodoroState");
        if (savedPomodoroState)
            (pomodoroState = JSON.parse(savedPomodoroState)),
                (pomodoroCycle.checked = true);
        if (remaining <= 0) {
            totalSeconds = 0;
            updateDisplay();
            localStorage.removeItem("timerEndTime");
            localStorage.removeItem("timerRunning");
            localStorage.removeItem("timerCallback");
            localStorage.removeItem("pomodoroState");
            pomodoroCycle.checked = false;
            beep();
            showModal(texts[currentLang].alertFinished);
        } else {
            totalSeconds = remaining;
            endTime = savedEnd;
            updateDisplay();
            const hasCallback = localStorage.getItem("timerCallback") === "pomodoro";
            if (hasCallback && pomodoroCycle.checked) {
                startTimerReal(() => {
                    if (pomodoroCycle.checked)
                        startPomodoroCycle(
                            +pomoWork.value,
                            +pomoShort.value,
                            +pomoLong.value,
                            +pomoCycles.value
                        );
                }, true);
            } else startTimerReal(null, true);
        }
    }
}
window.addEventListener("load", resumeTimerOnLoad);
window.addEventListener("focus", resumeTimerOnLoad);

/* ===== Background Time Check ===== */
setInterval(() => {
    const savedEndTime = localStorage.getItem("timerEndTime");
    const savedRunning = localStorage.getItem("timerRunning");
    if (savedEndTime && savedRunning === "true") {
        const now = Date.now();
        const savedEnd = parseInt(savedEndTime);
        if (now >= savedEnd) beep();
    }
}, 1000);

/* ===== Settings Modal (Combined) ===== */
settingsBtn.addEventListener("click", () => {
    settingsModal.style.display = "flex";
});

settingsOkBtn.addEventListener("click", () => {
    settingsModal.style.display = "none";
    updateUIText(); // Update language if changed
});

/* ===== Control Buttons Event Listeners ===== */
document.getElementById("startBtn").addEventListener("click", () => {
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }
    startTimerReal();
});
document.getElementById("stopBtn").addEventListener("click", () => stopTimer());
document
    .getElementById("resetBtn")
    .addEventListener("click", () => resetTimer());

/* ===== Autostart Feature ===== */
window.addEventListener("load", initAutostartUI);
