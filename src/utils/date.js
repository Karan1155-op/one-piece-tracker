'use strict';

import { ELBAF_DATE } from '../state/state.js';

/* ═══════════════════════════════════════════════════════════════════════════
   DATE HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */
export function updateCountdown() {
  const now  = Date.now();
  const diff = ELBAF_DATE.getTime() - now;
  const el   = document.getElementById('cdValue');
  const lb   = document.getElementById('cdLabel');

  // if (diff <= 0) {
  //   el.textContent = '🏔️ Waiting....';
  //   lb.textContent = 'Ep 1169+';
  //   return;
  // }

  const totalSeconds = Math.floor(diff / 1000);
  const days    = Math.floor(totalSeconds / 86400);
  const hours   = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600)  / 60);
  const seconds = totalSeconds % 60;

  // if (days > 0) {
  //   el.textContent = `${days}d ${String(hours).padStart(2,'0')}h`;
  //   lb.textContent = `${String(minutes).padStart(2,'0')}m ${String(seconds).padStart(2,'0')}s`;
  // } else {
  //   el.textContent = `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
  //   lb.textContent = 'until Ep 1156';
  // }
}
