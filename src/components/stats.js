'use strict';

import { state } from '../state/state.js';
import { ARCS } from '../data/arcs.js';
import { arcEnd } from '../utils/arc-helpers.js';
import { LEVELS } from '../data/levels.js';
import { animateCount } from './hero.js';

/* ═══════════════════════════════════════════════════════════════════════════
   STATS COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export function renderStats() {
  const ep  = state.episode;
  const tot = state.totalEps;
  const hrs = Math.round(ep * 20 / 60);
  const hrsSuffix = hrs >= 1000 ? 'k h' : 'h';
  const hrsVal    = hrs >= 1000 ? Math.round(hrs / 100) / 10 : hrs;

  animateCount(document.getElementById('statWatched'),   ep);
  // Hours has a decimal possibility at 1000+, handle separately
  const hrsEl = document.getElementById('statHours');
  if (hrsEl) { hrsEl.dataset.val = hrsEl.dataset.val || '0'; hrsEl.textContent = hrsVal + hrsSuffix; }
  animateCount(document.getElementById('statArcs'),      ARCS.filter(a => a.type === 'canon' && ep >= arcEnd(a)).length);
  animateCount(document.getElementById('statFiller'),    state.watchedFillers.size);
  animateCount(document.getElementById('statMovies'),    state.watchedMovies.size);

  const rem = Math.max(0, tot - ep);
  const remEl = document.getElementById('statRemaining');
  if (remEl) {
    if (tot > 0) animateCount(remEl, rem);
    else remEl.textContent = '—';
  }

  // Update streak display
  const streakEl = document.getElementById('statStreak');
  if (streakEl) {
    streakEl.textContent = state.streakCount > 0 ? `🔥${state.streakCount} Day` : '—';
  }

  updateJourneyForecast();
}

/**
 * updateJourneyForecast()
 * Calculates pace based on firstDate and firstEpisode,
 * then estimates the catch-up date.
 */
function updateJourneyForecast() {
  const card = document.getElementById('journeyForecast');
  const paceEl = document.getElementById('forecastPace');
  const dateEl = document.getElementById('forecastDate');
  const noteEl = document.getElementById('forecastNote');
  const mainNoteEl = document.getElementById('mainForecastNote');
  if (!card) return;

  const ep = state.episode;
  const tot = state.totalEps;
  const rem = tot - ep;

  // 1. Show card if journey has started
  if (ep === 0 || rem <= 0) {
    card.style.display = 'none';
    if (mainNoteEl) {
      mainNoteEl.textContent = '';
      mainNoteEl.style.display = 'none';
    }
    return;
  }

  card.style.display = 'flex';
  if (mainNoteEl) mainNoteEl.style.display = 'block';

  // 2. Calculate pace based on rolling history (max 7 active days)
  const history = state.watchHistory || [];
  if (!state.firstDate) {
    paceEl.textContent = 'Learning pace...';
    dateEl.textContent = 'Keep watching!';
    const msg = 'Logging your first episodes to calculate your speed.';
    noteEl.textContent = msg;
    if (mainNoteEl) mainNoteEl.textContent = msg;
    return;
  }


  const totalEpsInHistory = history.reduce((sum, entry) => sum + entry.count, 0);
  const daysInHistory = history.length;
  const pace = totalEpsInHistory / daysInHistory;

  // 4. Update UI
  if (isNaN(pace) || pace === 0) {
    paceEl.textContent = '0.0 eps / day';
    dateEl.textContent = 'A long journey...';
    noteEl.textContent = 'Keep watching to improve your estimate!';
    return;
  }

  paceEl.textContent = `${pace.toFixed(1)} eps / day`;

  if (pace < 0.1) {
    dateEl.textContent = 'A long journey ahead...';
    noteEl.textContent = 'Watch more episodes to get a precise estimate!';
    return;
  }

  const daysToCatchup = Math.ceil(rem / pace);
  const arrivalDate = new Date();
  arrivalDate.setDate(arrivalDate.getDate() + daysToCatchup);

  const dateOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  dateEl.textContent = arrivalDate.toLocaleDateString(undefined, dateOptions);

  const months = (daysToCatchup / 30).toFixed(1);
  const noteText = daysToCatchup > 60 
    ? `At this rate, you'll catch up in about ${months} months.`
    : `Only ${daysToCatchup} days until you're caught up!`;

  noteEl.textContent = noteText;
  if (mainNoteEl) mainNoteEl.textContent = noteText;
}

