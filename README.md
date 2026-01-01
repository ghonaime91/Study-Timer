# Study Timer / مؤقت المذاكرة

##  English Description

### Overview
**Study Timer** is a desktop productivity application built with **Tauri** (Rust + JavaScript). It is designed to help users manage their study or work sessions effectively using a custom timer and the Pomodoro technique. The app is lightweight, supports background operation via the system tray, and can start automatically with Windows.

### Features
- **Custom Timer:** Set specific hours and minutes for your study sessions.
- **Pomodoro Mode:** Built-in Pomodoro cycle (Work, Short Break, Long Break) with customizable durations and cycle counts.
- **Sound Alerts:**
  - Built-in frequency oscillator (beep sounds).
  - Very Cool Sounds like birds, piano , etc
  - Support for uploading custom audio or video files as alerts.
  - Volume and frequency control.
- **Notifications:** Desktop notifications when the timer ends (even if the app is minimized).
- **System Tray:** The app minimizes to the system tray to keep your taskbar clean.
- **Autostart:** Option to launch the application automatically when Windows starts.
- **Multi-language Support:** Fully localized interface in English and Arabic.
- **Persistent Settings:** Saves your preferences (volume, language, timer state) automatically.

### Tech Stack
- **Frontend:** HTML, CSS, JavaScript (Vanilla).
- **Backend:** Rust (Tauri Framework).
- **Plugins:** `tauri-plugin-autostart` for startup functionality.

### Installation & Development
1. **Prerequisites:**
   - Install [Node.js](https://nodejs.org/).
   - Install [Rust](https://www.rust-lang.org/).
   - Install C++ Build Tools (for Windows).

2. **Setup:**
   ```bash
   npm install
   ```

3. **Run in Development Mode:**
   ```bash
   npm run tauri dev
   ```

4. **Build for Production:**
   ```bash
   npm run tauri build
   ```

---

## وصف المشروع (العربية)

### نبذة عامة
**مؤقت المذاكرة** هو تطبيق سطح مكتب للإنتاجية مبني باستخدام إطار العمل **Tauri** (Rust + JavaScript). تم تصميم التطبيق لمساعدة المستخدمين على تنظيم جلسات المذاكرة أو العمل بفعالية باستخدام مؤقت مخصص وتقنية البومودورو. التطبيق خفيف الوزن، ويعمل في الخلفية من خلال شريط النظام (System Tray)، ويمكنه العمل تلقائياً عند بدء تشغيل ويندوز.

### المميزات
- **مؤقت مخصص:** تحديد ساعات ودقائق محددة لجلسة المذاكرة.
- **نظام بومودورو:** دورات بومودورو مدمجة (عمل، استراحة قصيرة، استراحة طويلة) مع إمكانية تعديل الأوقات وعدد الدورات.
- **تنبيهات صوتية:**
  - مولد نغمات مدمج (تحكم في التردد).
  - أصوات جميلة مثل صوت عصفور وبيانو الخ
  - إمكانية رفع ملفات صوتية أو فيديو خاصة لاستخدامها كمنبه.
  - تحكم كامل في مستوى الصوت ونوع النغمة.
- **الإشعارات:** إشعارات سطح المكتب عند انتهاء الوقت (حتى لو كان التطبيق مصغراً).
- **شريط النظام (Tray):** إمكانية تصغير التطبيق إلى شريط المهام بجوار الساعة.
- **التشغيل التلقائي:** خاصية بدء التشغيل مع الويندوز (Startup).
- **دعم اللغات:** واجهة كاملة باللغتين العربية والإنجليزية.
- **حفظ الإعدادات:** حفظ تلقائي لتفضيلات المستخدم (الصوت، اللغة، حالة المؤقت).

### التقنيات المستخدمة
- **الواجهة الأمامية (Frontend):** HTML, CSS, JavaScript.
- **الخلفية (Backend):** Rust (عبر إطار العمل Tauri).
- **الإضافات:** `tauri-plugin-autostart` لخاصية التشغيل التلقائي.

### التثبيت والتشغيل
1. **المتطلبات:**
   - تثبيت [Node.js](https://nodejs.org/).
   - تثبيت [Rust](https://www.rust-lang.org/).
   - تثبيت أدوات بناء C++ (لنظام ويندوز).

2. **التثبيت:**
   ```bash
   npm install
   ```

3. **تشغيل نسخة التطوير:**
   ```bash
   npm run tauri dev
   ```

4. **بناء النسخة النهائية:**
   ```bash
   npm run tauri build
   ```

## 📸 Screenshots
<p align="center">
  <img src="screenshots/main-start.jpg" width="150" alt="Main Screen">
  <img src="screenshots/pomodro-en.jpg" width="150" alt="Pomodoro">
  <img src="screenshots/lang-choose.jpg" width="150" alt="Settings">
  <img src="screenshots/ar.jpg" width="150" alt="Arabic UI">
</p>

## ⬇️ Download / تحميل

### English
Get the latest version of **Study Timer**:

👉 [Download latest release](https://github.com/ghonaime91/Study-Timer/releases/latest)

**Available versions:**
- Windows 64-bit (Recommended)  
- Windows 32-bit  

---

### العربية
احصل على آخر نسخة من **مؤقت المذاكرة**:

👉 [اضغط هنا لتحميل آخر إصدار](https://github.com/ghonaime91/Study-Timer/releases/latest)

**الإصدارات المتوفرة:**
- ويندوز 64-بت (موصى بها)  
- ويندوز 32-بت


## License
This project is licensed under the MIT License.