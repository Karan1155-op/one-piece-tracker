'use strict';

/* ═══════════════════════════════════════════════════════════════════════════
   MUSIC COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export let isMuted = localStorage.getItem('op_muted') === 'true';

// Set the initial icon when the page loads
export function toggleMute() {
  isMuted = !isMuted;
  localStorage.setItem('op_muted', isMuted);
  const bgm = document.getElementById('bgm');

  if (isMuted) {
    bgm.pause();
  } else {
    if (!bgm.src || bgm.src.endsWith('null') || bgm.src === '') {
      bgm.src = 'assets/music_track.mp3';
    }
    bgm.play().catch(() => {});
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
  setTimeout(() => {
    bgm.play().then(() => {
      // Fade in smoothly to 40% volume (0.4)
      let fade = setInterval(() => {
        if (bgm.volume < 0.4) {
          bgm.volume = Math.min(bgm.volume + 0.05, 0.4);
        } else {
          clearInterval(fade);
        }
      }, 200);
    }).catch(() => {
      // Autoplay blocked by browser. Wait for the user's first tap/click to play.
      const playOnTap = () => {
        bgm.play().then(() => {
          let fade = setInterval(() => {
            if (bgm.volume < 0.4) {
              bgm.volume = Math.min(bgm.volume + 0.05, 0.4);
            } else {
              clearInterval(fade);
            }
          }, 200);
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

// Pause music when app is minimized, resume when opened
document.addEventListener('visibilitychange', () => {
  const bgm = document.getElementById('bgm');
  if (document.hidden) {
    bgm.pause();
  } else {
    if (!isMuted) {
      bgm.play().then(() => {
        bgm.volume = 0;
        let fade = setInterval(() => {
          if (bgm.volume < 0.4) {
            bgm.volume = Math.min(bgm.volume + 0.05, 0.4);
          } else {
            clearInterval(fade);
          }
        }, 200);
      }).catch(() => {});
    }
  }
});
