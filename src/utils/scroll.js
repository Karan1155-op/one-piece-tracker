'use strict';

/* ═══════════════════════════════════════════════════════════════════════════
   PREMIUM SMOOTH SCROLL ENGINE (V2)
   ═══════════════════════════════════════════════════════════════════════════ */
// Shared RAF handle — cancels any in-flight scroll before starting a new one
let _scrollRafId = null;

export function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

// easeInOutCubic distributes motion evenly — avoids the "braking too early" feel
export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function customSmoothScroll(targetElement, duration = 600, alignment = 'center') {
  // Cancel any competing scroll animation immediately
  if (_scrollRafId) { cancelAnimationFrame(_scrollRafId); _scrollRafId = null; }

  const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY;
  let idealScrollY;

  if (alignment === 'center') {
    idealScrollY = targetPosition - (window.innerHeight / 2) + (targetElement.offsetHeight / 2);
  } else {
    idealScrollY = targetPosition - 20;
  }

  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const finalScrollY = Math.max(0, Math.min(idealScrollY, maxScroll));
  const startPosition = window.scrollY;
  const distance = finalScrollY - startPosition;

  if (Math.abs(distance) < 2) return;

  let startTime = null;

  function animation(currentTime) {
    if (startTime === null) startTime = currentTime;
    const progress = Math.min((currentTime - startTime) / duration, 1);
    window.scrollTo(0, startPosition + distance * easeInOutCubic(progress));
    if (progress < 1) {
      _scrollRafId = requestAnimationFrame(animation);
    } else {
      _scrollRafId = null;
    }
  }

  _scrollRafId = requestAnimationFrame(animation);
}

/* ═══════════════════════════════════════════════════════════════════════════
   GO TO CURRENT ARC  (tap arc name or episode number → navigate + scroll)
   ═══════════════════════════════════════════════════════════════════════════ */
export function centerElementSmart(el) {
  if (!el) return;

  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const rect = el.getBoundingClientRect();
  const finalYRaw = window.scrollY + rect.top - ((window.innerHeight - rect.height) / 2);
  const finalY = Math.max(0, Math.min(finalYRaw, maxScroll));
  const delta = finalY - window.scrollY;

  // Near targets: one smooth center scroll.
  // Far targets: jump near target first, then a short smooth center finish.
  const FAR_DISTANCE = Math.max(520, window.innerHeight * 0.9);
  if (Math.abs(delta) > FAR_DISTANCE) {
    const remain = Math.min(Math.max(220, window.innerHeight * 0.35), Math.abs(delta) * 0.28);
    const nearYRaw = finalY - Math.sign(delta) * remain;
    const nearY = Math.max(0, Math.min(nearYRaw, maxScroll));

    window.scrollTo({ top: nearY, behavior: 'auto' });

    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    });
  } else {
    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
  }

  // Precision snap after smooth scroll settles (handles top/bottom edge clamps).
  setTimeout(() => {
    const maxNow = document.documentElement.scrollHeight - window.innerHeight;
    const rectNow = el.getBoundingClientRect();
    const targetNowRaw = window.scrollY + rectNow.top - ((window.innerHeight - rectNow.height) / 2);
    const targetNow = Math.max(0, Math.min(targetNowRaw, maxNow));
    if (Math.abs(window.scrollY - targetNow) > 2) {
      window.scrollTo({ top: targetNow, behavior: 'auto' });
    }
  }, 280);
}
