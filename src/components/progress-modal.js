'use strict';

import { state } from '../state/state.js';
import { ARCS } from '../data/arcs.js';
import { arcStatus, arcProgress, arcEnd, getCurrentArc } from '../utils/arc-helpers.js';

/* ═══════════════════════════════════════════════════════════════════════════
   MY PROGRESS MODAL
   ─────────────────────────────────────────────────────────────────────────
   Filtering rules (per spec):
     Canon arcs  → show if arcStatus() === 'completed'
     Filler arcs → show ONLY IF also in state.watchedFillers
     Mixed arcs  → treated as canon (episode-based completion)
   ═══════════════════════════════════════════════════════════════════════════ */

function _getProgressArcs() {
  const ep = state.episode;
  return ARCS.filter(a => {
    if (a.type === 'upcoming') return false;
    const completed = arcStatus(a, ep) === 'completed';
    if (!completed) return false;
    // Filler: only show if the user explicitly watched it
    if (a.type === 'filler') return state.watchedFillers.has(a.name);
    // Canon / mixed: episode-based completion is enough
    return true;
  });
}

export function renderProgressArcs() {
  const ep       = state.episode;
  const list     = document.getElementById('progressArcList');
  const countEl  = document.getElementById('progressModalCount');
  const footer   = document.getElementById('progressModalFooter');

  if (!list) return;
  list.innerHTML = '';

  // ── Current arc summary card ─────────────────────────────────────────────
  const curArc = getCurrentArc(ep);  // existing helper
  const arcEl  = document.getElementById('progressCurrentArc');
  const epEl   = document.getElementById('progressCurrentEp');
  const barEl  = document.getElementById('progressCurrentBar');

  if (curArc && curArc.name !== 'Between Arcs…') {
    if (arcEl) arcEl.textContent = (curArc.icon ? curArc.icon + ' ' : '') + curArc.name;
    if (epEl)  epEl.textContent  = 'Episode ' + ep + ' · ' + curArc.saga;
    const pct = arcProgress(curArc, ep);
    if (barEl) barEl.style.width = pct + '%';
  } else {
    if (arcEl) arcEl.textContent = ep === 0 ? 'Not started yet' : 'Between arcs…';
    if (epEl)  epEl.textContent  = 'Episode ' + ep;
    if (barEl) barEl.style.width = '0%';
  }

  // ── Completed arc list ───────────────────────────────────────────────────
  const done = _getProgressArcs();
  if (countEl) countEl.textContent = done.length + (done.length === 1 ? ' arc' : ' arcs');

  if (done.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'progress-empty';
    empty.innerHTML =
      '<span class="progress-empty-icon">⚓</span>' +
      'No completed arcs yet.<br>Keep watching to build your log!';
    list.appendChild(empty);
    if (footer) footer.innerHTML = '';
    return;
  }

  // Group by saga in ARCS chronological order
  const sagaMap   = new Map();
  const sagaOrder = [];
  for (const a of done) {
    if (!sagaMap.has(a.saga)) { sagaMap.set(a.saga, []); sagaOrder.push(a.saga); }
    sagaMap.get(a.saga).push(a);
  }

  for (const saga of sagaOrder) {
    const label = document.createElement('div');
    label.className   = 'progress-saga-label';
    label.textContent = saga.endsWith('Saga') ? saga : saga + ' Saga';
    list.appendChild(label);

    for (const a of sagaMap.get(saga)) {
      const row   = document.createElement('div');
      row.className = 'progress-arc-row';

      const check = document.createElement('div');
      check.className   = 'progress-arc-check';
      check.textContent = '✔';
      check.setAttribute('aria-hidden', 'true');

      const name = document.createElement('div');
      name.className   = 'progress-arc-name';
      name.textContent = (a.icon ? a.icon + ' ' : '') + a.name;

      const badge = document.createElement('span');
      const bKey  = a.type === 'filler' ? 'filler' : a.type === 'mixed' ? 'mixed' : 'canon';
      badge.className   = 'progress-arc-badge ' + bKey;
      badge.textContent = bKey === 'filler' ? 'Filler ★' : bKey === 'mixed' ? 'Mixed' : 'Canon';

      row.appendChild(check);
      row.appendChild(name);
      row.appendChild(badge);
      list.appendChild(row);
    }
  }

  // Footer summary
  const canonCount  = done.filter(a => a.type !== 'filler').length;
  const fillerCount = done.filter(a => a.type === 'filler').length;
  const epsCovered  = done.reduce((s, a) => s + Math.max(0, (a.eps[1] ?? ep) - a.eps[0] + 1), 0);
  if (footer) {
    footer.innerHTML =
      '<strong>' + done.length + '</strong> completed · ' +
      '<strong>' + canonCount + '</strong> canon · ' +
      '<strong>' + fillerCount + '</strong> filler watched · ' +
      '<strong>' + epsCovered + '</strong> eps';
  }
}

/** Update sidebar subtitle under "My Progress" nav item */
export function updateProgressNavSub() {
  const sub = document.getElementById('progressNavSub');
  if (!sub) return;
  const done  = _getProgressArcs();
  const ep    = state.episode;
  const curA  = getCurrentArc(ep);
  const curName = (curA && curA.name !== 'Between Arcs…') ? curA.name : null;
  sub.textContent = done.length === 0
    ? (curName ? 'On: ' + curName : 'Not started')
    : done.length + ' arc' + (done.length === 1 ? '' : 's') + ' done';
}

export function openProgressModal() {
  renderProgressArcs();
  const modal = document.getElementById('progressModal');
  if (!modal) return;
  modal._returnFocus = document.activeElement;
  modal.classList.add('open');

  const focusable = modal.querySelectorAll('button:not([disabled]), [href], input, [tabindex]:not([tabindex="-1"])');
  const first = focusable[0];
  const last  = focusable[focusable.length - 1];
  modal._trapHandler = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); closeProgressModal(); return; }
    if (e.key !== 'Tab') return;
    if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
    else            { if (document.activeElement === last)  { e.preventDefault(); first.focus(); } }
  };
  modal.addEventListener('keydown', modal._trapHandler);
  setTimeout(() => first && first.focus(), 50);
}

export function closeProgressModal() {
  const modal = document.getElementById('progressModal');
  if (!modal) return;
  modal.classList.remove('open');
  if (modal._trapHandler) { modal.removeEventListener('keydown', modal._trapHandler); modal._trapHandler = null; }
  if (modal._returnFocus) { modal._returnFocus.focus(); modal._returnFocus = null; }
}

// Close on backdrop click — wired inside DOMContentLoaded (after isMuted is declared)
document.getElementById('progressModal').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeProgressModal();
});
