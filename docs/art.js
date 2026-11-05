/* Original line-art illustrations (cat, dog, paw) used as faint decoration. */
(function (global) {
  'use strict';
  const CAT = `<svg viewBox="0 0 220 260" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M78 246c-16 0-24-14-20-34 4-22 10-44 14-62-8-11-12-26-10-41l-6-38 26 22c9-4 23-4 32 0l26-22-6 38c2 15-2 30-10 41 4 18 10 40 14 62 4 20-4 34-20 34"/>
    <path d="M136 240c26 4 46-6 46-30 0-18-14-24-22-16"/>
    <path d="M96 246v-26M118 246v-26"/>
    <path d="M90 108c3 3 7 3 10 0M122 108c3 3 7 3 10 0"/>
    <path d="M108 120l3 3 3-3M111 123v4c-2 3-6 3-8 1M111 127c2 3 6 3 8 1"/>
    <path d="M86 122l-18-2M86 127l-17 4M136 122l18-2M136 127l17 4"/>
  </svg>`;
  const DOG = `<svg viewBox="0 0 240 260" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M70 248v-64c0-26 12-44 30-52-10-9-14-22-12-36 3-19 18-32 38-32 12 0 22 4 29 12l24 6c8 2 8 12 0 15l-22 6c-2 10-7 18-14 23 18 10 28 30 28 56v66"/>
    <path d="M104 74c-14 2-22 20-17 40 8-2 15-14 18-30"/>
    <path d="M140 92h.01"/>
    <path d="M187 98c3 1 5 3 4 6"/>
    <path d="M100 248v-40M150 248v-40"/>
    <path d="M190 236c20-4 30-22 22-40"/>
    <path d="M108 150c8 6 20 8 32 4"/>
  </svg>`;
  const PAW = `<svg viewBox="0 0 64 64" fill="currentColor" aria-hidden="true">
    <ellipse cx="32" cy="42" rx="13" ry="11"/><ellipse cx="15" cy="27" rx="5.5" ry="7"/><ellipse cx="25" cy="17" rx="5.5" ry="7.5"/>
    <ellipse cx="39" cy="17" rx="5.5" ry="7.5"/><ellipse cx="49" cy="27" rx="5.5" ry="7"/></svg>`;
  global.PSART = { CAT, DOG, PAW };
})(window);
