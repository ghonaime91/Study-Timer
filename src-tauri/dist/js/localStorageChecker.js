// js/localStorageChecker.js
import { app } from './globals.js';

// -------- Utilities -------- //
function getLocalStorageSize() {
  let total = 0;
  for (let key in localStorage) {
    if (!localStorage.hasOwnProperty(key)) continue;
    const value = localStorage.getItem(key);
    total += key.length + (value ? value.length : 0);
  }
  return total;
}

function getLocalStorageLimit() {
  return 5 * 1024 * 1024; // 5MB
}

// -------- Data Cleaning -------- //
function cleanLocalStorageByPercent(percent) {
  const keys = Object.keys(localStorage);
  if (keys.length === 0) return {};
  const removeCount = Math.ceil(keys.length * (percent / 100));
  const removedData = {};
  for (let i = 0; i < removeCount; i++) {
    const key = keys[i];
    removedData[key] = localStorage.getItem(key);
    localStorage.removeItem(key);
  }
  return removedData;
}

// -------- Download File -------- //
function downloadRemovedData(removedData) {
  if (!removedData || Object.keys(removedData).length === 0) return;
  const blob = new Blob([JSON.stringify(removedData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'removed_localStorage.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// -------- Modal Singleton -------- //
let modalOpen = false;

function showStorageModal(message) {
  if (modalOpen) return;
  modalOpen = true;

  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed; top:0; left:0; width:100%; height:100%;
    display:flex; align-items:center; justify-content:center;
    backdrop-filter: blur(8px); background-color: rgba(0,0,0,0.5);
    z-index:9999;
  `;

  const content = document.createElement('div');
  content.style.cssText = `
    background-color:#fff; color:#000; padding:20px; border-radius:12px;
    max-width:400px; width:90%; text-align:center; box-shadow:0 0 15px rgba(0,0,0,0.3);
  `;

  const p = document.createElement('p');
  p.textContent = message;
  p.style.marginBottom = '15px';

  const select = document.createElement('select');
  select.style.marginBottom = '15px';
  select.style.width = '60%';
  select.style.padding = '5px';
  select.style.fontSize = '16px';
  select.innerHTML = `
    <option value="10">10%</option>
    <option value="20" selected>20%</option>
    <option value="30">30%</option>
    <option value="50">50%</option>
    <option value="100">100%</option>
  `;

  const btnContainer = document.createElement('div');
  btnContainer.style.cssText = 'display:flex; justify-content:center; gap:10px;';

  const okBtn = document.createElement('button');
  okBtn.textContent = app.currentLang === 'ar' ? 'مسح البيانات' : 'Clear Data';
  okBtn.style.cssText = 'padding:8px 15px;font-size:16px;cursor:pointer;border-radius:6px;border:none;background-color:#4CAF50;color:#fff;';

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = app.currentLang === 'ar' ? 'إلغاء' : 'Cancel';
  cancelBtn.style.cssText = 'padding:8px 15px;font-size:16px;cursor:pointer;border-radius:6px;border:none;background-color:#f44336;color:#fff;';

  btnContainer.append(okBtn, cancelBtn);

  content.append(p, select, btnContainer);
  modal.appendChild(content);
  document.body.appendChild(modal);

  const closeModal = () => {
    if (modal.parentNode) modal.parentNode.removeChild(modal);
    modalOpen = false;
  };

  okBtn.onclick = () => {
    const percent = parseInt(select.value);
    const removed = cleanLocalStorageByPercent(percent);
    downloadRemovedData(removed);
    closeModal();
  };

  cancelBtn.onclick = closeModal;
}

// -------- Override localStorage.setItem -------- //
document.addEventListener('DOMContentLoaded', () => {
  const originalSetItem = localStorage.setItem;

  localStorage.setItem = function (key, value) {
    try {
      if (getLocalStorageSize() >= getLocalStorageLimit() * 0.9) {
        const message = app.currentLang === 'ar'
          ? 'المساحة في localStorage أوشكت على الامتلاء! اختر النسبة المراد مسحها:'
          : 'localStorage is almost full! Choose percentage to clear:';
        showStorageModal(message);
      }
      originalSetItem.call(this, key, value);
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        const message = app.currentLang === 'ar'
          ? 'تم الوصول إلى الحد الأقصى للتخزين! اختر النسبة المراد مسحها:'
          : 'localStorage limit reached! Choose percentage to clear:';
        showStorageModal(message);
      } else {
        throw e;
      }
    }
  };
});