/* ═══════════════════════════════════════════════════════════════════════════
   RANK COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export function renderRank() {
  const ep  = state.episode;
  const cur = getLevel(ep);
  const idx = cur.index;
  const next = LEVELS[idx + 1] || null;

  // Progress within current level
  let pct = 0;
  let nextLabel = 'You\'ve reached the pinnacle!';
  if (next) {
    const rangeSize = next.min - cur.min;
    const progress  = ep - cur.min;
    pct = Math.min(100, Math.round((progress / rangeSize) * 100));
    nextLabel = `${next.icon} ${next.label} at Ep ${next.min} · ${next.min - ep} eps away`;
  } else {
    pct = 100;
    nextLabel = '🏆 Maximum rank achieved!';
  }

  const iconEl   = document.getElementById('rankIcon');
  const labelEl  = document.getElementById('rankLabel');
  const badgeEl  = document.getElementById('rankBadge');
  const subEl    = document.getElementById('rankSub');
  const fillEl   = document.getElementById('rankBarFill');
  const epCountEl= document.getElementById('bountyAmount');

  if (iconEl)   iconEl.textContent   = cur.icon;
  if (labelEl)  { labelEl.textContent = cur.label; labelEl.style.color = cur.color; }
  if (badgeEl)  badgeEl.textContent  = `Lv ${idx}`;
  
  if (fillEl)   { fillEl.style.width = pct + '%'; fillEl.style.background = `linear-gradient(90deg, ${cur.color}88, ${cur.color})`; }
  
  // ── Dynamic Bounty Calculation ──────────────────────────────────────────
  if (epCountEl) {
    // 1. Tiered Base Bounty Calculation (Lore-Accurate Scaling)
    let baseBounty = 0;
    const currentEp = ep;

    if (currentEp > 0) {
      // 0 - 325 (East Blue to Water 7): ~380k per ep
      baseBounty += Math.min(currentEp, 325) * 382450;
    }
    if (currentEp > 325) {
      // 326 - 516 (Summit War era): ~1.1M per ep
      baseBounty += Math.min(currentEp - 325, 191) * 1145200;
    }
    if (currentEp > 516) {
      // 517 - 889 (New World / Dressrosa / WCI): ~3.6M per ep
      baseBounty += Math.min(currentEp - 516, 373) * 3678900;
    }
    if (currentEp > 889) {
      // 890 - 1155 (Yonko / Egghead era): ~5.1M per ep
      baseBounty += Math.min(currentEp - 889, 266) * 5123450;
    }
    if (currentEp > 1155) {
      // 1156+ (Conquering the Grand Line): ~6.8M per ep
      baseBounty += (currentEp - 1155) * 6890123;
    }
    
    // 2. Add "Unpredictable" noise (deterministic based on current episode)
    // This makes the bounty look like a specific calculated number (e.g. 3,467,837)
    if (currentEp > 0) {
      // Using a prime-heavy multiplier for a "random" look in lower digits
      const noise = (currentEp * 1337) % 1000000;
      baseBounty += noise;
    }

    // 3. Multipliers
    let multiplier = 1.0;
    
    // Streak Bonus: +10% for 7+ day streak
    if (state.streakCount >= 7) multiplier += 0.1;
    
    // Movie Bonus: +5% for every movie watched
    const movieCount = state.watchedMovies.size;
    multiplier += (movieCount * 0.05);
    
    const finalBounty = Math.round(baseBounty * multiplier);
    
    // Animate the bounty count (custom handling for large numbers with commas)
    animateBounty(epCountEl, finalBounty);
    
    if (subEl) {
      const multiplierText = `${multiplier.toFixed(2)}x (Movies: +${(movieCount * 5)}%, Streak: ${state.streakCount >= 7 ? '+10%' : '0%'})`;
      subEl.innerHTML = `${cur.sub}<br/><span style="color:var(--cyan);font-weight:600;font-style:normal;font-size:10px;margin-top:4px;display:block">Multi: ${multiplierText}</span>`;
    }
  }
}

/**
 * animateBounty()
 * Specific animator for the large bounty numbers with comma formatting.
 */
function animateBounty(el, target) {
  const start = parseInt(el.dataset.bountyVal || '0', 10);
  el.dataset.bountyVal = target;
  if (start === target) {
    el.textContent = new Intl.NumberFormat().format(target);
    return;
  }

  const dur = 1500;
  const begin = performance.now();
  const formatter = new Intl.NumberFormat();

  function step(now) {
    let t = (now - begin) / dur;
    if (t > 1) t = 1;
    const ease = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    const cur = Math.round(start + (target - start) * ease);
    el.textContent = formatter.format(cur);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function getLevel(ep) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (ep >= LEVELS[i].min) return { ...LEVELS[i], index: i };
  }
  return { ...LEVELS[0], index: 0 };
}
