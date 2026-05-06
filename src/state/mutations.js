'use strict';

import { state } from './state.js';
import { ARCS } from '../data/arcs.js';
import { arcEnd } from '../utils/arc-helpers.js';

/* ═══════════════════════════════════════════════════════════════════════════
   STATE MUTATIONS  (pure logic — no DOM, no toasts)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Update the daily watching streak based on the last watched date.
 * Called when user performs a watch action (set episode or +1).
 */
export function updateStreak() {
  const today = getLocalDateString();

  // No previous date: start streak at 1
  if (!state.lastWatchedDate) {
    state.streakCount = 1;
    state.lastWatchedDate = today;
    return;
  }

  // Already watched today: do nothing (prevent duplicate increments)
  if (state.lastWatchedDate === today) {
    return;
  }

  // Get yesterday's date
  const yesterday = getLocalDateString(new Date(Date.now() - 86400000));

  // Last watched was yesterday: increment streak
  if (state.lastWatchedDate === yesterday) {
    state.streakCount++;
  }
  // Last watched was older than yesterday: reset streak to 1
  else {
    state.streakCount = 1;
  }

  state.lastWatchedDate = today;
}

/**
 * Get local date string in YYYY-MM-DD format.
 */
function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Attempt to update state.episode to `newEp`.
 * Returns an object describing the outcome so the caller can handle UI.
 */
export function trySetEpisode(newEp) {
  if (isNaN(newEp) || newEp < 0 || newEp > state.totalEps) {
    return { ok: false, reason: `Enter a valid episode (0–${state.totalEps})` };
  }
  const oldEp      = state.episode;
  state.episode    = newEp;

  // Pace tracking: Initialize start point if not set
  if (!state.firstDate && newEp > 0) {
    state.firstDate = getLocalDateString();
    state.firstEpisode = newEp;
  }

  // Rolling 7-day history tracking
  if (newEp > oldEp) {
    const today = getLocalDateString();
    const diff = newEp - oldEp;
    
    if (!Array.isArray(state.watchHistory)) state.watchHistory = [];
    
    const lastEntry = state.watchHistory[state.watchHistory.length - 1];
    if (lastEntry && lastEntry.date === today) {
      lastEntry.count += diff;
    } else {
      state.watchHistory.push({ date: today, count: diff });
      if (state.watchHistory.length > 7) {
        state.watchHistory.shift();
      }
    }
  }

  document.dispatchEvent(new CustomEvent('episodeChanged'));
  // Only update streak if user actually watched a new episode (newEp > 0 and different from oldEp)
  if (newEp > 0 && newEp !== oldEp) {
    updateStreak();
  }
  // saveState() is called by the caller
  const milestones = computeMilestones(oldEp, newEp);
  return { ok: true, oldEp, newEp, milestones };
}

export function tryWatchNext() {
  if (state.episode >= state.totalEps) {
    return { ok: false, atMax: true };
  }
  return trySetEpisode(state.episode + 1);
}

function computeMilestones(oldEp, newEp) {
  // Exclude ongoing arcs (eps[1] === null) — they never "complete"
  return ARCS.filter(a =>
    a.type !== 'upcoming' &&
    a.eps[1] !== null &&
    newEp >= arcEnd(a) && oldEp < arcEnd(a)
  );
}
