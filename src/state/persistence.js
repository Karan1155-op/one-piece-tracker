'use strict';

import { state } from './state.js';

/* ═══════════════════════════════════════════════════════════════════════════
   PERSISTENCE
   ═══════════════════════════════════════════════════════════════════════════ */
export function loadState() {
  const keys = ['op_v5', 'op_v4', 'op_v3', 'op_tracker_v2', 'op_tracker_v1'];
  for (const k of keys) {
    const raw = localStorage.getItem(k);
    if (raw) {
      try {
        const s            = JSON.parse(raw);
        state.episode      = s.episode  || 0;
        state.notes        = s.notes    || '';
        state.mainView     = s.mainView || 'series';
        state.timelineView = s.timelineView || 'all';
        state.seriesView   = s.seriesView   || 'all';
        // watchedMovies is serialised as an array — restore to a Set
        state.watchedMovies  = new Set(Array.isArray(s.watchedMovies)  ? s.watchedMovies  : []);
        state.watchedFillers = new Set(Array.isArray(s.watchedFillers) ? s.watchedFillers : []);
        state.skippedFillers = new Set(Array.isArray(s.skippedFillers) ? s.skippedFillers : []);
        state.watchedSpecials = new Set(Array.isArray(s.watchedSpecials) ? s.watchedSpecials : []);
        state.specialView     = s.specialView || 'all';
        state.lastWatchedDate = s.lastWatchedDate || null;
        state.streakCount     = s.streakCount || 0;
        state.firstDate       = s.firstDate || null;
        state.firstEpisode    = s.firstEpisode || 0;
        state.watchHistory    = Array.isArray(s.watchHistory) ? s.watchHistory : [];
        state.themeAccent     = s.themeAccent || 'auto';
        state.hideCompletedArcs = s.hideCompletedArcs || false;
        state.hideWatchedMovies = s.hideWatchedMovies || false;
        state.hideWatchedSpecials = s.hideWatchedSpecials || false;
      } catch (_) { /* ignore corrupt data */ }
      break;
    }
  }
}

export function saveState() {
  try {
    localStorage.setItem('op_v5', JSON.stringify({
      episode:         state.episode,
      notes:           state.notes,
      mainView:        state.mainView,
      timelineView:    state.timelineView,
      seriesView:      state.seriesView,
      watchedMovies:   Array.from(state.watchedMovies),
      watchedFillers:  Array.from(state.watchedFillers),
      skippedFillers:  Array.from(state.skippedFillers),
      watchedSpecials: Array.from(state.watchedSpecials),
      specialView:     state.specialView,
      lastWatchedDate: state.lastWatchedDate,
      streakCount:     state.streakCount,
      firstDate:       state.firstDate,
      firstEpisode:    state.firstEpisode,
      watchHistory:    state.watchHistory,
      themeAccent:     state.themeAccent,
      hideCompletedArcs: state.hideCompletedArcs,
      hideWatchedMovies: state.hideWatchedMovies,
      hideWatchedSpecials: state.hideWatchedSpecials,
    }));
  } catch (e) {
    if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      // showToast will be called from main.js
      console.warn('⚠️ Could not save — storage full. Export your data first.');
    }
  }
}
