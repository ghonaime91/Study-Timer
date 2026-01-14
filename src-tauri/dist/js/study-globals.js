/* Study Schedule Globals and Data Structures */

// Study session status enum
export const SessionStatus = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  COMPLETED: 'completed'
};

// Days of week for bilingual support
export const DaysOfWeek = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  ar: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
};

// Study session data structure
export class StudySession {
  constructor(data = {}) {
    this.id = data.id || Date.now().toString();
    this.day = data.day || 0; 
    this.subject = data.subject || '';
    this.studyDuration = data.studyDuration || 25; 
    this.breakDuration = data.breakDuration || 5; 
    this.status = data.status || SessionStatus.IDLE;
    this.currentTime = data.currentTime || 0; 
    this.totalStudyTime = data.totalStudyTime || 0;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  // Get remaining time in seconds
  getRemainingTime() {
    const totalSeconds = this.studyDuration * 60;
    return Math.max(0, totalSeconds - this.currentTime);
  }

  // Check if session is active
  isActive() {
    return this.status === SessionStatus.RUNNING || this.status === SessionStatus.PAUSED;
  }

  // Convert to plain object for storage
  toJSON() {
    return {
      id: this.id,
      day: this.day,
      subject: this.subject,
      studyDuration: this.studyDuration,
      breakDuration: this.breakDuration,
      status: this.status,
      currentTime: this.currentTime,
      totalStudyTime: this.totalStudyTime,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

// Timer state management
export class TimerState {
  constructor() {
    this.activeSessionId = null; 
    this.phase = 'study'; 
    this.globalTimer = {
      isRunning: false,
      isPaused: false,
      currentTime: 0, 
      totalTime: 0, 
      startTime: null, 
      pausedTime: 0 
    };
    this.lastUpdate = Date.now();
  }

  // Start timer for a session
  startSession(session, phase = 'study') {
    this.activeSessionId = session.id;
    this.phase = phase;
    const duration = phase === 'study' ? session.studyDuration : session.breakDuration;

    this.globalTimer = {
      isRunning: true,
      isPaused: false,
      currentTime: 0,
      totalTime: duration * 60,
      startTime: Date.now(),
      pausedTime: 0
    };
    this.lastUpdate = Date.now();
  }

  // Pause current session
  pauseSession() {
    if (this.globalTimer.isRunning && !this.globalTimer.isPaused) {
      this.globalTimer.isPaused = true;
      this.globalTimer.pausedTime += Date.now() - this.lastUpdate;
    }
  }

  // Resume current session
  resumeSession() {
    if (this.globalTimer.isRunning && this.globalTimer.isPaused) {
      this.globalTimer.isPaused = false;
      this.lastUpdate = Date.now();
    }
  }

  // Stop and reset timer
  stopSession() {
    this.activeSessionId = null;
    this.globalTimer = {
      isRunning: false,
      isPaused: false,
      currentTime: 0,
      totalTime: 0,
      startTime: null,
      pausedTime: 0
    };
  }

  // Update timer state (call this in interval)
  updateTimer() {
    if (this.globalTimer.isRunning && !this.globalTimer.isPaused) {
      const now = Date.now();
      const elapsed = (now - this.lastUpdate) / 1000;
      this.globalTimer.currentTime += elapsed;
      this.lastUpdate = now;
    }
  }

  // Get formatted time string
  getFormattedTime() {
    const totalSeconds = Math.floor(this.globalTimer.currentTime);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  // Check if timer is complete
  isComplete() {
    return this.globalTimer.currentTime >= this.globalTimer.totalTime;
  }
}

// Study schedule state
export const studyState = {
  sessions: [], 
  timerState: new TimerState(),
  settings: {
    autoStartNext: false, 
    showCompleted: true, 
    soundEnabled: true, 
    theme: 'primary' 
  }
};

// Localization texts for study schedule
export const studyTexts = {
  en: {
    studyScheduleTitle: 'Study Schedule',
    addSession: 'Add Session',
    editSession: 'Edit',
    deleteSession: 'Delete',
    startSession: 'Start',
    pauseSession: 'Pause',
    resumeSession: 'Resume',
    resetSession: 'Reset',
    dayLabel: 'Day',
    subjectLabel: 'Subject',
    subjectPlaceholder: 'Enter subject name',
    studyDurationLabel: 'Study Duration (min)',
    breakDurationLabel: 'Break Duration (min)',
    statusLabel: 'Status',
    actionsLabel: 'Actions',
    noSessionsMessage: 'No sessions yet',
    subjectRequired: 'Subject name is required',
    durationRequired: 'Duration must be greater than 0',
    sessionRunning: 'Session is running',
    sessionPaused: 'Session is paused',
    sessionCompleted: 'Session completed',
    sessionIdle: 'Ready to start',
    globalTimerLabel: 'Global Timer',
    currentSessionLabel: 'Current Session',
    okButton: 'OK',
    cancelButton: 'Cancel',
    saveButton: 'Save',
    closeButton: 'Close',
    studyTimeUp: 'Study time is up!',
    startBreakQuestion: 'break starts now',
    breakTimeUp: 'Break time is up!',
    startNextSessionQuestion: 'Next session starts now',
    allSessionsCompleted: 'All sessions completed!',
    breakPhase: 'Break Time',
    forSubject: 'for subject',
    noSessionsForDay: 'No Sessions For This Day !'
  },
  ar: {
    studyScheduleTitle: 'جدول الدراسة',
    addSession: 'إضافة جلسة',
    editSession: 'تعديل ',
    deleteSession: 'حذف',
    startSession: 'ابدأ',
    pauseSession: 'أوقف',
    resumeSession: 'استأنف',
    resetSession: 'إعادة ضبط',
    dayLabel: 'اليوم',
    subjectLabel: 'المادة',
    subjectPlaceholder: 'أدخل اسم المادة',
    studyDurationLabel: 'مدة الدراسة (دقيقة)',
    breakDurationLabel: 'مدة الاستراحة (دقيقة)',
    statusLabel: 'الحالة',
    actionsLabel: 'الإجراءات',
    noSessionsMessage: 'لا توجد جلسات بعد',
    subjectRequired: 'اسم المادة مطلوب',
    durationRequired: 'المدة يجب أن تكون أكبر من 0',
    sessionRunning: 'الجلسة قيد التشغيل',
    sessionPaused: 'الجلسة موقفة',
    sessionCompleted: 'الجلسة مكتملة',
    sessionIdle: 'جاهز للبدء',
    globalTimerLabel: 'المؤقت العام',
    currentSessionLabel: 'الجلسة الحالية',
    okButton: 'حسناً',
    cancelButton: 'إلغاء',
    saveButton: 'حفظ',
    closeButton: 'إغلاق',
    studyTimeUp: 'انتهى وقت الدراسة!',
    startBreakQuestion: 'جاري بدء الاستراحة الآن',
    breakTimeUp: 'انتهى وقت الاستراحة!',
    startNextSessionQuestion: ' جاري بدء الجلسة التالية',
    allSessionsCompleted: 'اكتملت جميع الجلسات!',
    breakPhase: 'وقت الاستراحة',
    forSubject: 'للمادة',
    noSessionsForDay: 'لا توجد مواد لهذا اليوم '
  }
};

// Utility functions
export const studyUtils = {
  // Load sessions from localStorage
  loadSessions() {
    try {
      const saved = localStorage.getItem('studySessions');
      if (saved) {
        const sessionsData = JSON.parse(saved);
        return sessionsData.map(data => new StudySession(data));
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
    return [];
  },

  // Save sessions to localStorage
  saveSessions(sessions) {
    try {
      const sessionsData = sessions.map(session => session.toJSON());
      localStorage.setItem('studySessions', JSON.stringify(sessionsData));
    } catch (error) {
      console.error('Failed to save sessions:', error);
    }
  },

  // Load timer state from localStorage
  loadTimerState() {
    try {
      const saved = localStorage.getItem('studyTimerState');
      if (saved) {
        const data = JSON.parse(saved);
        const timerState = new TimerState();
        Object.assign(timerState, data);
        return timerState;
      }
    } catch (error) {
      console.error('Failed to load timer state:', error);
    }
    return new TimerState();
  },

  // Save timer state to localStorage
  saveTimerState(timerState) {
    try {
      localStorage.setItem('studyTimerState', JSON.stringify(timerState));
    } catch (error) {
      console.error('Failed to save timer state:', error);
    }
  },

  // Get current day index (0-6)
  getCurrentDay() {
    return new Date().getDay();
  },

  // Format time in MM:SS format
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },

  // Get status color based on status
  getStatusColor(status) {
    const colors = {
      [SessionStatus.IDLE]: '#95a5a6',
      [SessionStatus.RUNNING]: '#2ecc71',
      [SessionStatus.PAUSED]: '#f39c12',
      [SessionStatus.COMPLETED]: '#9b59b6'
    };
    return colors[status] || '#95a5a6';
  },

  // Get status text based on language
  getStatusText(status, lang = 'en') {
    const texts = {
      en: {
        [SessionStatus.IDLE]: 'Ready',
        [SessionStatus.RUNNING]: 'Running',
        [SessionStatus.PAUSED]: 'Paused',
        [SessionStatus.COMPLETED]: 'Completed'
      },
      ar: {
        [SessionStatus.IDLE]: 'جاهز',
        [SessionStatus.RUNNING]: 'قيد التشغيل',
        [SessionStatus.PAUSED]: 'موقف',
        [SessionStatus.COMPLETED]: 'مكتمل'
      }
    };
    return texts[lang][status] || status;
  },

  getText(key) {
    // Import app dynamically or assume it's available in global scope if needed, 
    // but better to pass lang or use a global app object.
    // Since we are in an ES module, we should import app from globals.js if possible, 
    // BUT study-globals.js is imported by study-schedule.js which imports globals.js.
    // Circular dependency might be an issue if we import app here.
    // Let's rely on the passed lang or default to 'en'.
    // However, the caller (study-schedule.js) calls studyUtils.getText('key').

    // We need to access the current language.
    // Let's try to access it from the 'app' object if it's imported, 
    // or we can attach it to window for easier access, 
    // or simply check localStorage directly as a fallback.

    let lang = 'en';
    if (typeof localStorage !== 'undefined') {
      lang = localStorage.getItem('lang') || 'en';
    }

    if (studyTexts[lang] && studyTexts[lang][key]) {
      return studyTexts[lang][key];
    }
    return studyTexts['en'][key] || key;
  }
};