'use strict';

import { state } from '../state/state.js';
import { getCurrentArc } from '../utils/arc-helpers.js';

/* ═══════════════════════════════════════════════════════════════════════════
   HERO COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export function renderHero() {
  const ep  = state.episode;
  const tot = state.totalEps;
  const arc = getCurrentArc(ep);
  const pct = Math.min(100, Math.round(ep / tot * 100));

  // Calculate Arc + Saga text
  let arcHtml = '—';
  let arcA11y = '—';
  if (ep === 0) {
    arcHtml = '<span class="hero-arc-main">Set sail!</span>';
    arcA11y = 'Set sail!';
  } else if (arc) {
    const displaySaga = arc.saga.endsWith('Saga') ? arc.saga : arc.saga + ' Saga';
    arcHtml = `
      <div class="hero-arc-stack">
        <span class="hero-arc-main">${arc.name}</span>
        <span class="hero-saga-tag">${displaySaga}</span>
      </div>
    `;
    arcA11y = `${arc.name}, ${displaySaga}`;
  }

  document.getElementById('currentEpDisplay').textContent = ep;
  document.getElementById('currentArcName').innerHTML     = arcHtml;
  document.getElementById('epFraction').textContent       = `${ep} / ${tot}`;
  document.getElementById('mainBar').style.width          = pct + '%';
  document.getElementById('mainPct').textContent          = `${pct}% of ${tot} episodes sailed`;

  // Update circular ring (circumference = 2πr = 2π×35 ≈ 219.9)
  const ring = document.getElementById('ringFill');
  if (ring) {
    const circ  = 2 * Math.PI * 35;
    const offset = circ - (pct / 100) * circ;
    ring.style.strokeDasharray  = circ;
    ring.style.strokeDashoffset = offset;
  }

  // ARIA progressbar
  const pb = document.getElementById('progressBar');
  pb.setAttribute('aria-valuenow', pct);
  pb.setAttribute('aria-valuemax', 100);

  // Update Watch Next button text (▶ Next Ep Number)
  const watchNextText = document.getElementById('watchNextText');
  if (watchNextText) {
    const nextEp = Math.min(tot, ep + 1);
    watchNextText.textContent = `▶ ${nextEp}`;
  }

  // Single consolidated announcement for screen readers (Fix 5)
  // Debounced so rapid +1 taps don't flood the AT queue
  clearTimeout(renderHero._announceTimer);
  renderHero._announceTimer = setTimeout(() => {
    const summary = document.getElementById('a11ySummary');
    if (summary && ep > 0) {
      summary.textContent = `Episode ${ep}. ${arcA11y}. ${pct}% complete.`;
    }
  }, 600);
}

export function animateCount(el, target, suffix = '') {
  if (!el) return;
  const start = parseInt(el.dataset.val || '0', 10);
  el.dataset.val = target;
  if (start === target) { el.textContent = target + suffix; return; }

  // Set duration to perfectly match the CSS transitions (1.2 seconds)
  const dur = 1200;
  const begin = performance.now();

  function step(now) {
    let t = (now - begin) / dur;
    if (t > 1) t = 1;

    // Apply an easeOutExpo curve so the numbers slow down beautifully at the end
    const ease = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    const cur = Math.round(start + (target - start) * ease);

    el.textContent = cur + suffix;

    if (t < 1) requestAnimationFrame(step);
    else el.textContent = target + suffix;
  }
  requestAnimationFrame(step);
}
