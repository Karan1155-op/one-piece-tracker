'use strict';

/* ═══════════════════════════════════════════════════════════════════════════
   THEME COMPONENT  (Dark ↔ Light)
   ═══════════════════════════════════════════════════════════════════════════ */

const THEME_STORAGE_KEY = 'op_theme';

/**
 * applyTheme(theme)
 * Sets data-theme on <html> and updates the toggle button icon + aria-label.
 * Called both at boot (to restore saved preference) and on every toggle click.
 */
export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const isDark = theme === 'dark';

  // Header theme button is removed — theme is now controlled via bottom sheet only
  const btn = document.getElementById('themeToggle');
  if (btn) {
    btn.textContent = isDark ? '☀️' : '🌙';
    btn.setAttribute('aria-label',
      isDark ? 'Switch to light / parchment mode' : 'Switch to dark mode'
    );
  }
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next    = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_STORAGE_KEY, next);
  applyTheme(next);
}

export function loadTheme() {
  // Default to dark if no preference saved
  const saved = localStorage.getItem(THEME_STORAGE_KEY) || 'dark';
  applyTheme(saved);
}

// Theme toggle is now in the bottom sheet — header button removed
const _headerThemeBtn = document.getElementById('themeToggle');
if (_headerThemeBtn) _headerThemeBtn.addEventListener('click', toggleTheme);
