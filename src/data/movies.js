'use strict';

/* ═══════════════════════════════════════════════════════════════════════════
   MOVIES DATA
   All 15 theatrical films · placement & recommendations via community consensus
   rec: 'high' = Highly Recommended  |  'watch' = Worth Watching  |  'skip' = Skip/Recap
   ═══════════════════════════════════════════════════════════════════════════ */
export const MOVIES = [
  { id:  1, name: 'One Piece: The Movie',                           year: 2000, icon: '🏴‍☠️', requiredEpisode:  18,   rec: 'skip',  note: 'Standalone retelling of early East Blue. Safe to skip.' },
  { id:  2, name: 'Clockwork Island Adventure',                     year: 2001, icon: '⚙️',  requiredEpisode:  53,   rec: 'skip',  note: 'Non-canon standalone adventure. Fun but skippable.' },
  { id:  3, name: "Chopper's Kingdom on the Island of Strange Animals", year: 2002, icon: '🦌', requiredEpisode:  102,   rec: 'skip',  note: 'Chopper-focused non-canon. Very kid-friendly.' },
  { id:  4, name: 'Dead End Adventure',                             year: 2003, icon: '💀',  requiredEpisode: 138,   rec: 'watch', note: 'Best of the early movies — great action and atmosphere.' },
  { id:  5, name: 'The Cursed Holy Sword',                          year: 2004, icon: '⚔️',  requiredEpisode: 143,   rec: 'skip',  note: 'Zoro-focused but non-canon and forgettable.' },
  { id:  6, name: 'Baron Omatsuri and the Secret Island',           year: 2005, icon: '🌺',  requiredEpisode: 224,   rec: 'high',  note: '⭐ Uniquely dark. Directed by Mamoru Hosoda. A must-watch.' },
  { id:  7, name: 'The Giant Mechanical Soldier of Karakuri Castle',year: 2006, icon: '🏯',  requiredEpisode: 228,   rec: 'skip',  note: 'Fun non-canon filler adventure. Skippable.' },
  { id:  8, name: 'The Desert Princess and the Pirates',            year: 2007, icon: '🏜️',  requiredEpisode: 130,   rec: 'skip',  note: 'Alabasta recap film. Skip if you watched the arc.' },
  { id:  9, name: 'Episode of Chopper Plus',                        year: 2008, icon: '❄️',  requiredEpisode: 130,   rec: 'skip',  note: 'Drum Island recap with post-timeskip crew. Skip.' },
  { id: 10, name: 'Strong World',                                   year: 2009, icon: '⚡',  requiredEpisode: 429,   rec: 'high',  note: '⭐ Canon-adjacent, written by Oda himself. Essential.' },
  { id: 11, name: 'One Piece 3D: Straw Hat Chase',                  year: 2011, icon: '🕺',  requiredEpisode: 381,   rec: 'skip',  note: 'Luffy wakes up to a missing crew and starts to hunt for them.' },
  { id: 12, name: 'Film Z',                                         year: 2012, icon: '🔥',  requiredEpisode: 578,   rec: 'high',  note: '⭐ Outstanding animation and a genuinely great villain.' },
  { id: 13, name: 'Film Gold',                                      year: 2016, icon: '💰',  requiredEpisode: 750,   rec: 'high',  note: '⭐ Lavish production and great crew moments. Must-watch.' },
  { id: 14, name: 'Stampede',                                       year: 2019, icon: '🌊',  requiredEpisode: 889,   rec: 'high',  note: '⭐ 20th anniversary celebration. Fan-service done right.' },
  { id: 15, name: 'Film Red',                                       year: 2022, icon: '🎵',  requiredEpisode: 1030,  rec: 'high',  note: '⭐ Shanks lore, stunning music, canon-relevant details.' },
];
