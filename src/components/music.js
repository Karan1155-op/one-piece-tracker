'use strict';

/* ═══════════════════════════════════════════════════════════════════════════
   MUSIC COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export let isMuted = localStorage.getItem('op_muted') === 'true';
let fadeTimer = null;
let startTimer = null;

function clearAudioTimers() {
  if (fadeTimer) { clearInterval(fadeTimer); fadeTimer = null; }
  if (startTimer) { clearTimeout(startTimer); startTimer = null; }
}

function fadeToDefaultVolume(bgm) {
  clearAudioTimers();
  fadeTimer = setInterval(() => {
    if (bgm.volume < 0.4) {
      bgm.volume = Math.min(bgm.volume + 0.05, 0.4);
    } else {
      clearInterval(fadeTimer);
      fadeTimer = null;
    }
  }, 200);
}

function hardPauseBgm(resetPosition = false) {
  const bgm = document.getElementById('bgm');
  if (!bgm) return;
  clearAudioTimers();
  bgm.pause();
  if (resetPosition) bgm.currentTime = 0;
}

// Set the initial icon when the page loads
export function toggleMute() {
  isMuted = !isMuted;
  localStorage.setItem('op_muted', isMuted);
  const bgm = document.getElementById('bgm');

  if (isMuted) {
    hardPauseBgm();
  } else {
    if (!bgm.src || bgm.src.endsWith('null') || bgm.src === '') {
      bgm.src = 'assets/music_track.mp3';
    }
    bgm.play().then(() => {
      bgm.volume = 0;
      fadeToDefaultVolume(bgm);
    }).catch(() => {});
  }

  // Sync sidebar mute toggle
  const toggle = document.getElementById('sidebarMuteToggle');
  const icon   = document.getElementById('sidebarMuteIcon');
  const sub    = document.getElementById('sidebarMuteSub');
  if (toggle) toggle.checked = !isMuted;
  if (icon)   icon.textContent = isMuted ? '🔇' : '🔊';
  if (sub)    sub.textContent  = isMuted ? 'Muted' : 'Playing';
}

export function startMusic() {
  if (isMuted) return;

  const bgm = document.getElementById('bgm');
  if (!bgm) return;

  bgm.volume = 0; // Start silent for the fade-in effect

  // Wait 3 seconds before trying to play
  startTimer = setTimeout(() => {
    bgm.play().then(() => {
      fadeToDefaultVolume(bgm);
    }).catch(() => {
      // Autoplay blocked by browser. Wait for the user's first tap/click to play.
      const playOnTap = () => {
        bgm.play().then(() => {
          bgm.volume = 0;
          fadeToDefaultVolume(bgm);
        });
        document.removeEventListener('click', playOnTap);
        document.removeEventListener('touchstart', playOnTap);
      };
      document.addEventListener('click', playOnTap);
      document.addEventListener('touchstart', playOnTap);
    });
  }, 3000); 
}

window.addEventListener('load', startMusic);

// Pause music when app is minimized/hidden (no auto-resume)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Do not auto-resume after app/background/phone lock.
    hardPauseBgm();
  }
});

// Extra lifecycle guards for PWAs/mobile browsers.
window.addEventListener('pagehide', () => hardPauseBgm());
window.addEventListener('beforeunload', () => hardPauseBgm());
window.addEventListener('freeze', () => hardPauseBgm());
