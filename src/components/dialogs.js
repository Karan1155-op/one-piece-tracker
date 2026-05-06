'use strict';

import { state } from '../state/state.js';
import { saveState } from '../state/persistence.js';
import { renderAll, setView, clearSearch, setMainView } from '../main.js';
import { showToast } from './toast.js';
import { updateSagaTheme } from './saga-theme.js';

/* ═══════════════════════════════════════════════════════════════════════════
   RESET DIALOG
   ═══════════════════════════════════════════════════════════════════════════ */
export function openResetDialog() {
  const dialog = document.getElementById('resetDialog');
  dialog.classList.add('open');
  dialog._returnFocus = document.activeElement;

  const focusable = dialog.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last  = focusable[focusable.length - 1];

  dialog._trapHandler = (e) => {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }
  };
  dialog.addEventListener('keydown', dialog._trapHandler);
  setTimeout(() => first && first.focus(), 50);
}

export function closeResetDialog() {
  const dialog = document.getElementById('resetDialog');
  dialog.classList.remove('open');
  if (dialog._trapHandler) {
    dialog.removeEventListener('keydown', dialog._trapHandler);
    dialog._trapHandler = null;
  }
  if (dialog._returnFocus) { dialog._returnFocus.focus(); dialog._returnFocus = null; }
}

export function confirmReset() {
  ['op_v5','op_v4','op_v3','op_tracker_v2','op_tracker_v1'].forEach(k => localStorage.removeItem(k));
  state.episode         = 0;
  state.notes           = '';
  state.view            = 'all';
  state.mainView        = 'series';
  state.searchQuery     = '';
  state.watchedMovies   = new Set();
  state.watchedFillers  = new Set();
  state.skippedFillers  = new Set();
  state.watchedSpecials = new Set();
  state.specialView     = 'all';
  state.lastWatchedDate = null;
  state.streakCount     = 0;
  state.firstDate       = null;
  state.firstEpisode    = 0;
  state.watchHistory    = [];
  
  updateSagaTheme(0);
  closeResetDialog();
  clearSearch();
  setView('all');
  renderAll();
  setMainView('all');
  showToast('⚓ Journey reset — Romance Dawn awaits!', '');
}

// Close dialog on backdrop click
document.getElementById('resetDialog').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeResetDialog();
});

// Close dialog on Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && document.getElementById('resetDialog').classList.contains('open')) {
    closeResetDialog();
  }
});

/* ═══════════════════════════════════════════════════════════════════════════
   INFO BUTTON LOGIC
   ═══════════════════════════════════════════════════════════════════════════ */
const UPDATE_VERSION = '1.2';

export function initInfoButton() {
  const infoBtn = document.getElementById('infoToggle');
  const hasReadUpdate = localStorage.getItem('op_update_read') === UPDATE_VERSION;

  infoBtn.setAttribute('aria-expanded', 'false');
  infoBtn.setAttribute('aria-haspopup', 'dialog');

  if (hasReadUpdate) {
    moveButtonToLog();
    infoBtn.classList.remove('glow');
  }

  infoBtn.addEventListener('click', openInfoModal);

  // Close on backdrop click
  document.getElementById('infoModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeInfoModal();
  });
}

export function openInfoModal() {
  const modal   = document.getElementById('infoModal');
  const infoBtn = document.getElementById('infoToggle');
  modal.classList.add('open');
  infoBtn.setAttribute('aria-expanded', 'true');
  modal._returnFocus = document.activeElement;
  const focusable = modal.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])');
  const first = focusable[0];
  const last  = focusable[focusable.length - 1];
  modal._trapHandler = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); closeInfoModal(); return; }
    if (e.key !== 'Tab') return;
    if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
    else            { if (document.activeElement === last)  { e.preventDefault(); first.focus(); } }
  };
  modal.addEventListener('keydown', modal._trapHandler);
  setTimeout(() => first && first.focus(), 50);
}

export function closeInfoModal() {
  const modal   = document.getElementById('infoModal');
  const infoBtn = document.getElementById('infoToggle');
  modal.classList.remove('open');
  infoBtn.setAttribute('aria-expanded', 'false');
  if (modal._trapHandler) { modal.removeEventListener('keydown', modal._trapHandler); modal._trapHandler = null; }
  if (modal._returnFocus) { modal._returnFocus.focus(); modal._returnFocus = null; }
  if (localStorage.getItem('op_update_read') !== UPDATE_VERSION) {
    localStorage.setItem('op_update_read', UPDATE_VERSION);
    infoBtn.classList.remove('glow');
    moveButtonToLog();
    showToast("⚓ Updates acknowledged — button moved to Captain's Log.", "");
  }
}

function moveButtonToLog() {
  const infoBtn = document.getElementById('infoToggle');
  const toolsContainer = document.getElementById('infoButtonToolsContainer');
  if (toolsContainer && infoBtn) {
    toolsContainer.appendChild(infoBtn);
  }
}
