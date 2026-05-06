'use strict';

/* ═══════════════════════════════════════════════════════════════════════════
   PIRATE RANK / LEVEL SYSTEM
   Levels are based on episodes watched. Thresholds align with saga milestones.
   ═══════════════════════════════════════════════════════════════════════════ */
export const LEVELS = [
  { min: 0,    max: 0,    label: 'Landlubber',           icon: '🏡',  sub: 'The sea awaits you, sailor...',                  color: '#7090b8' },
  { min: 1,    max: 53,   label: 'Cabin Boy',            icon: '⚓',  sub: 'Taking your first steps on the Grand Line.',      color: '#00c4a8' },
  { min: 54,   max: 130,  label: 'East Blue Pirate',     icon: '🏴‍☠️', sub: 'You\'ve felt the first winds of adventure!',      color: '#00e5d4' },
  { min: 131,  max: 206,  label: 'Sky Island Explorer',  icon: '☁️',  sub: 'You\'ve sailed both sea and sky.',               color: '#3d8fff' },
  { min: 207,  max: 325,  label: 'Sea Dog',              icon: '🚤',  sub: 'The Water 7 waters run through you.',             color: '#f0a832' },
  { min: 326,  max: 516,  label: 'Supernova',            icon: '⚡',  sub: 'You\'ve survived the Summit War.',               color: '#ff5566' },
  { min: 517,  max: 746,  label: 'New World Pioneer',    icon: '🌍',  sub: 'You dare challenge the New World!',              color: '#8050cc' },
  { min: 747,  max: 889,  label: 'Shichibukai',          icon: '⚖️',  sub: 'A government-recognized powerhouse.',            color: '#e08820' },
  { min: 890,  max: 1085, label: 'Yonko',                icon: '🔥',  sub: 'One of the Four Emperors of the Sea!',           color: '#e84040' },
  { min: 1086, max: 1155, label: 'Final Saga Veteran',   icon: '🤖',  sub: 'Egghead: a clash of the ages.',                  color: '#b888ff' },
  { min: 1156, max: 9999, label: 'Future Pirate King',   icon: '👑',  sub: 'You\'ve conquered the Grand Line!!',             color: '#f5c058' },
];
