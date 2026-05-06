'use strict';

import { state } from '../state/state.js';
import { getCurrentArc } from '../utils/arc-helpers.js';

/**
 * updateSagaTheme(ep)
 * Determines the current saga based on the episode count and applies a 
 * data-saga attribute to the <html> element to trigger CSS variable overrides.
 */
export function updateSagaTheme(ep) {
  // Priority 1: User Manual Preference
  if (state.themeAccent && state.themeAccent !== 'auto') {
    document.documentElement.setAttribute('data-saga', state.themeAccent);
    return;
  }

  // Priority 2: Automatic Progress-based
  if (ep <= 0) {
    document.documentElement.removeAttribute('data-saga');
    return;
  }

  const arc = getCurrentArc(ep);
  if (arc && arc.saga) {
    document.documentElement.setAttribute('data-saga', arc.saga);
  } else {
    // Fallback or remove if no saga found
    document.documentElement.removeAttribute('data-saga');
  }
}
