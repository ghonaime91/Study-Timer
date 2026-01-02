import { app, audio, dom, texts } from "./globals.js";

/* ===== Sound Generation Logic (ES Module) ===== */
// Helper to play a tone
function playTone(freqValue, type, duration, startTime = 0, vol = 1) {
  const oscLocal = audio.audioCtx.createOscillator();
  const gainLocal = audio.audioCtx.createGain();
  oscLocal.type = type;
  oscLocal.frequency.value = freqValue;

  // Envelope
  gainLocal.gain.setValueAtTime(0, audio.audioCtx.currentTime + startTime);
  gainLocal.gain.linearRampToValueAtTime(
    vol * dom.volume.value,
    audio.audioCtx.currentTime + startTime + 0.05
  );
  gainLocal.gain.exponentialRampToValueAtTime(
    0.001,
    audio.audioCtx.currentTime + startTime + duration
  );

  oscLocal.connect(gainLocal);
  gainLocal.connect(audio.audioCtx.destination);

  oscLocal.start(audio.audioCtx.currentTime + startTime);
  oscLocal.stop(audio.audioCtx.currentTime + startTime + duration);

  audio.activeOscillators.push(oscLocal);
  oscLocal.onended = () => {
    const index = audio.activeOscillators.indexOf(oscLocal);
    if (index > -1) audio.activeOscillators.splice(index, 1);
  };

  return { osc: oscLocal, gain: gainLocal };
}

