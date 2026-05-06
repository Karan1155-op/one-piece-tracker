'use strict';

import { state } from '../state/state.js';
import { saveState } from '../state/persistence.js';
import { renderStats } from './stats.js';
import { renderArcGrid } from './arc-grid.js';
import { showToast } from './toast.js';

/* ═══════════════════════════════════════════════════════════════════════════
   MOVIE GRID COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
import { MOVIES } from '../data/movies.js';

/**
 * movieStatus(movie)
 * Two states only — no locking, every movie is always available:
 *   unwatched — not yet marked by the user
 *   watched   — manually marked as watched
 */
function movieStatus(movie) {
  return state.watchedMovies.has(movie.id) ? 'watched' : 'unwatched';
}

/**
 * toggleMovieWatched(movie)
 * Marks or unmarks a movie as watched.
 * Called only from the explicit Watch/Unmark button — not the card body.
 */
export function toggleMovieWatched(movie) {
  if (state.watchedMovies.has(movie.id)) {
    state.watchedMovies.delete(movie.id);
    showToast(`↩ ${movie.name} — unmarked`, '');
  } else {
    state.watchedMovies.add(movie.id);
    showToast(`🎬 ${movie.name} — Watched!`, '');
  }
  saveState();
  renderMovieGrid();
  if (state.mainView === 'all') renderArcGrid();
  renderStats();
}

/**
 * renderMovieGrid()
 * All 15 movies are always shown — no locking.
 * requiredEpisode is shown as an informational hint only ("Best after Ep X").
 * Each card has an explicit Watch / Unmark button on the right.
 */
export function renderMovieGrid() {
  const grid = document.getElementById('movieGrid');
  if (!grid) return;

  // Prevent scroll jump
  const currentHeight = grid.offsetHeight;
  if (currentHeight > 0) grid.style.minHeight = currentHeight + 'px';

  // NEW: Grab the search query
  const query = state.searchQuery.toLowerCase().trim();

  // Filter movies based on the search query and hide-watched toggle
  const filteredMovies = MOVIES.filter(m => {
    if (query && !m.name.toLowerCase().includes(query)) return false;
    if (state.hideWatchedMovies && state.watchedMovies.has(m.id)) return false;
    return true;
  });

  const existingNodes = new Map();
  for (const child of Array.from(grid.children)) {
    const key = child.dataset.key;
    if (key) existingNodes.set(key, child);
  }

  const fragment = document.createDocumentFragment();

  if (filteredMovies.length === 0) {
    let msg = existingNodes.get('no-movies');
    if (!msg) {
      msg = document.createElement('div');
      msg.className   = 'no-results';
      msg.dataset.key = 'no-movies';
      msg.textContent = '🌊 No movies match your search.';
    }
    existingNodes.delete('no-movies');
    fragment.appendChild(msg);
  } else {
    for (const m of filteredMovies) {
      const key = `movie-${m.id}`;
      let node = existingNodes.get(key);
      const st = state.watchedMovies.has(m.id) ? 'watched' : 'unwatched';

      if (!node) {
        node = document.createElement('div');
        node.dataset.key = key;
        node.className = `movie-item ${st}`;
        
        const recLabel = m.rec === 'high' ? '⭐ Highly Recommended' : m.rec === 'watch' ? '👍 Worth Watching' : '⏭ Skip';
        const recClass = 'tag-base ' + (m.rec === 'high' ? 'rec-high' : m.rec === 'watch' ? 'rec-watch' : 'rec-skip');

        node.innerHTML = `
          <div class="movie-title-row">
            <span class="movie-title">${m.icon} ${m.name} <span style="font-family:'DM Mono',monospace;font-size:11px;color:var(--text-dim);font-weight:400">${m.year}</span></span>
          </div>
          <div class="movie-ep-row">
            <div class="movie-sub">⚓ Best after Ep ${m.requiredEpisode}</div>
            <button class="movie-watch-btn"></button>
          </div>
          ${m.note ? `<div class="movie-info-row"><span class="${recClass}">${recLabel}</span><div class="movie-note">ℹ️ ${m.note}</div></div>` : `<div class="movie-info-row" style="margin-top:5px"><span class="${recClass}">${recLabel}</span></div>`}
        `;
      }

      // Update dynamic class and button
      node.className = `movie-item ${st}`;
      const btn = node.querySelector('.movie-watch-btn');
      btn.className = `movie-watch-btn ${st==='watched' ? 'btn-unmark' : 'btn-mark'}`;
      btn.textContent = st==='watched' ? 'unmark' : '+ Watched';
      btn.onclick = (e) => {
        e.stopPropagation();
        toggleMovieWatched(m);
      };

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
