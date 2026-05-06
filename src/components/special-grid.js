'use strict';

import { state } from '../state/state.js';
import { saveState } from '../state/persistence.js';
import { renderArcGrid } from './arc-grid.js';
import { showToast } from './toast.js';

/* ═══════════════════════════════════════════════════════════════════════════
   SPECIALS GRID & FILTERS
   ═══════════════════════════════════════════════════════════════════════════ */
import { SPECIALS } from '../data/specials.js';

export function setSpecialView(v) {
  state.specialView = v;
  saveState();
  ['all', 'Special', 'OVA', 'Short'].forEach(x => {
    const btn = document.getElementById('toggle-sp-' + x.toLowerCase());
    if (!btn) return;
    btn.className = 'toggle-option' + (x === v ? ' active-sp-' + x.toLowerCase() : '');
    btn.setAttribute('aria-pressed', x === v ? 'true' : 'false');
  });
  renderSpecialGrid();
}

export function toggleSpecialWatched(special) {
  if (state.watchedSpecials.has(special.id)) {
    state.watchedSpecials.delete(special.id);
    showToast(`↩ ${special.name} — unmarked`, '');
  } else {
    state.watchedSpecials.add(special.id);
    showToast(`📀 ${special.name} — Watched!`, '');
  }
  saveState();
  if (state.mainView === 'all') renderArcGrid();
  renderSpecialGrid();
}

export function renderSpecialGrid() {
  const grid = document.getElementById('specialGrid');
  if (!grid) return;

  // Prevent scroll jump
  const currentHeight = grid.offsetHeight;
  if (currentHeight > 0) grid.style.minHeight = currentHeight + 'px';

  const query = state.searchQuery.toLowerCase().trim();

  const filteredSpecials = SPECIALS.filter(s => {
    // Check toggle filter
    if (state.specialView !== 'all' && s.type !== state.specialView) return false;
    // Check search filter
    if (query && !s.name.toLowerCase().includes(query)) return false;
    // Check hide-watched toggle
    if (state.hideWatchedSpecials && state.watchedSpecials.has(s.id)) return false;
    return true;
  });

  const existingNodes = new Map();
  for (const child of Array.from(grid.children)) {
    const key = child.dataset.key;
    if (key) existingNodes.set(key, child);
  }

  const fragment = document.createDocumentFragment();

  if (filteredSpecials.length === 0) {
    let msg = existingNodes.get('no-specials');
    if (!msg) {
      msg = document.createElement('div');
      msg.className   = 'no-results';
      msg.dataset.key = 'no-specials';
      msg.textContent = '🌊 No specials match your search.';
    }
    existingNodes.delete('no-specials');
    fragment.appendChild(msg);
  } else {
    for (const s of filteredSpecials) {
      const key = `special-${s.id}`;
      let node = existingNodes.get(key);
      const st = state.watchedSpecials.has(s.id) ? 'watched' : 'unwatched';

      if (!node) {
        node = document.createElement('div');
        node.dataset.key = key;
        node.className = `movie-item ${st}`;
        
        const recLabel = s.rec === 'high' ? '⭐ Highly Recommended' : s.rec === 'watch' ? '👍 Worth Watching' : '⏭ Skip';
        const recClass = 'tag-base ' + (s.rec === 'high' ? 'rec-high' : s.rec === 'watch' ? 'rec-watch' : 'rec-skip');

        node.innerHTML = `
          <div class="movie-title-row">
            <span class="movie-title">${s.icon} ${s.name}</span>
            <span class="tag-base movie-tag">${s.type}</span>
          </div>
          <div class="movie-ep-row">
            <div class="movie-sub">⚓ Best after Ep ${s.requiredEpisode}</div>
            <button class="movie-watch-btn"></button>
          </div>
          <div class="movie-info-row">
            <span class="${recClass}">${recLabel}</span>
            ${s.note ? `<div class="movie-note">ℹ️ ${s.note}</div>` : ''}
          </div>
        `;
      }

      // Update dynamic parts
      node.className = `movie-item ${st}`;
      const btn = node.querySelector('.movie-watch-btn');
      btn.className = `movie-watch-btn ${st==='watched' ? 'btn-unmark' : 'btn-mark'}`;
      btn.textContent = st==='watched' ? 'unmark' : '+ Watched';
      btn.onclick = (e) => { e.stopPropagation(); toggleSpecialWatched(s); };

      existingNodes.delete(key);
      fragment.appendChild(node);
    }
  }

  for (const obsolete of existingNodes.values()) obsolete.remove();
  grid.appendChild(fragment);

  requestAnimationFrame(() => {
    grid.style.minHeight = '';
  });
}
