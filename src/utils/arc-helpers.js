'use strict';

import { state } from '../state/state.js';
import { ARCS } from '../data/arcs.js';

/* ═══════════════════════════════════════════════════════════════════════════
   ARC HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */
export function getCurrentArc(ep) {
  for (const a of ARCS) {
    if (ep >= a.eps[0] && ep <= arcEnd(a)) return a;  // arcEnd handles null (Elbaf)
  }
  if (ep === 0) return null;
  for (const a of ARCS) {
    if (ep < a.eps[0]) return { name: 'Between Arcs…', eps: [0, state.totalEps], type: 'canon' };
  }
  return ARCS[ARCS.length - 1];
}

/**
 * arcEnd(a)
 * Returns the resolved end episode for an arc.
 * If eps[1] is null (Elbaf while ongoing), uses state.totalEps — the live
 * value fetched from the API — so the range auto-expands as new eps air.
 */
export function arcEnd(a) {
  return a.eps[1] ?? state.totalEps;
}

export function arcStatus(a, ep) {
  if (a.type === 'upcoming') return 'locked';
  // Check if it's ongoing (eps[1] is null). If so, it's never "completed"!
  if (a.eps[1] !== null && ep >= arcEnd(a)) return 'completed';
  if (ep >= a.eps[0])        return 'current';

  // Unlocked: previous arc is completed so this one is accessible at 0%
  // Find the arc that ends just before this one starts
  const idx  = ARCS.indexOf(a);
  const prev = idx > 0 ? ARCS[idx - 1] : null;
  if (prev && prev.type !== 'upcoming' && ep >= arcEnd(prev)) return 'unlocked';

  return 'locked';
}

export function arcProgress(a, ep) {
  if (a.type === 'upcoming' || ep < a.eps[0]) return 0;
  const end = arcEnd(a);
  if (ep >= end) return 100;
  return Math.round((ep - a.eps[0] + 1) / (end - a.eps[0] + 1) * 100);
}
