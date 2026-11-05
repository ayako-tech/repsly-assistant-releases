/* 話し言葉（日本語）から空き状況の設定変更を読み取る。
 * 例：「20日から25日は訪問しか受けられない」「12月1日はお休み」「来週の土日はお泊まりNG」
 *     「10日から12日お預かり予約入った」「15日は朝だけ」「20日から25日の制限は解除」
 * 解析結果は「アクション」の配列。画面で確認してから適用する。 */
(function (global) {
  'use strict';
  const PS = global.PS;

  const DEFAULT_ALIASES = {
    stay: ['お泊まり', 'お泊り', '泊まり', '泊り', '宿泊', 'ステイ', '泊まる', '泊'],
    boarding: ['お預かり', '預かり', '預かる', 'ボーディング', 'ペットホテル', 'ホテル'],
    visit: ['訪問', 'ドロップイン', 'ドロップオフ', '通い', 'お世話に行く', '猫シッター', 'シッティング', '行く'],
  };
  const WD = { 日: 0, 月: 1, 火: 2, 水: 3, 木: 4, 金: 5, 土: 6 };

  function aliasesFor(data, key) {
    const custom = String((data.settings.services[key] || {}).aliases || '')
      .split(/[,、，\s]+/).map((x) => x.trim()).filter(Boolean);
    const label = (data.settings.services[key] || {}).label;
    return [...new Set([...custom, ...(label ? [label] : []), ...DEFAULT_ALIASES[key]])]
      .sort((a, b) => b.length - a.length);
  }

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

  /* ---------- サービス・時間帯 ---------- */
  function findServices(data, text) {
    const found = [];
    let rest = text;
    for (const key of ['stay', 'boarding', 'visit']) {
      for (const a of aliasesFor(data, key)) {
        if (a === '行く' || a === '泊') continue; // 単独では曖昧なので後で判定
        if (rest.includes(a)) {
          found.push(key);
          rest = rest.split(a).join('＿');
          break;
        }
      }
    }
    // 「泊」「行く」は他に何も見つからなかった時だけ使う
    if (!found.includes('stay') && /泊/.test(rest)) found.push('stay');
    if (!found.includes('visit') && /(行ける|行く|伺え|伺う)/.test(rest)) found.push('visit');
    return found;
  }
  function findSlots(data, text) {
    const slots = data.settings.visitSlots;
    const res = [];
    for (const s of slots) {
      const words = [s.label];
      if (s.label === '夕') words.push('夕方', '夜');
      if (s.label === '朝') words.push('午前');
      if (s.label === '昼') words.push('お昼', '日中', '午後');
      if (words.some((w) => w && text.includes(w))) res.push(s.id);
    }
    // 「朝夕」「朝晩」
    if (/朝(夕|晩)/.test(text)) {
      const ids = slots.filter((s) => s.label === '朝' || s.label === '夕').map((s) => s.id);
      ids.forEach((id) => res.includes(id) || res.push(id));
    }
    return res;
  }

  /* ---------- 文の意図 ---------- */
  const RE = {
    clear: /(解除|取り消|取消|キャンセル|元に戻|もとに戻|撤回|なしにして|やっぱり大丈夫|やっぱり受けられる|普通に戻)/,
    booking: /(予約|入った|入りました|決まった|決まりました|埋まった|埋まりました|受けた|受けました|依頼|頼まれ)/,
    only: /(しか|だけ|のみ|限定|以外)/,
    except: /以外/,
    negative: /(受けられない|受けれない|受け付けない|受けない|無理|ムリ|ダメ|だめ|駄目|不可|NG|ng|ストップ|停止|休み|なし|できない|出来ない|行けない|いけない|やらない|やめ|止め|お断り|断る)/,
    closed: /(休み|休業|休む|オフ|旅行|帰省|不在|空いてない|全部ダメ|全部だめ|全部無理|何も受けられない|全部NG|予定がある|予定ある|入院|用事)/,
  };

  function svcLabel(data, k) { return data.settings.services[k].label; }
  function slotLabel(data, id) { return (data.settings.visitSlots.find((s) => s.id === id) || { label: id }).label; }
  function rangeText(r, overnight) {
    if (overnight) {
      const nights = Math.round((PS.parse(r.end) - PS.parse(r.start)) / 86400000);
      return `${PS.fmtDate(r.start)}〜${PS.fmtDate(r.end)}（${nights}泊）`;
    }
    return r.start === r.end ? PS.fmtDate(r.start) : `${PS.fmtDate(r.start)}〜${PS.fmtDate(r.end)}`;
  }

  function parseSentence(data, sent, ctx, todayStr) {
    const dates = findDates(sent, todayStr);
    let ranges = toRanges(sent, dates);
    if (!ranges.length && ctx.lastRanges) ranges = ctx.lastRanges;
    if (!ranges.length) return [{ type: 'error', text: `日付が見つかりませんでした：「${sent}」` }];
    ctx.lastRanges = ranges;

    const services = findServices(data, sent);
    const slots = findSlots(data, sent);
    const enabled = PS.enabledServices(data);
    const actions = [];

    for (const r of ranges) {
      if (RE.clear.test(sent)) {
        actions.push({ type: 'clear', start: r.start, end: r.end, services: services.length ? services : null,
          text: `${rangeText(r)} の${services.length ? services.map((k) => svcLabel(data, k)).join('・') + 'の' : ''}受付制限とお休みを解除` });
        continue;
      }
      if (RE.booking.test(sent) && services.length) {
        for (const k of services) {
          const cm = sent.match(/(\d+)\s*(件|組|枠|軒|家族)/);
          const count = cm ? Math.max(1, +cm[1]) : 1;
          if (k === 'visit') {
            let s = slots.slice();
            if (!s.length) {
              const all = data.settings.visitSlots.map((x) => x.id);
              if (/(2回|二回|朝晩|朝夕)/.test(sent) && all.length >= 2) s = [all[0], all[all.length - 1]];
              else s = all.slice(0, 1);
            }
            actions.push({ type: 'booking', booking: { type: 'visit', start: r.start, end: r.end, slots: s, count, memo: '' },
              text: `予定追加：${svcLabel(data, k)} ${rangeText(r)} ［${s.map((id) => slotLabel(data, id)).join('・')}］${count > 1 ? ' ×' + count : ''}` });
          } else {
            const end = r.end > r.start ? r.end : PS.addDays(r.start, 1);
            actions.push({ type: 'booking', booking: { type: k, start: r.start, end, count, memo: '' },
              text: `予定追加：${svcLabel(data, k)} ${rangeText({ start: r.start, end }, true)}${count > 1 ? ' ×' + count : ''}` });
          }
        }
        continue;
      }
      if (RE.only.test(sent) && (services.length || slots.length)) {
        // サービス名なしで「朝だけ」→ 訪問の時間帯だけを絞る（他のサービスはそのまま）
        const allow = services.length ? services : ['visit'];
        const block = services.length ? enabled.filter((k) => !allow.includes(k)) : [];
        const visitSlots = allow.includes('visit') && slots.length ? slots : null;
        let txt = services.length ? `${rangeText(r)} は ${allow.map((k) => svcLabel(data, k)).join('・')} のみ受付` : `${rangeText(r)} は`;
        if (visitSlots) txt += services.length ? `（訪問は${visitSlots.map((id) => slotLabel(data, id)).join('・')}のみ）` : ` 訪問を${visitSlots.map((id) => slotLabel(data, id)).join('・')}のみ受付`;
        if (!block.length && !visitSlots) {
          actions.push({ type: 'error', text: `「${sent}」：制限する内容がありませんでした` });
          continue;
        }
        actions.push({ type: 'rule', rule: { start: r.start, end: r.end, block, visitSlots }, text: txt });
        continue;
      }
      if (services.length && RE.negative.test(sent)) {
        if (services.length === 1 && services[0] === 'visit' && slots.length) {
          const keep = data.settings.visitSlots.map((s) => s.id).filter((id) => !slots.includes(id));
          actions.push({ type: 'rule', rule: { start: r.start, end: r.end, block: [], visitSlots: keep },
            text: `${rangeText(r)} は 訪問の${slots.map((id) => slotLabel(data, id)).join('・')}を受付なし` });
        } else {
          actions.push({ type: 'rule', rule: { start: r.start, end: r.end, block: services, visitSlots: null },
            text: `${rangeText(r)} は ${services.map((k) => svcLabel(data, k)).join('・')} を受付なし` });
        }
        continue;
      }
      if (!services.length && slots.length && RE.negative.test(sent)) {
        const keep = data.settings.visitSlots.map((s) => s.id).filter((id) => !slots.includes(id));
        actions.push({ type: 'rule', rule: { start: r.start, end: r.end, block: [], visitSlots: keep },
          text: `${rangeText(r)} は 訪問の${slots.map((id) => slotLabel(data, id)).join('・')}を受付なし` });
        continue;
      }
      if (!services.length && (RE.closed.test(sent) || RE.negative.test(sent))) {
        actions.push({ type: 'closed', closed: { start: r.start, end: r.end, note: 'お休み' },
          text: `${rangeText(r)} をお休みにする` });
        continue;
      }
      actions.push({ type: 'error', text: `「${sent}」の意味が読み取れませんでした（例：「20日から25日は訪問しか受けられない」）` });
    }
    return actions;
  }

  function parse(data, input, todayStr) {
    todayStr = todayStr || PS.today();
    const text = normalizeText(input);
    const sentences = text.split(/[。\n！!？?]|それと|それから/).map((s) => s.trim()).filter(Boolean);
    const ctx = {};
    const out = [];
    for (const s of sentences) out.push(...parseSentence(data, s, ctx, todayStr));
    return out;
  }

  /* ---------- 適用 ---------- */
  // [s,e] から [a,b] を取り除いた残り（0〜2個）
  function cut(s, e, a, b) {
    if (b < s || a > e) return [[s, e]];
    const res = [];
    if (s < a) res.push([s, PS.addDays(a, -1)]);
    if (e > b) res.push([PS.addDays(b, 1), e]);
    return res;
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function apply(data, actions) {
    for (const a of actions) {
      if (a.type === 'rule') {
        data.rules.push(Object.assign({ id: uid() }, a.rule));
      } else if (a.type === 'closed') {
        data.closed.push(Object.assign({ id: uid() }, a.closed));
      } else if (a.type === 'booking') {
        data.bookings.push(Object.assign({ id: uid() }, a.booking));
      } else if (a.type === 'clear') {
        const nextRules = [];
        for (const r of data.rules) {
          const hits = !a.services || (r.block || []).some((k) => a.services.includes(k)) || (a.services.includes('visit') && r.visitSlots);
          if (!hits) { nextRules.push(r); continue; }
          for (const [s, e] of cut(r.start, r.end || r.start, a.start, a.end)) nextRules.push(Object.assign({}, r, { id: uid(), start: s, end: e }));
        }
        data.rules = nextRules;
        if (!a.services) {
          const nextClosed = [];
          for (const c of data.closed) {
            for (const [s, e] of cut(c.start, c.end || c.start, a.start, a.end)) nextClosed.push(Object.assign({}, c, { id: uid(), start: s, end: e }));
          }
          data.closed = nextClosed;
        }
      }
    }
    return data;
  }

  global.PSNLP = { parse, apply, findDates, toRanges, findServices, findSlots, normalizeText, DEFAULT_ALIASES };
})(typeof window !== 'undefined' ? window : globalThis);
