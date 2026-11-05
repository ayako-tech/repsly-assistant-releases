/* 話し言葉（日本語）から空き状況の変更を読み取る。
 * 例：「20日から25日はドロップオフしか受けられない」→ △ Drop-in visits only
 *     「10日から12日は埋まった」→ ×　「12/1は休み」→ Off　「20日から25日は元に戻して」→ ○
 *     決まった言い方に当てはまらない内容は、そのままメモ付きの△にする（英訳は管理画面で）。
 * 結果はアクションの配列。画面で確認してから適用する。 */
(function (global) {
  'use strict';
  const PS = global.PS;

  const WD = { 日: 0, 月: 1, 火: 2, 水: 3, 木: 4, 金: 5, 土: 6 };

  function normalizeText(t) {
    return String(t || '')
      .normalize('NFKC')
      .replace(/[〜～~―─－-]/g, '〜')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /* ---------- 日付 ---------- */
  function mkDate(y, m, d) { return PS.ymd(new Date(y, m - 1, d)); }
  function validDate(y, m, d) {
    const x = new Date(y, m - 1, d);
    return x.getFullYear() === y && x.getMonth() === m - 1 && x.getDate() === d;
  }
  // 年の指定がない月日：今日より1ヶ月以上前なら来年とみなす
  function guessYear(m, d, todayStr) {
    const t = PS.parse(todayStr);
    let y = t.getFullYear();
    if (mkDate(y, m, d) < PS.addDays(todayStr, -31)) y += 1;
    return y;
  }
  function weekStart(todayStr) { // 月曜始まり
    const d = PS.parse(todayStr);
    const off = (d.getDay() + 6) % 7;
    return PS.addDays(todayStr, -off);
  }
  function weekdayDate(todayStr, prefix, wd) {
    if (prefix) {
      const add = prefix === '今週' ? 0 : prefix === '来週' ? 7 : 14;
      return PS.addDays(weekStart(todayStr), add + ((wd + 6) % 7));
    }
    const cur = PS.parse(todayStr).getDay();
    return PS.addDays(todayStr, (wd - cur + 7) % 7);
  }

  // テキスト中の日付を順に取り出す。各要素 { start, end, idx, len }
  function findDates(text, todayStr) {
    const out = [];
    const t = PS.parse(todayStr);
    let lastY = null, lastM = null;
    const re = /(?:(\d{4})年)?(\d{1,2})月(\d{1,2})日?|(?:(\d{4})\/)?(\d{1,2})\/(\d{1,2})|(\d{1,2})日|今日|きょう|本日|明日|あした|あす|明後日|あさって|(再来週|来週|今週)?(?:の)?(土日|週末)|(再来週|来週|今週)?(?:の)?([月火水木金土日])曜日?|今月(?:いっぱい|中|末まで)|来月(?:いっぱい|中)|年末年始|(\d{1,2})月(?:いっぱい|中|全部)/g;
    let m;
    while ((m = re.exec(text))) {
      const s = m[0];
      let start = null, end = null;
      if (m[2]) {
        const mo = +m[2], d = +m[3];
        const y = m[1] ? +m[1] : guessYear(mo, d, todayStr);
        if (!validDate(y, mo, d)) continue;
        start = mkDate(y, mo, d); lastY = y; lastM = mo;
      } else if (m[5]) {
        const mo = +m[5], d = +m[6];
        const y = m[4] ? +m[4] : guessYear(mo, d, todayStr);
        if (!validDate(y, mo, d)) continue;
        start = mkDate(y, mo, d); lastY = y; lastM = mo;
      } else if (m[7]) {
        const d = +m[7];
        let y, mo;
        if (lastM) { y = lastY; mo = lastM; } else {
          y = t.getFullYear(); mo = t.getMonth() + 1;
          if (d < t.getDate()) { mo += 1; if (mo > 12) { mo = 1; y += 1; } }
        }
        // 「28日から3日」のように前の日付より小さい日は翌月
        if (out.length && lastM && mkDate(y, mo, d) < out[out.length - 1].start) {
          mo += 1; if (mo > 12) { mo = 1; y += 1; }
        }
        if (!validDate(y, mo, d)) continue;
        start = mkDate(y, mo, d); lastY = y; lastM = mo;
      } else if (/^(今日|きょう|本日)$/.test(s)) {
        start = todayStr;
      } else if (/^(明日|あした|あす)$/.test(s)) {
        start = PS.addDays(todayStr, 1);
      } else if (/^(明後日|あさって)$/.test(s)) {
        start = PS.addDays(todayStr, 2);
      } else if (m[9]) {
        start = weekdayDate(todayStr, m[8] || null, 6);
        end = PS.addDays(start, 1);
      } else if (m[11]) {
        start = weekdayDate(todayStr, m[10], WD[m[11]]);
      } else if (/^今月/.test(s)) {
        start = todayStr;
        end = mkDate(t.getFullYear(), t.getMonth() + 1, new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate());
      } else if (/^来月/.test(s)) {
        const y = t.getMonth() === 11 ? t.getFullYear() + 1 : t.getFullYear();
        const mo = (t.getMonth() + 1) % 12 + 1;
        start = mkDate(y, mo, 1);
        end = mkDate(y, mo, new Date(y, mo, 0).getDate());
      } else if (s === '年末年始') {
        const y = t.getMonth() === 0 && t.getDate() <= 5 ? t.getFullYear() - 1 : t.getFullYear();
        start = mkDate(y, 12, 29); end = mkDate(y + 1, 1, 3);
      } else if (m[12]) {
        const mo = +m[12];
        const y = guessYear(mo, 28, todayStr);
        start = mkDate(y, mo, 1); end = mkDate(y, mo, new Date(y, mo, 0).getDate());
        lastY = y; lastM = mo;
      }
      if (!start) continue;
      out.push({ start, end: end || start, idx: m.index, len: s.length });
    }
    return out;
  }

  // 「AからB」「A〜B」をまとめて範囲にする
  function toRanges(text, dates) {
    const ranges = [];
    for (let i = 0; i < dates.length; i++) {
      const a = dates[i];
      const b = dates[i + 1];
      if (b) {
        const between = text.slice(a.idx + a.len, b.idx);
        if (/^\s*(から|〜|より|~|まで)\s*(の)?\s*$/.test(between) || /^\s*(から|〜)/.test(between) && between.length <= 4) {
          let end = b.end;
          if (end < a.start) end = a.start;
          ranges.push({ start: a.start, end });
          i++;
          continue;
        }
      }
      ranges.push({ start: a.start, end: a.end });
    }
    return ranges;
  }

  /* ---------- 中身の読み取り ---------- */
  const SERVICES = [
    { key: 'visit', ja: 'ドロップオフ', en: 'drop-in visits', re: /(ドロップオフ|ドロップイン|訪問|通い|お世話に行|猫シッター|散歩)/ },
    { key: 'stay', ja: 'お泊まり', en: 'overnight stays', re: /(お泊ま?り|泊ま?り|宿泊|ステイ|泊)/ },
    { key: 'boarding', ja: 'お預かり', en: 'boarding', re: /(お?預か?り|預かる|ボーディング|ホテル)/ },
  ];
  const SLOTS = [
    { key: 'morning', ja: '午前', en: 'mornings', re: /(朝|午前)/ },
    { key: 'afternoon', ja: '午後', en: 'afternoons', re: /(昼|日中|午後)/ },
    { key: 'evening', ja: '夕方', en: 'evenings', re: /(夕|夜|晩)/ },
  ];
  const RE = {
    clear: /(解除|取り消|取消|キャンセル|元に戻|もとに戻|撤回|空きに戻|全部空|全部OK|全部大丈夫|普通に戻|リセット)/,
    booked: /(予約|入った|入りました|決まった|決まりました|埋まった|埋まりました|埋まって|いっぱい|満員|満席|フル|空きなし|空いてない|空いていない)/,
    ask: /(相談|応相談|要相談|聞いて|要確認|未定|調整中)/,
    only: /(しか|だけ|のみ|限定|なら)/,
    negative: /(受けられない|受けれない|受け付けない|受けない|無理|ムリ|ダメ|だめ|駄目|不可|NG|ストップ|停止|できない|出来ない|行けない|いけない|やらない|お断り|断る|なし)/,
    off: /(休み|休業|休む|オフ|旅行|帰省|不在|入院|用事|出かけ|いない)/,
    open: /(空いてる|空いている|空き|OK|大丈夫|行ける|受けられる|受けれる|可能)/,
  };
  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const joinEn = (arr) => (arr.length <= 1 ? arr.join('') : arr.slice(0, -1).join(', ') + ' & ' + arr[arr.length - 1]);

  function stripDates(sent) {
    return sent
      .replace(/(?:(\d{4})年)?\d{1,2}月\d{1,2}日?|(?:\d{4}\/)?\d{1,2}\/\d{1,2}|\d{1,2}日|今日|きょう|本日|明日|あした|あす|明後日|あさって|(再来週|来週|今週)?(?:の)?(土日|週末)|(再来週|来週|今週)?(?:の)?[月火水木金土日]曜日?|今月(?:いっぱい|中|末まで)|来月(?:いっぱい|中)|年末年始/g, '')
      .replace(/^[\s、,。]*(から|〜|まで|は|の|も|で)*[\s、,。]*/g, '')
      .replace(/^(から|〜|まで|は|の|も|で|、)+/g, '')
      .trim();
  }

  function interpret(raw) {
    // 「ドロップオフ」の「オフ」を休みと読まないよう、言葉を判定するときはサービス名を伏せる
    const sent = raw.replace(/ドロップオフ|ドロップイン/g, '訪問');
    const svc = SERVICES.filter((x) => x.re.test(sent));
    const slots = SLOTS.filter((x) => x.re.test(sent));
    if (RE.clear.test(sent)) return { type: 'clear' };
    // 「午前は用事があるけど夕方は行ける」のように良い・悪いが混ざる文は、そのままメモに
    if (RE.open.test(sent) && (RE.negative.test(sent) || RE.off.test(sent) || RE.booked.test(sent))) {
      const note = stripDates(raw).replace(/[。、\s]+$/, '');
      if (note) return { type: 'set', status: 'limited', note, noteEn: '', free: true };
    }
    if (RE.ask.test(sent) && !svc.length && !slots.length) return { type: 'set', status: 'limited', note: '要相談', noteEn: 'Please ask' };

    // 「ドロップオフしか」「朝だけ」「ドロップオフなら空いてる」
    if ((svc.length || slots.length) && (RE.only.test(sent) || (RE.open.test(sent) && !RE.negative.test(sent)))) {
      let ja, en;
      if (svc.length && slots.length) {
        ja = `${svc.map((x) => x.ja).join('・')}のみ（${slots.map((x) => x.ja).join('・')}）`;
        en = `${cap(joinEn(svc.map((x) => x.en)))} only (${joinEn(slots.map((x) => x.en))})`;
      } else if (svc.length) {
        ja = `${svc.map((x) => x.ja).join('・')}のみ`;
        en = `${cap(joinEn(svc.map((x) => x.en)))} only`;
      } else {
        ja = `${slots.map((x) => x.ja).join('・')}のみ`;
        en = `${cap(joinEn(slots.map((x) => x.en)))} only`;
      }
      return { type: 'set', status: 'limited', note: ja, noteEn: en };
    }
    // 「お泊まりはNG」「夕方は行けない」
    if ((svc.length || slots.length) && (RE.negative.test(sent) || RE.booked.test(sent) || RE.off.test(sent))) {
      if (svc.length) {
        return { type: 'set', status: 'limited', note: `${svc.map((x) => x.ja).join('・')}不可`, noteEn: `No ${joinEn(svc.map((x) => x.en))}` };
      }
      return { type: 'set', status: 'limited', note: `${slots.map((x) => x.ja).join('・')}は不可`, noteEn: `Not available ${joinEn(slots.map((x) => 'in the ' + x.en.replace(/s$/, '')))}` };
    }
    // 「犬だけなら」など、サービス名以外の条件付き → 文をメモに
    if (RE.only.test(sent)) {
      const note = stripDates(raw).replace(/[。、\s]+$/, '');
      if (note) return { type: 'set', status: 'limited', note, noteEn: '', free: true };
    }
    if (RE.booked.test(sent)) return { type: 'set', status: 'booked', note: '', noteEn: '' };
    if (RE.off.test(sent) || RE.negative.test(sent)) return { type: 'set', status: 'off', note: '', noteEn: '' };
    if (RE.open.test(sent)) return { type: 'clear' };
    if (RE.ask.test(sent)) return { type: 'set', status: 'limited', note: '要相談', noteEn: 'Please ask' };
    // どれにも当てはまらない → 文をそのままメモに
    const note = stripDates(raw).replace(/[。、\s]+$/, '');
    if (note) return { type: 'set', status: 'limited', note, noteEn: '', free: true };
    return null;
  }

  function describe(a) {
    const r = PS.fmtRange(a.start, a.end);
    if (a.type === 'clear') return `${r} を ○ 空き に戻す`;
    const mark = { limited: '△', booked: '×', off: 'Off' }[a.status];
    const label = { limited: '一部OK', booked: '埋まり', off: 'お休み' }[a.status];
    let t = `${r} を ${mark} ${label}`;
    if (a.note) t += `（${a.note}${a.noteEn ? ' → ' + a.noteEn : a.free ? ' → 英訳します' : ''}）`;
    return t;
  }

  function parseSentence(sent, ctx, todayStr) {
    const dates = findDates(sent, todayStr);
    let ranges = toRanges(sent, dates);
    if (!ranges.length && ctx.lastRanges) ranges = ctx.lastRanges;
    if (!ranges.length) return [{ type: 'error', text: `日付が見つかりませんでした：「${sent}」` }];
    ctx.lastRanges = ranges;
    const it = interpret(sent);
    if (!it) return [{ type: 'error', text: `「${sent}」の内容が読み取れませんでした` }];
    return ranges.map((r) => {
      const a = Object.assign({ start: r.start, end: r.end }, it);
      a.text = describe(a);
      return a;
    });
  }

  function parse(_data, input, todayStr) {
    todayStr = todayStr || PS.today();
    const text = normalizeText(input);
    const sentences = text.split(/[。\n！!？?]|それと|それから/).map((s) => s.trim()).filter(Boolean);
    const ctx = {};
    const out = [];
    for (const s of sentences) out.push(...parseSentence(s, ctx, todayStr));
    return out;
  }

  /* ---------- 適用 ---------- */
  function cut(s, e, a, b) {
    if (b < s || a > e) return [[s, e]];
    const res = [];
    if (s < a) res.push([s, PS.addDays(a, -1)]);
    if (e > b) res.push([PS.addDays(b, 1), e]);
    return res;
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  // 期間 [a,b] を既存の予定から取り除く
  function clearRange(data, a, b) {
    const next = [];
    for (const e of data.entries) {
      for (const [s, t] of cut(e.start, e.end || e.start, a, b)) next.push(Object.assign({}, e, { id: uid(), start: s, end: t }));
    }
    data.entries = next;
  }

  function apply(data, actions) {
    for (const a of actions) {
      if (a.type === 'clear') clearRange(data, a.start, a.end);
      else if (a.type === 'set') {
        clearRange(data, a.start, a.end);
        data.entries.push({ id: uid(), start: a.start, end: a.end, status: a.status, note: a.note || '', noteEn: a.noteEn || '' });
      }
    }
    data.entries.sort((x, y) => (x.start < y.start ? -1 : x.start > y.start ? 1 : 0));
    return data;
  }

  global.PSNLP = { parse, apply, clearRange, findDates, toRanges, interpret, normalizeText };
})(typeof window !== 'undefined' ? window : globalThis);
