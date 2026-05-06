'use strict';

import { state } from '../state/state.js';
import { saveState } from '../state/persistence.js';
import { trySetEpisode } from '../state/mutations.js';
import { renderStats, renderRank } from './stats.js';
import { renderArcGrid } from './arc-grid.js';
import { renderHero } from './hero.js';
import { renderAll } from '../main.js';
import { showToast } from './toast.js';

/* ═══════════════════════════════════════════════════════════════════════════
   FILLER ARC ACTIONS
   ═══════════════════════════════════════════════════════════════════════════ */

function _reRenderAll() {
  renderAll();
}

/**
 * watchFillerArc(a)
 * Marks filler as watched → counts in stat.
 * Advances episode to arc end so it registers as completed.
 */
export function watchFillerArc(a) {
  state.watchedFillers.add(a.name);
  state.skippedFillers.delete(a.name);   // can't be both

  const end = a.eps[1];
  // Only advance episode if user hasn't already passed this arc.
  if (end && end <= state.totalEps && state.episode < end) {
    const result = trySetEpisode(end);
    if (result.ok) { 
      // trySetEpisode dispatches episodeChanged -> main.js calls renderAll()
      showToast(`🟣 ${a.name} — Watched! Counts in Filler Arcs`, 'filler');
      return; 
    }
  }

  saveState();
  renderAll(); // Use the consolidated renderer
  showToast(`🟣 ${a.name} — Watched! Counts in Filler Arcs`, 'filler');
}

/**
 * unwatchFillerArc(a)
 */
export function unwatchFillerArc(a) {
  state.watchedFillers.delete(a.name);

  if (state.episode === a.eps[1] && state.episode < state.totalEps) {
    const result = trySetEpisode(a.eps[0] - 1);
    if (result.ok) { 
      showToast(`↩ ${a.name} — unmarked`, 'filler');
      return; 
    }
  }

  saveState();
  renderAll();
  showToast(`↩ ${a.name} — unmarked`, 'filler');
}

/**
 * skipFillerArc(a)
 */
export function skipFillerArc(a) {
  const end = a.eps[1];

  if (!end || end > state.totalEps) {
    showToast(`⏭ Already past ${a.name}`, '');
    return;
  }

  state.skippedFillers.add(a.name);
  state.watchedFillers.delete(a.name);

  if (state.episode < end) {
    const result = trySetEpisode(end);
    if (result.ok) {
      showToast(`⏭ Skipped ${a.name} — set to Ep ${end}`, 'filler');
      return;
    }
  }

  saveState();
  renderAll();
  showToast(`⏭ ${a.name} marked as skipped`, 'filler');
}

/**
 * unskipFillerArc(a)
 * Removes skipped flag. Does NOT reverse episode.
 * Arc shows as completed (episode already past it) but neither watched nor skipped.
 */
export function unskipFillerArc(a) {
  state.skippedFillers.delete(a.name);
  saveState();
  renderStats();
  renderArcGrid();
  showToast(`↩ ${a.name} — unskipped`, 'filler');
}
