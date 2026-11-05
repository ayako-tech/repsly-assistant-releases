/* Pet sitter availability — shared logic (client page & admin page)
 * Every day is "open" unless an entry says otherwise:
 *   entries: [{ id, start, end, status: 'limited' | 'booked' | 'off', note, noteEn }]
 * Later entries win where they overlap. Nothing about services, counts or prices. */
(function (global) {
  'use strict';

  const pad = (n) => String(n).padStart(2, '0');
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (s) => {
    const [y, m, d] = String(s).split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  const addDays = (s, n) => {
    const d = parse(s);
    d.setDate(d.getDate() + n);
    return ymd(d);
  };
  const today = () => ymd(new Date());
  const WEEK = ['日', '月', '火', '水', '木', '金', '土'];
  const WEEK_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTH_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONTH_EN_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const fmtDate = (s) => {
    const d = parse(s);
    return `${d.getMonth() + 1}/${d.getDate()}(${WEEK[d.getDay()]})`;
  };
  const fmtDateEn = (s) => {
    const d = parse(s);
    return `${WEEK_EN[d.getDay()]}, ${MONTH_EN[d.getMonth()]} ${d.getDate()}`;
  };
  const fmtRange = (a, b) => (a === b ? fmtDate(a) : `${fmtDate(a)}〜${fmtDate(b)}`);
  const esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const SYMBOL = { open: '○', limited: '△', booked: '×', off: 'Off' };
  const STATUS_JA = { open: '空き', limited: '一部OK', booked: '埋まり', off: 'お休み' };
  const STATUS_EN = { open: 'Open', limited: 'Limited', booked: 'Booked', off: 'Day off' };

  const DEFAULT_DATA = {
    settings: {
      message: 'ご予約・ご相談はお気軽にご連絡ください。',
      rateNote: '料金は犬種やリクエスト内容によって変わりますので、お気軽にお問い合わせください。',
      contactLabel: '',
      contactUrl: '',
      monthsAhead: 3,
      regularHolidays: [],
      season: 'auto',
      heroImage: '',
      // English shown on the client page
      en: {
        title: 'Pet Sitting Availability',
        message: 'Feel free to get in touch for bookings or questions.',
        rateNote: "Rates vary depending on your pet's breed and your requests. Feel free to reach out for details.",
        contactLabel: 'Message me',
      },
    },
    entries: [],
    updatedAt: null,
  };

  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }

  function normalize(raw) {
    const d = clone(DEFAULT_DATA);
    if (!raw || typeof raw !== 'object') return d;
    const s = raw.settings || {};
    for (const k of Object.keys(d.settings)) if (k !== 'en' && s[k] !== undefined) d.settings[k] = s[k];
    Object.assign(d.settings.en, s.en || {});
    if (!Array.isArray(d.settings.regularHolidays)) d.settings.regularHolidays = [];
    d.entries = Array.isArray(raw.entries) ? raw.entries : [];
    d.updatedAt = raw.updatedAt || null;
    return d;
  }

  function dayInfo(data, date) {
    const res = { date, past: date < today(), status: 'open', note: '', noteEn: '' };
    if (data.settings.regularHolidays.includes(parse(date).getDay())) res.status = 'off';
    for (const e of data.entries) {
      if (e.start <= date && date <= (e.end || e.start)) {
        res.status = e.status;
        res.note = e.note || '';
        res.noteEn = e.noteEn || '';
      }
    }
    return res;
  }

  global.PS = {
    pad, ymd, parse, addDays, today, fmtDate, fmtDateEn, fmtRange, esc,
    WEEK, WEEK_EN, MONTH_EN, MONTH_EN_FULL, SYMBOL, STATUS_JA, STATUS_EN,
    DEFAULT_DATA, clone, normalize, dayInfo,
  };
})(window);
