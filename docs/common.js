/* ペットシッター空き状況 — 共通ロジック（クライアント画面・管理画面の両方で使用） */
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
  const fmtDate = (s) => {
    const d = parse(s);
    return `${d.getMonth() + 1}/${d.getDate()}(${WEEK[d.getDay()]})`;
  };
  const esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const DEFAULT_DATA = {
    settings: {
      businessName: 'ペットシッター 空き状況',
      message: 'ご予約・ご相談はお気軽にご連絡ください。',
      contactLabel: '',
      contactUrl: '',
      showCounts: true,
      monthsAhead: 3,
      exclusiveNight: true,
      regularHolidays: [],
      services: {
        stay: { enabled: true, label: 'お泊まりシッター', short: '泊', capacity: 1, note: 'ご自宅に泊まってお世話します' },
        boarding: { enabled: true, label: 'お預かり', short: '預', capacity: 2, note: 'シッター宅でお預かりします' },
        visit: { enabled: true, label: '訪問シッター', short: '訪', note: '1日1〜2回ご自宅へ伺います' },
      },
      visitSlots: [
        { id: 'morning', label: '朝', time: '7:00〜10:00', capacity: 3 },
        { id: 'noon', label: '昼', time: '11:00〜15:00', capacity: 2 },
        { id: 'evening', label: '夕', time: '16:00〜20:00', capacity: 3 },
      ],
    },
    closed: [],
    // 受付制限: { id, start, end, block: ['stay'|'boarding'|'visit'], visitSlots: null | [slotId...] }
    //   start〜end（両端含む）の間、block のサービスは受付なし。visitSlots があれば訪問はその時間帯のみ。
    rules: [],
    bookings: [],
    updatedAt: null,
  };

  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }

  function normalize(raw) {
    const d = clone(DEFAULT_DATA);
    if (!raw || typeof raw !== 'object') return d;
    const s = raw.settings || {};
    Object.assign(d.settings, s);
    d.settings.services = clone(DEFAULT_DATA.settings.services);
    for (const k of Object.keys(d.settings.services)) {
      Object.assign(d.settings.services[k], (s.services || {})[k] || {});
    }
    if (Array.isArray(s.visitSlots)) d.settings.visitSlots = s.visitSlots;
    if (!Array.isArray(d.settings.regularHolidays)) d.settings.regularHolidays = [];
    d.closed = Array.isArray(raw.closed) ? raw.closed : [];
    d.rules = Array.isArray(raw.rules) ? raw.rules : [];
    d.bookings = Array.isArray(raw.bookings) ? raw.bookings : [];
    d.updatedAt = raw.updatedAt || null;
    return d;
  }

  /* ---------- 空き計算 ---------- */

  function closedInfo(data, date) {
    const wd = parse(date).getDay();
    if (data.settings.regularHolidays.includes(wd)) return { closed: true, note: '定休日' };
    for (const c of data.closed) {
      const end = c.end || c.start;
      if (c.start <= date && date <= end) return { closed: true, note: c.note || 'お休み' };
    }
    return { closed: false, note: '' };
  }

  function ruleInfo(data, date) {
    const block = new Set();
    let slots = null;
    for (const r of data.rules) {
      const end = r.end || r.start;
      if (!(r.start <= date && date <= end)) continue;
      (r.block || []).forEach((k) => block.add(k));
      if (Array.isArray(r.visitSlots)) {
        slots = slots ? slots.filter((x) => r.visitSlots.includes(x)) : r.visitSlots.slice();
      }
    }
    return { block, slots };
  }

  // お泊まり・お預かり: start(開始日) 〜 end(終了日=チェックアウト日) の「夜」を占有。end当日の夜は空く。
  // 訪問: start 〜 end の各日（両端含む）、指定スロットを占有。
  function usage(data, date) {
    let stay = 0, boarding = 0;
    const visit = {};
    for (const b of data.bookings) {
      const count = Math.max(1, Number(b.count) || 1);
      if (b.type === 'stay' || b.type === 'boarding') {
        const end = b.end && b.end > b.start ? b.end : addDays(b.start, 1);
        if (b.start <= date && date < end) {
          if (b.type === 'stay') stay += count;
          else boarding += count;
        }
      } else if (b.type === 'visit') {
        const end = b.end || b.start;
        if (b.start <= date && date <= end) {
          for (const sid of b.slots || []) visit[sid] = (visit[sid] || 0) + count;
        }
      }
    }
    return { stay, boarding, visit };
  }

  function dayStatus(data, date) {
    const st = data.settings;
    const sv = st.services;
    const ci = closedInfo(data, date);
    const past = date < today();
    const u = usage(data, date);
    const ri = ruleInfo(data, date);
    const res = { date, past, closed: ci.closed, closedNote: ci.note };

    const night = (key, used, other) => {
      const cap = Math.max(0, Number(sv[key].capacity) || 0);
      let remaining = Math.max(0, cap - used);
      if (st.exclusiveNight && other > 0) remaining = 0;
      const blocked = ri.block.has(key);
      if (ci.closed || past || blocked) remaining = 0;
      return { enabled: !!sv[key].enabled, cap, used, remaining, blocked };
    };
    res.stay = night('stay', u.stay, u.boarding);
    res.boarding = night('boarding', u.boarding, u.stay);

    res.visits = st.visitSlots.map((slot) => {
      const cap = Math.max(0, Number(slot.capacity) || 0);
      const used = u.visit[slot.id] || 0;
      const blocked = ri.block.has('visit') || (ri.slots !== null && !ri.slots.includes(slot.id));
      const remaining = ci.closed || past || blocked ? 0 : Math.max(0, cap - used);
      return { id: slot.id, label: slot.label, time: slot.time, cap, used, remaining, blocked };
    });
    res.visit = { enabled: !!sv.visit.enabled && st.visitSlots.length > 0 };
    const open = res.visits.filter((v) => v.remaining > 0).length;
    const allBlocked = res.visits.every((v) => v.blocked);
    res.visit.mark = allBlocked ? 'na' : open === 0 ? 'full' : open === res.visits.filter((v) => !v.blocked).length && !res.visits.some((v) => v.blocked) ? 'ok' : 'few';
    return res;
  }

  function mark(x) {
    if (x.blocked) return 'na';
    if (x.remaining <= 0) return 'full';
    if (x.remaining === 1 && x.cap > 1) return 'few';
    return 'ok';
  }
  const SYMBOL = { ok: '○', few: '△', full: '×', na: '－' };

  function serviceMark(ds, key) {
    if (ds.past) return 'past';
    if (ds.closed) return 'closed';
    if (key === 'visit') return ds.visit.mark;
    return mark(ds[key]);
  }

  function enabledServices(data) {
    return ['stay', 'boarding', 'visit'].filter((k) => data.settings.services[k].enabled);
  }

  /* ---------- 描画 ---------- */

  function renderCalendar(el, data, opts) {
    const { year, month, filter = 'all', selected, onSelect } = opts;
    const first = new Date(year, month, 1);
    const startOffset = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const services = filter === 'all' ? enabledServices(data) : [filter];
    const t = today();

    let html = '<div class="cal-grid" role="grid">';
    WEEK.forEach((w, i) => {
      html += `<div class="cal-head ${i === 0 ? 'sun' : i === 6 ? 'sat' : ''}" role="columnheader">${w}</div>`;
    });
    for (let i = 0; i < startOffset; i++) html += '<div class="cal-cell empty"></div>';
    for (let day = 1; day <= daysInMonth; day++) {
      const date = ymd(new Date(year, month, day));
      const ds = dayStatus(data, date);
      const wd = (startOffset + day - 1) % 7;
      const cls = ['cal-cell'];
      if (ds.past) cls.push('past');
      if (ds.closed && !ds.past) cls.push('closed');
      if (date === t) cls.push('today');
      if (date === selected) cls.push('selected');
      let body = '';
      if (ds.past) {
        body = '';
      } else if (ds.closed) {
        body = '<span class="closed-label">休</span>';
      } else if (services.length === 1) {
        const m = serviceMark(ds, services[0]);
        body = `<span class="big m-${m}">${SYMBOL[m]}</span>`;
      } else {
        body = services
          .map((k) => {
            const m = serviceMark(ds, k);
            return `<span class="mini m-${m}"><i>${esc(data.settings.services[k].short)}</i>${SYMBOL[m]}</span>`;
          })
          .join('');
      }
      html += `<button type="button" class="${cls.join(' ')}" data-date="${date}" ${ds.past ? 'disabled' : ''}>
        <span class="num ${wd === 0 ? 'sun' : wd === 6 ? 'sat' : ''}">${day}</span>${body}</button>`;
    }
    html += '</div>';
    el.innerHTML = html;
    if (onSelect) {
      el.querySelectorAll('button[data-date]').forEach((b) =>
        b.addEventListener('click', () => onSelect(b.dataset.date))
      );
    }
  }

  function renderDetail(el, data, date) {
    const ds = dayStatus(data, date);
    const st = data.settings;
    const showCounts = st.showCounts;
    const label = { ok: '空きあり', few: '残りわずか', full: '満席', na: 'この日は受付していません', closed: 'お休み', past: '—' };
    let html = `<h3>${fmtDate(date)}</h3>`;
    if (ds.closed) {
      html += `<p class="detail-closed">${esc(ds.closedNote)}のため受付していません</p>`;
      el.innerHTML = html;
      return;
    }
    html += '<ul class="detail-list">';
    for (const k of enabledServices(data)) {
      const sv = st.services[k];
      if (k === 'visit') {
        html += `<li><div class="d-title">${esc(sv.label)}</div><div class="slots">`;
        for (const v of ds.visits) {
          const m = mark(v);
          const cnt = showCounts && v.remaining > 0 ? `<small>残${v.remaining}</small>` : '';
          html += `<div class="slot m-${m}"><span>${esc(v.label)}<small>${esc(v.time || '')}</small></span><b>${SYMBOL[m]}</b>${cnt}</div>`;
        }
        html += '</div></li>';
      } else {
        const x = ds[k];
        const m = mark(x);
        const cnt = showCounts && x.remaining > 0 && x.cap > 1 ? `（残り${x.remaining}枠）` : '';
        html += `<li><div class="d-title">${esc(sv.label)}<small>この日の夜</small></div>
          <div class="d-val m-${m}"><b>${SYMBOL[m]}</b> ${label[m]}${cnt}</div></li>`;
      }
    }
    html += '</ul>';
    el.innerHTML = html;
  }

  global.PS = {
    pad, ymd, parse, addDays, today, fmtDate, esc, WEEK,
    DEFAULT_DATA, clone, normalize, dayStatus, usage, ruleInfo, mark, serviceMark,
    enabledServices, renderCalendar, renderDetail, SYMBOL,
  };
})(window);
