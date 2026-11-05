/* Original line-art illustrations and seasonal motifs (all drawn for this site). */
(function (global) {
  'use strict';

  const cat = (extra = '') => `<svg viewBox="0 0 220 260" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M78 246c-16 0-24-14-20-34 4-22 10-44 14-62-8-11-12-26-10-41l-6-38 26 22c9-4 23-4 32 0l26-22-6 38c2 15-2 30-10 41 4 18 10 40 14 62 4 20-4 34-20 34"/>
    <path d="M136 240c26 4 46-6 46-30 0-18-14-24-22-16"/>
    <path d="M96 246v-26M118 246v-26"/>
    <path d="M90 108c3 3 7 3 10 0M122 108c3 3 7 3 10 0"/>
    <path d="M108 120l3 3 3-3M111 123v4c-2 3-6 3-8 1M111 127c2 3 6 3 8 1"/>
    <path d="M86 122l-18-2M86 127l-17 4M136 122l18-2M136 127l17 4"/>${extra}</svg>`;

  const dog = (extra = '') => `<svg viewBox="0 0 240 260" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M70 248v-64c0-26 12-44 30-52-10-9-14-22-12-36 3-19 18-32 38-32 12 0 22 4 29 12l24 6c8 2 8 12 0 15l-22 6c-2 10-7 18-14 23 18 10 28 30 28 56v66"/>
    <path d="M104 74c-14 2-22 20-17 40 8-2 15-14 18-30"/>
    <path d="M140 92h.01"/>
    <path d="M187 98c3 1 5 3 4 6"/>
    <path d="M100 248v-40M150 248v-40"/>
    <path d="M190 236c20-4 30-22 22-40"/>
    <path d="M108 150c8 6 20 8 32 4"/>${extra}</svg>`;

  const PAW = `<svg viewBox="0 0 64 64" fill="currentColor" aria-hidden="true">
    <ellipse cx="32" cy="42" rx="13" ry="11"/><ellipse cx="15" cy="27" rx="5.5" ry="7"/><ellipse cx="25" cy="17" rx="5.5" ry="7.5"/>
    <ellipse cx="39" cy="17" rx="5.5" ry="7.5"/><ellipse cx="49" cy="27" rx="5.5" ry="7"/></svg>`;

  // Accessories drawn in the cat / dog coordinate systems
  // Accessories, in the cat (head top ≈ y93, x62–134) and dog (neck ≈ y128, x100–145) coordinates
  const SANTA_HAT = (red) => `<g stroke="currentColor" stroke-width="1.6"><path d="M66 88 C70 60 92 42 118 44 C132 46 142 56 146 68 L130 86 Z" fill="${red}"/>
    <rect x="58" y="82" width="82" height="14" rx="7" fill="#f7f4ee"/><circle cx="148" cy="68" r="8" fill="#f7f4ee"/></g>`;
  const SCARF = (c) => `<g stroke="currentColor" stroke-width="1.6"><path d="M98 128 C116 140 132 140 146 126 L148 138 C134 152 114 152 96 140 Z" fill="${c}"/>
    <path d="M126 146 L132 178 L145 174 L139 144 Z" fill="${c}"/><path d="M132 178 l-1 6M138 177 l0 6M145 174 l1 6"/></g>`;
  const PILGRIM_BOW = (c) => `<g stroke="currentColor" stroke-width="1.6"><path d="M122 134 L104 124 L104 144 Z M122 134 L140 124 L140 144 Z" fill="${c}"/><circle cx="122" cy="134" r="5" fill="${c}"/></g>`;
  const WITCH_HAT = (c) => `<g stroke="currentColor" stroke-width="1.6"><path d="M76 88 L104 18 L124 86 Z" fill="${c}"/><path d="M50 90 C74 80 122 80 146 88 C122 98 74 98 50 90 Z" fill="${c}"/></g>`;
  const FLOWER_CROWN = (a, b) => `<g stroke="currentColor" stroke-width="1.3">${[[70, 92, a], [86, 87, b], [102, 85, a], [118, 87, b], [132, 92, a]].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="6.5" fill="${c}"/>`).join('')}</g>`;
  const BANDANA = (c) => `<g stroke="currentColor" stroke-width="1.6"><path d="M98 130 C116 142 132 142 146 128 L124 166 Z" fill="${c}"/></g>`;

  // Seasonal motifs, 40x40 each. `c` = main colour.
  const M = {
    maple: (c) => `<path d="M20 3 L23 12 L31 9 L28 17 L37 19 L29 23 L32 30 L23 27 L20 35 L17 27 L8 30 L11 23 L3 19 L12 17 L9 9 L17 12 Z" fill="${c}"/><path d="M20 33 V40" stroke="${c}" stroke-width="2"/>`,
    leaf: (c) => `<path d="M20 4 C31 12 31 28 20 36 C9 28 9 12 20 4 Z" fill="${c}"/><path d="M20 8 V40 M20 18 L26 13 M20 25 L14 20 M20 30 L26 25" stroke="rgba(255,255,255,.55)" stroke-width="1.3"/>`,
    pumpkin: (c) => `<path d="M20 12 C8 12 3 20 5 28 C7 35 15 37 20 34 C25 37 33 35 35 28 C37 20 32 12 20 12 Z" fill="${c}"/><path d="M20 12 C14 18 14 30 20 34 M20 12 C26 18 26 30 20 34" stroke="rgba(0,0,0,.18)" stroke-width="1.4" fill="none"/><path d="M20 12 V6 C22 4 25 5 26 7" stroke="#6b5a3a" stroke-width="2" fill="none"/>`,
    acorn: (c) => `<path d="M13 17 C13 27 17 32 20 34 C23 32 27 27 27 17 Z" fill="${c}"/><path d="M11 17 H29 C29 12 25 9 20 9 C15 9 11 12 11 17 Z" fill="#7a5b3c"/><path d="M20 9 V5" stroke="#7a5b3c" stroke-width="2"/>`,
    snow: (c) => `<g stroke="${c}" stroke-width="2" stroke-linecap="round" fill="none"><path d="M20 4 V36 M6 12 L34 28 M6 28 L34 12"/><path d="M16 6 L20 10 L24 6 M16 34 L20 30 L24 34 M6 17 L11 14 L8 9 M34 23 L29 26 L32 31 M6 23 L11 26 L8 31 M34 17 L29 14 L32 9"/></g>`,
    ornament: (c) => `<circle cx="20" cy="24" r="11" fill="${c}"/><path d="M9.5 22 C16 26 24 26 30.5 22" stroke="rgba(255,255,255,.6)" stroke-width="1.5" fill="none"/><rect x="17" y="10" width="6" height="4" fill="#b9a46a"/><path d="M20 10 C18 6 22 4 22 7" stroke="#b9a46a" stroke-width="1.5" fill="none"/>`,
    tree: (c) => `<path d="M20 3 L30 15 H25 L33 25 H27 L35 33 H5 L13 25 H7 L15 15 H10 Z" fill="${c}"/><rect x="18" y="33" width="4" height="5" fill="#7a5b3c"/>`,
    star: (c) => `<path d="M20 4 L24 15 L36 15 L26 22 L30 34 L20 27 L10 34 L14 22 L4 15 L16 15 Z" fill="${c}"/>`,
    heart: (c) => `<path d="M20 34 C8 25 4 18 8 11 C11 6 18 7 20 12 C22 7 29 6 32 11 C36 18 32 25 20 34 Z" fill="${c}"/>`,
    clover: (c) => `<circle cx="20" cy="12" r="6.5" fill="${c}"/><circle cx="12.5" cy="23" r="6.5" fill="${c}"/><circle cx="27.5" cy="23" r="6.5" fill="${c}"/><path d="M20 21 C22 29 26 34 31 37" stroke="${c}" stroke-width="2" fill="none"/>`,
    tulip: (c) => `<path d="M13 9 L16.5 15 L20 8 L23.5 15 L27 9 C28 19 25 24 20 24 C15 24 12 19 13 9 Z" fill="${c}"/><path d="M20 24 V39 M20 33 C15 31 12 28 11 24 M20 35 C25 33 28 30 29 26" stroke="#7d9566" stroke-width="2" fill="none"/>`,
    drop: (c) => `<path d="M20 5 C26 15 30 21 30 26 A10 10 0 0 1 10 26 C10 21 14 15 20 5 Z" fill="${c}"/>`,
    flower: (c) => `${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="20" cy="11" rx="5.5" ry="8" fill="${c}" transform="rotate(${a} 20 20)"/>`).join('')}<circle cx="20" cy="20" r="4.5" fill="#e3c26a"/>`,
    sun: (c) => `<circle cx="20" cy="20" r="7.5" fill="${c}"/><g stroke="${c}" stroke-width="2" stroke-linecap="round">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<path d="M20 5 V9" transform="rotate(${a} 20 20)"/>`).join('')}</g>`,
    wave: (c) => `<path d="M2 22 C8 15 14 15 20 22 C26 29 32 29 38 22" stroke="${c}" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M2 30 C8 23 14 23 20 30 C26 37 32 37 38 30" stroke="${c}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".6"/>`,
    bat: (c) => `<path d="M20 16 C18 14 17 14 16 15 C13 12 8 12 4 15 C7 16 8 19 8 22 C11 20 14 21 16 23 C17 21 19 21 20 23 C21 21 23 21 24 23 C26 21 29 20 32 22 C32 19 33 16 36 15 C32 12 27 12 24 15 C23 14 22 14 20 16 Z" fill="${c}"/>`,
    firework: (c) => `<g stroke="${c}" stroke-width="1.8" stroke-linecap="round">${[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => `<path d="M20 6 V12" transform="rotate(${a} 20 20)"/>`).join('')}</g><circle cx="20" cy="20" r="2" fill="${c}"/>`,
    apple: (c) => `<path d="M20 12 C14 8 6 12 7 21 C8 30 14 35 20 32 C26 35 32 30 33 21 C34 12 26 8 20 12 Z" fill="${c}"/><path d="M20 12 C20 8 21 6 23 4" stroke="#6b5a3a" stroke-width="2" fill="none"/><path d="M21 9 C24 6 28 7 29 9 C26 11 23 11 21 9 Z" fill="#7d9566"/>`,
  };
  const motif = (key, color) => `<svg viewBox="0 0 40 40" aria-hidden="true">${M[key](color)}</svg>`;

  global.PSART = { cat, dog, PAW, motif, SANTA_HAT, SCARF, PILGRIM_BOW, WITCH_HAT, FLOWER_CROWN, BANDANA };
})(window);
