'use strict';

import { state } from '../state/state.js';
import { ARCS } from '../data/arcs.js';
import { MOVIES } from '../data/movies.js';
import { SPECIALS } from '../data/specials.js';
import { arcStatus, getCurrentArc } from '../utils/arc-helpers.js';
import { applyTheme, toggleTheme } from './theme.js';
import { updateSagaTheme } from './saga-theme.js';
import { saveState } from '../state/persistence.js';
import { toggleMute } from './music.js';

/* ═══════════════════════════════════════════════════════════════════════════
   SIDEBAR COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

/** Helper to get completed arcs for progress displays */
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

document.addEventListener('DOMContentLoaded', function initSidebar() {
  const sidebar   = document.getElementById('sidebar');
  const overlay   = document.getElementById('sidebarOverlay');
  const hamburger = document.getElementById('hamburgerBtn');
  const closeBtn  = document.getElementById('sidebarCloseBtn');
  const bottomNav = document.querySelector('.bottom-nav');
  let isSidebarOpen = false;

  function lockBodyScroll() {
    const doc = document.documentElement;
    const scrollbarWidth = window.innerWidth - doc.clientWidth;
    document.body.style.overflow = 'hidden';
    // Prevent centered layout jump when vertical scrollbar disappears.
    document.body.style.paddingRight = scrollbarWidth > 0 ? scrollbarWidth + 'px' : '';
  }

  function unlockBodyScroll() {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }

  // ── Open / Close ──────────────────────────────────────────────────────────
  function openSidebar() {
    if (isSidebarOpen) return;
    isSidebarOpen = true;
    sidebar.classList.add('open');
    overlay.classList.add('open');
    sidebar.setAttribute('aria-hidden', 'false');
    hamburger.setAttribute('aria-expanded', 'true');
    hamburger.classList.add('open');
    sidebar._returnFocus = document.activeElement;
    lockBodyScroll();
    if (bottomNav) bottomNav.classList.add('hidden');

    const focusable = sidebar.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    sidebar._trapHandler = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); closeSidebar(); return; }
      if (e.key !== 'Tab') return;
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
      else            { if (document.activeElement === last)  { e.preventDefault(); first.focus(); } }
    };
    sidebar.addEventListener('keydown', sidebar._trapHandler);
    setTimeout(() => closeBtn && closeBtn.focus(), 50);

    // Refresh subtitle each time sidebar opens
    updateProgressNavSub();
  }

  function closeSidebar() {
    if (!isSidebarOpen) return;
    isSidebarOpen = false;
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
    sidebar.setAttribute('aria-hidden', 'true');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.classList.remove('open');
    unlockBodyScroll();
    if (bottomNav) bottomNav.classList.remove('hidden');
    if (sidebar._trapHandler) { sidebar.removeEventListener('keydown', sidebar._trapHandler); sidebar._trapHandler = null; }
    if (sidebar._returnFocus) { sidebar._returnFocus.focus(); sidebar._returnFocus = null; }
    // Always reset to main panel on close
    const pp = document.getElementById('sidebarPanelProgress');
    const pt = document.getElementById('sidebarPanelTools');
    const pth = document.getElementById('sidebarPanelThemes');
    const pm = document.getElementById('sidebarPanelMain');
    if (pp) pp.classList.add('sidebar-panel-hidden');
    if (pt) pt.classList.add('sidebar-panel-hidden');
    if (pth) pth.classList.add('sidebar-panel-hidden');
    if (pm) pm.classList.remove('sidebar-panel-slide-left');
    sidebar.classList.remove('progress-active');
  }

  hamburger.addEventListener('click', openSidebar);
  closeBtn.addEventListener('click',  closeSidebar);
  overlay.addEventListener('click',   closeSidebar);

  // ── Navigation items ──────────────────────────────────────────────────────
  document.getElementById('sidebarHomeBtn').addEventListener('click', () => {
    const main = document.getElementById('mainContent');
    if (main) main.scrollIntoView({ behavior: 'smooth', block: 'start' });
    closeSidebar();
  });

  document.getElementById('sidebarProgressBtn').addEventListener('click', () => {
    showProgressPanel();
  });

  document.getElementById('sidebarThemesBtn').addEventListener('click', () => {
    showThemesPanel();
  });

  document.getElementById('sidebarToolsBtn').addEventListener('click', () => {
    showToolsPanel();
  });

  // ── Progress Panel ────────────────────────────────────────────────────────
  const panelMain     = document.getElementById('sidebarPanelMain');
  const panelProgress = document.getElementById('sidebarPanelProgress');
  const backBtn       = document.getElementById('sidebarProgressBackBtn');
  const catArcs       = document.getElementById('progressCatArcs');
  const catSagas      = document.getElementById('progressCatSagas');
  const catMovies     = document.getElementById('progressCatMovies');
  const catSpecials    = document.getElementById('progressCatSpecials');
  let activeCategory  = 'arcs';

  function showProgressPanel() {
    sidebar.classList.add('progress-active');
    panelMain.classList.add('sidebar-panel-slide-left');
    panelProgress.classList.remove('sidebar-panel-hidden');
    
    activeCategory = 'arcs';
    setCatActive('arcs');
    renderProgressPanel();
    updateProgressNavSub();
    setTimeout(() => backBtn && backBtn.focus(), 80);
  }

  function hideProgressPanel() {
    sidebar.classList.remove('progress-active');
    panelProgress.classList.add('sidebar-panel-hidden');
    panelMain.classList.remove('sidebar-panel-slide-left');
    setTimeout(() => document.getElementById('sidebarProgressBtn') && document.getElementById('sidebarProgressBtn').focus(), 80);
  }

  backBtn.addEventListener('click', hideProgressPanel);

  // ── Tools Panel ───────────────────────────────────────────────────────────
  const panelTools    = document.getElementById('sidebarPanelTools');
  const toolsBackBtn  = document.getElementById('sidebarToolsBackBtn');

  function showToolsPanel() {
    sidebar.classList.add('progress-active');
    panelMain.classList.add('sidebar-panel-slide-left');
    panelTools.classList.remove('sidebar-panel-hidden');
    setTimeout(() => toolsBackBtn && toolsBackBtn.focus(), 80);
  }

  function hideToolsPanel() {
    sidebar.classList.remove('progress-active');
    panelTools.classList.add('sidebar-panel-hidden');
    panelMain.classList.remove('sidebar-panel-slide-left');
    setTimeout(() => document.getElementById('sidebarToolsBtn') && document.getElementById('sidebarToolsBtn').focus(), 80);
  }

  toolsBackBtn.addEventListener('click', hideToolsPanel);

  // ── Themes Panel ──────────────────────────────────────────────────────────
  const panelThemes    = document.getElementById('sidebarPanelThemes');
  const themesBackBtn  = document.getElementById('sidebarThemesBackBtn');

  function showThemesPanel() {
    sidebar.classList.add('progress-active');
    panelMain.classList.add('sidebar-panel-slide-left');
    panelThemes.classList.remove('sidebar-panel-hidden');
    renderThemesPanel();
    setTimeout(() => themesBackBtn && themesBackBtn.focus(), 80);
  }

  function hideThemesPanel() {
    sidebar.classList.remove('progress-active');
    panelThemes.classList.add('sidebar-panel-hidden');
    panelMain.classList.remove('sidebar-panel-slide-left');
    setTimeout(() => document.getElementById('sidebarThemesBtn') && document.getElementById('sidebarThemesBtn').focus(), 80);
  }

  themesBackBtn.addEventListener('click', hideThemesPanel);

  function renderThemesPanel() {
    const body = document.getElementById('themesPanelBody');
    if (!body) return;
    body.innerHTML = '';

    // 1. Appearance Section
    const appLabel = document.createElement('div');
    appLabel.className = 'sidebar-section-label';
    appLabel.textContent = 'Appearance';
    appLabel.style.marginTop = '0';
    appLabel.style.paddingLeft = '12px';
    body.appendChild(appLabel);

    const appGrid = document.createElement('div');
    appGrid.className = 'theme-grid';
    
    const isDark = (document.documentElement.getAttribute('data-theme') || 'dark') === 'dark';
    
    const darkBtn = createThemeOption('🌙 Dark', isDark, () => {
      applyTheme('dark');
      localStorage.setItem('op_theme', 'dark');
      renderThemesPanel();
    });
    
    const lightBtn = createThemeOption('☀️ Light', !isDark, () => {
      applyTheme('light');
      localStorage.setItem('op_theme', 'light');
      renderThemesPanel();
    });

    appGrid.appendChild(darkBtn);
    appGrid.appendChild(lightBtn);
    body.appendChild(appGrid);

    // 2. Accent Color Section
    const accLabel = document.createElement('div');
    accLabel.className = 'sidebar-section-label';
    accLabel.textContent = 'Accent Color';
    accLabel.style.paddingLeft = '12px';
    body.appendChild(accLabel);

    const accGrid = document.createElement('div');
    accGrid.className = 'theme-grid';

    // Auto option
    const autoBtn = createThemeOption('✨ Auto', state.themeAccent === 'auto', () => {
      state.themeAccent = 'auto';
      updateSagaTheme(state.episode);
      saveState();
      renderThemesPanel();
    });
    accGrid.appendChild(autoBtn);

    // Saga options
    const sagas = [
      'East Blue', 'Alabasta', 'Skypiea', 'Water 7', 'Thriller Bark', 
      'Marineford', 'Post-War', 'Fish-Man Island', 'Dressrosa', 
      'Whole Cake Island', 'Wano', 'Final Saga'
    ];

    sagas.forEach(saga => {
      const btn = createThemeOption(saga, state.themeAccent === saga, () => {
        state.themeAccent = saga;
        updateSagaTheme(state.episode);
        saveState();
        renderThemesPanel();
      });
      accGrid.appendChild(btn);
    });

    body.appendChild(accGrid);
  }

  function createThemeOption(label, isActive, onClick) {
    const btn = document.createElement('button');
    btn.className = 'theme-option' + (isActive ? ' active' : '');
    btn.textContent = label;
    btn.addEventListener('click', onClick);
    return btn;
  }


  // Captain's Log Collapse
  const notesCollapseBtn = document.getElementById('notesCollapseBtn');
  const notesContent = document.getElementById('notesContent');
  if (notesCollapseBtn) {
    notesCollapseBtn.addEventListener('click', () => {
      const isOpen = notesContent.classList.contains('open');
      notesCollapseBtn.classList.toggle('active', !isOpen);
      notesContent.classList.toggle('open', !isOpen);
    });
  }

  function setCatActive(cat) {
    activeCategory = cat;
    catArcs.classList.toggle('active', cat === 'arcs');
    catArcs.setAttribute('aria-pressed', cat === 'arcs' ? 'true' : 'false');
    catSagas.classList.toggle('active', cat === 'sagas');
    catSagas.setAttribute('aria-pressed', cat === 'sagas' ? 'true' : 'false');
    catMovies.classList.toggle('active', cat === 'movies');
    catMovies.setAttribute('aria-pressed', cat === 'movies' ? 'true' : 'false');
    catSpecials.classList.toggle('active', cat === 'specials');
    catSpecials.setAttribute('aria-pressed', cat === 'specials' ? 'true' : 'false');
  }

  function renderProgressPanel() {
    const body  = document.getElementById('progressPanelBody');
    const count = document.getElementById('progressPanelCount');
    if (!body) return;

    const existingToggle = body.querySelector('.exclude-fillers-toggle');

    if (activeCategory === 'sagas') {
      if (existingToggle) {
        const existingInput = existingToggle.querySelector('#excludeFillersToggle');
        const excludeFillers = localStorage.getItem('excludeFillers') === 'true';
        if (existingInput) existingInput.checked = excludeFillers;
        let next = existingToggle.nextSibling;
        while (next) { const n = next.nextSibling; body.removeChild(next); next = n; }
      } else {
        body.innerHTML = '';
        const toggleRow = document.createElement('div');
        toggleRow.className = 'exclude-fillers-toggle';
        const excludeFillers = localStorage.getItem('excludeFillers') === 'true';
        toggleRow.innerHTML = `
          <div class="toggle" style="padding:10px 8px;margin-bottom:8px;border-bottom:1px solid var(--border);">
            <span class="toggle-label">Exclude Fillers</span>
            <label class="toggle-switch" aria-label="Exclude filler arcs">
              <input type="checkbox" id="excludeFillersToggle"${excludeFillers ? ' checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>
        `;
        toggleRow.querySelector('#excludeFillersToggle').addEventListener('change', function () {
          localStorage.setItem('excludeFillers', this.checked.toString());
          renderProgressPanel();
        });
        body.appendChild(toggleRow);
      }
    } else {
      body.innerHTML = '';
    }

    if (activeCategory === 'movies') {
      const watchedMoviesList = MOVIES.filter(m => state.watchedMovies.has(m.id));
      if (count) count.textContent = watchedMoviesList.length + ' film' + (watchedMoviesList.length === 1 ? '' : 's');
      renderPanelMovies(body, watchedMoviesList);
      return;
    }

    if (activeCategory === 'specials') {
      const watchedSpecialsList = SPECIALS.filter(s => state.watchedSpecials.has(s.id));
      if (count) count.textContent = watchedSpecialsList.length + ' special' + (watchedSpecialsList.length === 1 ? '' : 's');
      renderPanelSpecials(body, watchedSpecialsList);
      return;
    }

    const done = _getProgressArcs();
    if (count) count.textContent = done.length + ' arc' + (done.length === 1 ? ' arc' : ' arcs');
    if (activeCategory === 'arcs') renderPanelArcs(body, done);
    else                            renderPanelSagas(body, done);
  }

  function renderPanelMovies(body, watchedMoviesList) {
    if (watchedMoviesList.length === 0) {
      body.innerHTML = '<div class="pp-empty">🎬 No movies watched yet.<br>Mark movies as watched to see them here!</div>';
      return;
    }
    for (const m of watchedMoviesList) {
      const row = document.createElement('div');
      row.className = 'pp-arc-row';
      row.setAttribute('role', 'listitem');

      const check = document.createElement('div');
      check.className   = 'pp-arc-check';
      check.textContent = '✔';
      check.setAttribute('aria-hidden', 'true');

      const name = document.createElement('div');
      name.className   = 'pp-arc-name';
      name.textContent = (m.icon ? m.icon + ' ' : '') + m.name;

      const year = document.createElement('span');
      year.className   = 'pp-arc-badge canon';
      year.textContent = m.year;

      row.appendChild(check);
      row.appendChild(name);
      row.appendChild(year);
      body.appendChild(row);
    }
  }

  function renderPanelSpecials(body, watchedSpecialsList) {
    if (watchedSpecialsList.length === 0) {
      body.innerHTML = '<div class="pp-empty">✨ No specials watched yet.<br>Mark specials as watched to see them here!</div>';
      return;
    }
    for (const s of watchedSpecialsList) {
      const row = document.createElement('div');
      row.className = 'pp-arc-row';
      row.setAttribute('role', 'listitem');

      const check = document.createElement('div');
      check.className   = 'pp-arc-check';
      check.textContent = '✔';
      check.setAttribute('aria-hidden', 'true');

      const name = document.createElement('div');
      name.className   = 'pp-arc-name';
      name.textContent = (s.icon ? s.icon + ' ' : '') + s.name;

      const type = document.createElement('span');
      type.className   = 'pp-arc-badge filler';
      type.textContent = s.type === 'ova' ? 'OVA' : s.type === 'short' ? 'Short' : 'Special';

      row.appendChild(check);
      row.appendChild(name);
      row.appendChild(type);
      body.appendChild(row);
    }
  }

  function renderPanelArcs(body, done) {
    if (done.length === 0) {
      body.innerHTML = '<div class="pp-empty">⚓ No completed arcs yet.<br>Keep watching to build your log!</div>';
      return;
    }
    const sagaMap = new Map();
    for (const a of done) {
      if (!sagaMap.has(a.saga)) sagaMap.set(a.saga, []);
      sagaMap.get(a.saga).push(a);
    }
    for (const [saga, arcs] of sagaMap) {
      const label = document.createElement('div');
      label.className   = 'pp-saga-label';
      label.textContent = saga.endsWith('Saga') ? saga : saga + ' Saga';
      body.appendChild(label);

      for (const a of arcs) {
        const row   = document.createElement('div');
        row.className = 'pp-arc-row';
        row.setAttribute('role', 'listitem');

        const check = document.createElement('div');
        check.className   = 'pp-arc-check';
        check.textContent = '✔';
        check.setAttribute('aria-hidden', 'true');

        const name = document.createElement('div');
        name.className   = 'pp-arc-name';
        name.textContent = (a.icon ? a.icon + ' ' : '') + a.name;

        const badge = document.createElement('span');
        const bKey  = a.type === 'filler' ? 'filler' : a.type === 'mixed' ? 'mixed' : 'canon';
        badge.className   = 'pp-arc-badge ' + bKey;
        badge.textContent = bKey === 'filler' ? 'Filler' : bKey === 'mixed' ? 'Mixed' : 'Canon';

        row.appendChild(check);
        row.appendChild(name);
        row.appendChild(badge);
        body.appendChild(row);
      }
    }
  }

  function renderPanelSagas(body, done) {
    const excludeFillers = localStorage.getItem('excludeFillers') === 'true';

    if (done.length === 0 && !excludeFillers) {
      body.innerHTML = '<div class="pp-empty">⚓ No sagas started yet.<br>Keep watching to unlock them!</div>';
      return;
    }

    const filteredArcs = excludeFillers ? ARCS.filter(a => a.type !== 'filler' && a.type !== 'upcoming') : ARCS.filter(a => a.type !== 'upcoming');
    const sagaMap = new Map();
    for (const a of filteredArcs) {
      if (!sagaMap.has(a.saga)) sagaMap.set(a.saga, { total: 0, done: 0, icon: a.icon ?? '🗺️' });
      sagaMap.get(a.saga).total++;
    }

    const filteredDone = excludeFillers ? done.filter(a => a.type !== 'filler') : done;
    for (const a of filteredDone) {
      if (sagaMap.has(a.saga)) sagaMap.get(a.saga).done++;
    }

    const sagaIconMap = new Map();
    for (const a of ARCS) {
      if (!sagaIconMap.has(a.saga)) sagaIconMap.set(a.saga, a.icon ?? '🗺️');
    }

    const activeSagas = [...sagaMap.entries()].filter(([, v]) => v.done > 0);

    for (const [saga, stats] of activeSagas) {
      const row = document.createElement('div');
      row.className = 'pp-saga-row';

      const icon = document.createElement('div');
      icon.className   = 'pp-saga-icon';
      icon.textContent = sagaIconMap.get(saga) ?? '🗺️';
      icon.setAttribute('aria-hidden', 'true');

      const info = document.createElement('div');
      info.className = 'pp-saga-info';

      const nameEl = document.createElement('div');
      nameEl.className   = 'pp-saga-name';
      nameEl.textContent = saga.endsWith('Saga') ? saga : saga + ' Saga';

      const subEl = document.createElement('div');
      subEl.className   = 'pp-saga-sub';
      subEl.textContent = stats.done + ' / ' + stats.total + ' arcs completed';

      info.appendChild(nameEl);
      info.appendChild(subEl);

      const pct = document.createElement('div');
      pct.className   = 'pp-saga-pct';
      pct.textContent = Math.round((stats.done / stats.total) * 100) + '%';

      row.appendChild(icon);
      row.appendChild(info);
      row.appendChild(pct);
      body.appendChild(row);
    }
  }


  catArcs.addEventListener('click', () => {
    setCatActive('arcs');
    renderProgressPanel();
  });

  catSagas.addEventListener('click', () => {
    setCatActive('sagas');
    renderProgressPanel();
  });

  catMovies.addEventListener('click', () => {
    setCatActive('movies');
    renderProgressPanel();
  });

  catSpecials.addEventListener('click', () => {
    setCatActive('specials');
    renderProgressPanel();
  });

  // Re-render panel when it's open and episode changes
  document.addEventListener('episodeChanged', () => {
    if (!panelProgress.classList.contains('sidebar-panel-hidden')) {
      renderProgressPanel();
      updateProgressNavSub();
    }
  });

  // ── Toggle sync helpers ───────────────────────────────────────────────────
  function syncMuteToggle() {
    const input  = document.getElementById('sidebarMuteToggle');
    const icon   = document.getElementById('sidebarMuteIcon');
    const sub    = document.getElementById('sidebarMuteSub');
    const on     = localStorage.getItem('op_muted') !== 'true';
    if (input) input.checked    = on;
    if (icon)  icon.textContent = on ? '🔊' : '🔇';
    if (sub)    sub.textContent  = on ? 'Playing' : 'Muted';
  }

  // ── Mute Toggle ───────────────────────────────────────────────────────────
  const muteToggle = document.getElementById('sidebarMuteToggle');
  muteToggle.addEventListener('change', () => {
    toggleMute();
    syncMuteToggle();
  });

  // Initial sync
  requestAnimationFrame(() => { 
    syncMuteToggle(); 
  });

  // ── Keyboard Navigation ────────────────────────────────────────────────────
  sidebar.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSidebar();
  });

  // ── Bottom Nav Sync ───────────────────────────────────────────────────────
  const navButtons = bottomNav.querySelectorAll('.bottom-nav-btn');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      closeSidebar();
    });
  });
});
