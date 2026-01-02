// Use-case: startTimer
// Pure application logic with dependency inversion via ports (time, storage)
// It doesn't touch DOM, Web APIs, or Tauri directly.

/**
 * @typedef {Object} StartTimerParams
 * @property {Object} app - reference to application state (app from globals)
 * @property {Object} time - TimePort: { now:()=>number, setInterval:(fn,ms)=>any, clearInterval:(id)=>void }
 * @property {Object} storage - StoragePort: { set:(k,v)=>void, get:(k)=>string|null, remove:(k)=>void }
 * @property {number|null} [seconds] - initial seconds to start from; if null uses app.totalSeconds
 * @property {Function|null} [callbackEnd] - optional continuation (e.g., pomodoro next session)
 * @property {Function} onTick - callback called on each tick with {totalSeconds}
 * @property {Function} onComplete - callback called when timer completes
 * @property {number} [intervalMs] - tick interval
 */

/**
 * Starts the timer and updates state + storage. Returns true if started, false if ignored.
 * @param {StartTimerParams} params
 */
export function startTimer({ app, time, storage, seconds = null, callbackEnd = null, onTick, onComplete, intervalMs = 200 }) {
  if (app.running) return false;

  if ((app.totalSeconds === 0 && seconds == null)) {
    return false; // controller should validate input and pass seconds
  }

  if (seconds != null) app.totalSeconds = seconds;

  app.endTime = time.now() + app.totalSeconds * 1000;
  storage.set('timerEndTime', String(app.endTime));
  storage.set('timerRunning', 'true');
  if (callbackEnd) storage.set('timerCallback', 'pomodoro');
  else storage.remove('timerCallback');
  app.running = true;

  function checkTime() {
    if (!app.running) return;
    app.totalSeconds = Math.round((app.endTime - time.now()) / 1000);
    if (app.totalSeconds <= 0) {
      app.totalSeconds = 0;
      // stop timer interval here, but leave cleanup to controller/stop use-case
      try { time.clearInterval(app.timer); } catch(_) {}
      app.running = false;
      storage.remove('timerEndTime');
      storage.remove('timerRunning');
      storage.remove('timerCallback');
      if (typeof onTick === 'function') onTick({ totalSeconds: app.totalSeconds });
      if (typeof onComplete === 'function') onComplete({ callbackEnd });
      return;
    }
    if (typeof onTick === 'function') onTick({ totalSeconds: app.totalSeconds });
  }

  app.timer = time.setInterval(checkTime, intervalMs);
  // run immediately so UI updates without waiting for first tick
  checkTime();
  return true;
}
