'use strict';

import { state } from '../state/state.js';
import { saveState } from '../state/persistence.js';
import { showToast } from '../components/toast.js';
import { renderAll, clearSearch, setView, setMainView } from '../main.js';

/* ═══════════════════════════════════════════════════════════════════════════
   EXPORT / IMPORT
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * exportSave()
 * Serialises the current state to a JSON file and triggers a browser download.
 * The exported object includes a version stamp and a timestamp so the user can
 * identify which backup they are restoring from.
 */
export function exportSave() {
  const payload = {
    version:       5,
    exportedAt:    new Date().toISOString(),
    episode:       state.episode,
    notes:         state.notes,
    view:          state.view,
    mainView:      state.mainView,
    watchedMovies: Array.from(state.watchedMovies),
    watchedFillers: Array.from(state.watchedFillers),
    skippedFillers: Array.from(state.skippedFillers),
    watchedSpecials:Array.from(state.watchedSpecials),
    specialView:   state.specialView,
    lastWatchedDate: state.lastWatchedDate,
    streakCount:     state.streakCount,
    firstDate:       state.firstDate,
    firstEpisode:    state.firstEpisode,
    watchHistory:    state.watchHistory,
  };

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);

  // Build a filename that includes the current episode so backups are easy to
  // identify at a glance, e.g. "one-piece-journey-ep0842.json"
  const epPadded  = String(state.episode).padStart(4, '0');
  const filename  = `one-piece-journey-ep${epPadded}.json`;

  const anchor    = document.createElement('a');
  anchor.href     = url;
  anchor.download = filename;
  anchor.click();

  // Revoke the object URL shortly after to free memory
  setTimeout(() => URL.revokeObjectURL(url), 5000);

  // showToast will be called from main.js
  showToast(`💾 Save exported — ${filename}`, '');
}

/**
 * importSave()
 * Opens the hidden file picker. The actual loading is handled by the
 * 'change' event listener on #importInput below.
 */
export function importSave() {
  document.getElementById('importInput').click();
}

/**
 * Validate that a parsed JSON object looks like a genuine save file.
 * We check for the minimum required field (episode) and that it is a
 * non-negative integer — enough to reject random JSON files without being
 * so strict that we break backwards compatibility with older exports.
 */
export function sanitiseIdArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter(v => typeof v === 'string' || typeof v === 'number')
    .map(v => String(v).slice(0, 100));
}

export function isValidSave(obj) {
  if (!obj || typeof obj !== 'object')            return false;
  if (typeof obj.episode !== 'number')            return false;
  if (!Number.isInteger(obj.episode))             return false;
  if (obj.episode < 0 || obj.episode > 99999)    return false;  // sanity ceiling
  return true;
}

// Wire up the file input — event listener is attached once at parse time so
// we never accidentally stack duplicate listeners via onclick.
document.getElementById('importInput').addEventListener('change', function () {
  const file = this.files[0];
  if (!file) return;

  // Reset the input value so the same file can be imported again if needed
  // (browsers won't fire 'change' a second time for the same file otherwise).
  this.value = '';

  const reader = new FileReader();

  reader.onload = function (e) {
    let parsed;
    try {
      parsed = JSON.parse(e.target.result);
    } catch (_) {
      showToast('⚠️ Invalid save file — could not parse JSON.', '');
      return;
    }

    if (!isValidSave(parsed)) {
      showToast('⚠️ Invalid save file — missing required fields.', '');
      return;
    }

    // Apply the imported values to state, falling back to current values
    state.episode       = parsed.episode;
    state.notes         = typeof parsed.notes === 'string' ? parsed.notes : state.notes;
    state.view          = ['all', 'canon', 'filler', 'ongoing'].includes(parsed.view) ? parsed.view : 'all';
    state.mainView      = ['series', 'movies', 'specials', 'all'].includes(parsed.mainView) ? parsed.mainView : 'series';
    state.watchedMovies   = new Set(sanitiseIdArray(parsed.watchedMovies));
    state.watchedFillers  = new Set(sanitiseIdArray(parsed.watchedFillers));
    state.skippedFillers  = new Set(sanitiseIdArray(parsed.skippedFillers));
    state.watchedSpecials = new Set(sanitiseIdArray(parsed.watchedSpecials));
    state.specialView    = parsed.specialView || 'all';
    state.lastWatchedDate = parsed.lastWatchedDate || null;
    state.streakCount     = typeof parsed.streakCount === 'number' ? parsed.streakCount : 0;
    state.firstDate       = parsed.firstDate || null;
    state.firstEpisode    = typeof parsed.firstEpisode === 'number' ? parsed.firstEpisode : 0;
    state.watchHistory    = Array.isArray(parsed.watchHistory) ? parsed.watchHistory : [];
    state.searchQuery   = '';

    saveState();
    clearSearch();
    setView(state.view);
    setMainView(state.mainView);
    renderAll();
    showToast(`✅ Save loaded — Episode ${state.episode}`, '');
  };

  reader.onerror = function () {
    showToast('⚠️ Could not read file. Please try again.', '');
  };

  reader.readAsText(file);
});