function createSound() {
  stopSound();

  // Custom Media
  if (dom.soundType.value === "custom") {
    if (audio.mediaMedia) {
      audio.mediaMedia.loop = true;
      audio.mediaMedia.currentTime = 0;
      audio.mediaMedia.play();
    }
    return;
  }

  const type = dom.soundType.value;

  // Auto-stop after 60 seconds for built-in sounds
  audio.soundAutoStopTimer = setTimeout(stopSound, 60000);

  if (type === "bell") {
    const playBell = () => {
      const baseFreq = 523.25; // C5
      playTone(baseFreq, "sine", 2);
      playTone(baseFreq * 2, "sine", 1.5, 0, 0.5);
      playTone(baseFreq * 3, "sine", 1, 0, 0.25);
    };
    playBell();
    audio.soundLoopTimer = setInterval(playBell, 3000);
    return;
  }

  if (type === "digital") {
    const playDigital = () => {
      playTone(880, "square", 0.1, 0);
      playTone(880, "square", 0.1, 0.2);
      playTone(880, "square", 0.1, 0.4);
    };
    playDigital();
    audio.soundLoopTimer = setInterval(playDigital, 1000);
    return;
  }

  if (type === "birds") {
    const playBirds = () => {
      const osc1 = audio.audioCtx.createOscillator();
      const gain1 = audio.audioCtx.createGain();
      osc1.frequency.setValueAtTime(1500, audio.audioCtx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(
        2500,
        audio.audioCtx.currentTime + 0.1
      );
      osc1.frequency.exponentialRampToValueAtTime(
        1500,
        audio.audioCtx.currentTime + 0.2
      );

      gain1.gain.setValueAtTime(0, audio.audioCtx.currentTime);
      gain1.gain.linearRampToValueAtTime(
        dom.volume.value,
        audio.audioCtx.currentTime + 0.05
      );
      gain1.gain.linearRampToValueAtTime(0, audio.audioCtx.currentTime + 0.3);

      osc1.connect(gain1);
      gain1.connect(audio.audioCtx.destination);
      osc1.start();
      osc1.stop(audio.audioCtx.currentTime + 0.3);

      setTimeout(() => {
        const osc2 = audio.audioCtx.createOscillator();
        const gain2 = audio.audioCtx.createGain();
        osc2.frequency.setValueAtTime(2500, audio.audioCtx.currentTime);
        osc2.frequency.linearRampToValueAtTime(
          1800,
          audio.audioCtx.currentTime + 0.1
        );
        gain2.gain.setValueAtTime(0, audio.audioCtx.currentTime);
        gain2.gain.linearRampToValueAtTime(
          dom.volume.value,
          audio.audioCtx.currentTime + 0.05
        );
        gain2.gain.linearRampToValueAtTime(0, audio.audioCtx.currentTime + 0.2);
        osc2.connect(gain2);
        gain2.connect(audio.audioCtx.destination);
        osc2.start();
        osc2.stop(audio.audioCtx.currentTime + 0.2);
        audio.activeOscillators.push(osc2);
      }, 300);
    };
    playBirds();
    audio.soundLoopTimer = setInterval(playBirds, 2000);
    return;
  }

  if (type === "piano") {
    const playPiano = () => {
      playTone(440, "triangle", 1.5);
      playTone(554.37, "triangle", 1.5, 0.1);
      playTone(659.25, "triangle", 1.5, 0.2);
    };
    playPiano();
    audio.soundLoopTimer = setInterval(playPiano, 3000);
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
    audio.soundLoopTimer = setInterval(playMagic, 2000);
    return;
  }

  // Standard Waveforms
  audio.osc = audio.audioCtx.createOscillator();
  audio.gain = audio.audioCtx.createGain();
  audio.osc.type = dom.soundType.value;
  audio.osc.frequency.value = dom.freq.value;
  audio.gain.gain.value = dom.volume.value;
  audio.osc.connect(audio.gain);
  audio.gain.connect(audio.audioCtx.destination);
  audio.osc.start();
}

function stopSound() {
  if (audio.soundLoopTimer) {
    clearInterval(audio.soundLoopTimer);
    audio.soundLoopTimer = null;
  }
  if (audio.soundAutoStopTimer) {
    clearTimeout(audio.soundAutoStopTimer);
    audio.soundAutoStopTimer = null;
  }

  audio.activeOscillators.forEach((o) => {
    try {
      o.stop();
    } catch (e) {}
    try {
      o.disconnect();
    } catch (e) {}
  });
  audio.activeOscillators = [];

  if (audio.mediaMedia) {
    audio.mediaMedia.pause();
    audio.mediaMedia.currentTime = 0;
  }
  if (audio.osc) {
    try {
      audio.osc.stop();
    } catch (e) {}
    audio.osc.disconnect();
    if (audio.gain) audio.gain.disconnect();
    audio.osc = null;
    audio.gain = null;
  }
}

function handleSoundSelection() {
  if (audio.audioCtx.state === "suspended") audio.audioCtx.resume();
  stopSound();
  createSound();
}

dom.soundType.addEventListener("change", handleSoundSelection);
for (let i = 0; i < dom.soundType.options.length; i++) {
  dom.soundType.options[i].addEventListener("click", handleSoundSelection);
}
dom.soundType.addEventListener("input", handleSoundSelection);

[dom.freq, dom.volume].forEach((el) => {
  el.addEventListener("input", () => {
    if (audio.osc && dom.soundType.value !== "custom") {
      audio.osc.frequency.value = dom.freq.value;
      if (audio.gain) audio.gain.gain.value = dom.volume.value;
    }
    if (audio.mediaMedia) audio.mediaMedia.volume = dom.volume.value;
  });
});

// Custom Media Handling
dom.customFile.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  stopSound();
  const url = URL.createObjectURL(file);
  if (file.type.startsWith("audio")) audio.mediaMedia = new Audio(url);
  else if (file.type.startsWith("video")) {
    audio.mediaMedia = document.createElement("video");
    audio.mediaMedia.src = url;
    audio.mediaMedia.style.display = "none";
    audio.mediaMedia.muted = false;
    document.body.appendChild(audio.mediaMedia);
  }
  audio.mediaMedia.volume = dom.volume.value;

  const customOpt = document.getElementById("customOption");
  customOpt.style.display = "block";
  dom.soundType.value = "custom";
});

function playSound() {
  if (audio.audioCtx.state === "suspended") audio.audioCtx.resume();
  stopSound();
  createSound();
}
dom.playBtn.addEventListener("click", playSound);
dom.muteBtn.addEventListener("click", stopSound);

export { playSound, stopSound };
