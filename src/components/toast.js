'use strict';

/* ═══════════════════════════════════════════════════════════════════════════
   TOAST COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
let toastTimer;

export function showToast(msg, flavor) {
  const t        = document.getElementById('toast');
  t.textContent  = msg;
  t.className    = 'toast show'
    + (flavor === 'filler' ? ' filler-toast' : '')
    + (flavor === 'elbaf'  ? ' elbaf-toast'  : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3400);
}
