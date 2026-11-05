/* Seasonal looks for the client page (Northern Hemisphere / US calendar).
 * Each month: hero colours, a short line, scattered motifs, and accessories for the cat & dog. */
(function (global) {
  'use strict';
  const A = global.PSART;
  // [motif, colour, x%, y%, size px, rotation]
  const S = {
    1: { name: 'Winter', line: 'January · Cozy winter days', bg: '#e9eef2', ink: '#2c3640', accent: '#5f7d99',
      motifs: [['snow', '#8fa9c0', 58, 14, 26, 0], ['snow', '#a9bccd', 70, 52, 18, 20], ['snow', '#8fa9c0', 84, 10, 22, 10], ['snow', '#b9c9d6', 94, 46, 16, 0], ['snow', '#a9bccd', 48, 70, 14, 15], ['snow', '#c3d1dc', 40, 10, 12, 0]],
      dog: () => A.SCARF('#a8544a') },
    2: { name: "Valentine's", line: "February · Valentine's season", bg: '#f4e9e8', ink: '#3d2c2e', accent: '#b0606b',
      motifs: [['heart', '#d79aa2', 60, 16, 22, -12], ['heart', '#c27983', 86, 12, 18, 10], ['heart', '#e3b4ba', 72, 56, 14, 0], ['heart', '#d79aa2', 95, 50, 12, -8], ['heart', '#e8c3c7', 46, 66, 12, 12]],
      dog: () => A.BANDANA('#c27983') },
    3: { name: 'Early spring', line: 'March · Hello, spring', bg: '#ebf0e4', ink: '#2e3a2c', accent: '#6f8f5a',
      motifs: [['clover', '#8fae7a', 58, 14, 24, -10], ['clover', '#a7c093', 84, 12, 18, 14], ['clover', '#8fae7a', 70, 56, 14, 0], ['leaf', '#b5c9a3', 94, 46, 16, 30]],
      dog: () => A.BANDANA('#7f9f6a') },
    4: { name: 'Spring showers', line: 'April · Spring showers', bg: '#e8eef1', ink: '#2b3640', accent: '#6b8fa3',
      motifs: [['drop', '#9db6c6', 56, 10, 14, 0], ['drop', '#b3c7d3', 64, 30, 10, 0], ['drop', '#9db6c6', 80, 8, 12, 0], ['tulip', '#d692a0', 92, 40, 26, 0], ['tulip', '#e0b46a', 72, 58, 20, -6], ['drop', '#b3c7d3', 46, 60, 10, 0]],
      cat: () => A.FLOWER_CROWN('#e2a9b4', '#f0d58c') },
    5: { name: 'In bloom', line: 'May · Everything in bloom', bg: '#f3ede6', ink: '#3a2f2c', accent: '#b07a8c',
      motifs: [['flower', '#e1aebb', 58, 14, 24, 0], ['flower', '#cfb6dc', 84, 12, 20, 20], ['flower', '#f0cf8a', 72, 56, 16, 10], ['flower', '#e1aebb', 95, 50, 14, 0], ['leaf', '#a9c095', 46, 68, 14, -30]],
      cat: () => A.FLOWER_CROWN('#e1aebb', '#cfb6dc') },
    6: { name: 'Summer', line: 'June · Hello, summer', bg: '#f5efdd', ink: '#3b3424', accent: '#c19a3c',
      motifs: [['sun', '#e2bd5c', 86, 12, 40, 0], ['flower', '#f0cf8a', 60, 50, 16, 0], ['leaf', '#a9c095', 70, 16, 16, 30], ['flower', '#e9b48c', 96, 56, 14, 10]],
      dog: () => A.BANDANA('#e2bd5c') },
    7: { name: '4th of July', line: 'July · Summer celebrations', bg: '#eef0f4', ink: '#26303f', accent: '#3f5e8c',
      motifs: [['firework', '#c45a4e', 60, 12, 34, 0], ['firework', '#5a77a6', 86, 10, 28, 0], ['star', '#c45a4e', 74, 52, 14, 10], ['star', '#5a77a6', 95, 46, 12, -10], ['star', '#d9a441', 48, 66, 10, 0]],
      dog: () => A.BANDANA('#c45a4e') },
    8: { name: 'Late summer', line: 'August · Lazy summer days', bg: '#e7f0ee', ink: '#253837', accent: '#4f8b8b',
      motifs: [['sun', '#e2bd5c', 84, 10, 34, 0], ['wave', '#7fb0ad', 58, 56, 30, 0], ['wave', '#9cc4c1', 74, 66, 24, 0], ['wave', '#7fb0ad', 92, 60, 22, 0]],
      dog: () => A.BANDANA('#5f9c9a') },
    9: { name: 'Early fall', line: 'September · First hints of fall', bg: '#f2ede1', ink: '#3a3226', accent: '#a4793a',
      motifs: [['leaf', '#c9a45a', 58, 14, 22, 30], ['apple', '#c0574a', 86, 12, 22, 0], ['leaf', '#a9b06a', 72, 56, 16, -20], ['leaf', '#d4935a', 95, 48, 14, 60], ['apple', '#d2a04a', 46, 66, 14, 0]],
      dog: () => A.BANDANA('#c9a45a') },
    10: { name: 'Halloween', line: 'October · Happy Halloween', bg: '#f2e8db', ink: '#3a2c22', accent: '#c46a2f',
      motifs: [['pumpkin', '#d9813e', 60, 56, 28, 0], ['pumpkin', '#e39a52', 74, 64, 18, 6], ['bat', '#4a4040', 62, 12, 26, -8], ['bat', '#5a4f4f', 84, 18, 20, 10], ['bat', '#4a4040', 94, 6, 14, 0], ['leaf', '#c97a3e', 46, 14, 14, 40]],
      cat: () => A.WITCH_HAT('#4a4040'), dog: () => A.BANDANA('#d9813e') },
    11: { name: 'Thanksgiving', line: 'November · Thanksgiving season', bg: '#f3e9db', ink: '#3b2a1f', accent: '#a5582f',
      motifs: [['maple', '#c0623a', 58, 12, 26, -15], ['maple', '#d99a3e', 72, 30, 18, 25], ['leaf', '#b5753e', 86, 8, 20, 40], ['maple', '#a8452f', 95, 40, 16, 10], ['pumpkin', '#d9813e', 62, 62, 24, 0], ['acorn', '#b88a54', 76, 70, 14, -10], ['leaf', '#d4a24e', 46, 70, 14, -40]],
      dog: () => A.PILGRIM_BOW('#a5582f') },
    12: { name: 'Christmas', line: 'December · Merry Christmas & Happy Holidays', bg: '#eef0ec', ink: '#26302a', accent: '#9e3b36',
      motifs: [['tree', '#4f7a5c', 92, 34, 40, 0], ['ornament', '#b5433b', 60, 14, 20, 0], ['ornament', '#c9a14a', 72, 30, 16, 0], ['star', '#d4ad4e', 84, 8, 18, 0], ['snow', '#a9bccd', 50, 60, 14, 0], ['snow', '#b9c9d6', 66, 66, 12, 20], ['ornament', '#5f8a6d', 46, 14, 12, 0]],
      cat: () => A.SANTA_HAT('#b5433b'), dog: () => A.SCARF('#4f7a5c') },
  };
  const NEUTRAL = { name: '', line: 'Availability', bg: '#ece8e1', ink: '#2a2b28', accent: '#6f6a5f', motifs: [] };

  // setting: 'auto' (follow the current month) | 'off' | '1'..'12' (always that month)
  function pick(setting, date, override) {
    const v = override || setting || 'auto';
    if (v === 'off') return NEUTRAL;
    const m = v === 'auto' ? date.getMonth() + 1 : Number(v);
    return S[m] || NEUTRAL;
  }
  global.PSSEASON = { pick, S, NEUTRAL };
})(window);
