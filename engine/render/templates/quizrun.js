// reel-quizrun: "How many of these 10 do you know?" in the look of the quiz platform (BijbelQuiz /
// Bible Quizzes: warm paper ground, white cards with a bottom edge, lapis + gold, Fredoka + Nunito).
// Real questions from the platform (engine/quizrun/), a timer per question, the answer list filling up,
// cheers in between (follow / like), a score call and an end card. Silent: music + sound effects.
// Loaded by stage.html; registers T['reel-quizrun']. render(t) is a pure function of t.

(() => {
  // Brand palette (bijbelquiz src/app/globals.css); project.json theme can override any of them.
  const P = () => ({
    canvas: '#ECEAE4', card: '#FFFFFF', line: '#DEDBD3', lineSoft: '#EEECE7', chip: '#F1EFEA', track: '#D9D6CE',
    ink: '#1B1A18', inkBody: '#3E3C37', inkMuted: '#6B6860', inkFaint: '#8A877F',
    lapis: '#35548C', lapisEdge: '#263E69', lapisTint: '#EAEEF7',
    gold: '#E9B12E', goldEdge: '#B9881C', goldTint: '#FBF1D6', goldText: '#8A6410',
    coral: '#D9734F', coralStrong: '#B4502B', coralTint: '#F8ECE6',
    green: '#3F6B4F', greenEdge: '#2C4D38', greenTint: '#E9F0EA',
    ...(ctx.theme?.quiz || {}),
  });
  const DISPLAY = '"Fredoka", "Nunito", system-ui, sans-serif';
  const BODY = '"Nunito", "Fredoka", system-ui, sans-serif';

  // The BijbelQuiz mark (src/components/bq/icons.tsx LogoMark): a speech-bubble book with a question mark.
  const MARK = `<svg viewBox="0 0 100 100" width="100%" height="100%" fill="none"><path d="M12 24Q31 13 50 23Q69 13 88 24L88 71Q69 63 50 73Q42 69 36 69L24 86L25 69.5Q18 70 12 72Z" fill="#263E69" stroke="#263E69" stroke-width="8" stroke-linejoin="round" transform="translate(0 5)"/><path d="M12 24Q31 13 50 23Q69 13 88 24L88 71Q69 63 50 73Q42 69 36 69L24 86L25 69.5Q18 70 12 72Z" fill="#35548C" stroke="#35548C" stroke-width="8" stroke-linejoin="round"/><path d="M18 30Q32 22 46 30L46 64Q32 59 18 63Z" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="3" stroke-linejoin="round"/><path d="M54 30Q68 22 82 30L82 63Q68 59 54 64Z" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="3" stroke-linejoin="round"/><path d="M24 40Q32 36 40 40M24 50Q32 46 40 50" stroke="#35548C" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M61.5 39Q61.5 31.5 68 31.5Q74.5 31.5 74.5 37.5Q74.5 41.5 70.5 43.5Q68 44.8 68 48" stroke="#35548C" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="68" cy="56" r="4.4" fill="#E9B12E"/></svg>`;
  const CHECK = c => `<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="${c}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const ICONS = {
    follow: c => `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round"><circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6.5 7-6.5s7 2.5 7 6.5M19 8v6M16 11h6"/></svg>`,
    like: c => `<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.6 4.5c2.2 0 3.6 1.2 5.4 3.2 1.8-2 3.2-3.2 5.4-3.2 3.6 0 5.7 3.8 4.2 7.2C19.5 16.4 12 21 12 21z" fill="${c}"/></svg>`,
    comment: c => `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="${c}" stroke-width="2.4" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/></svg>`,
  };

  const LEVEL_C = c => ({ easy: [c.green, c.greenTint], medium: [c.goldText, c.goldTint], hard: [c.coralStrong, c.coralTint], expert: [c.lapis, c.lapisTint] });

  /** Timeline: when every question, cheer and card starts. Shared with the sound effects. */
  function plan(spec) {
    const IN = .5, REVEAL = 1.5, CHEER = 2.5, SCORE = 2.8, END_ = 3.4;
    const timer = spec.timer || 6;
    const seq = []; let t = .15;
    spec.questions.forEach((q, i) => {
      const s = { type: 'q', i, a: t, think: t + IN, reveal: t + IN + timer, b: t + IN + timer + REVEAL };
      seq.push(s); t = s.b;
      const cheer = spec.ui.cheers.find(c => c.after === i + 1);
      if (cheer && i < spec.questions.length - 1) { seq.push({ type: 'cheer', c: cheer, a: t, b: t + CHEER }); t += CHEER; }
    });
    const score = { type: 'score', a: t, b: t + SCORE }; seq.push(score); t += SCORE;
    const end = { type: 'end', a: t, b: t + END_ }; seq.push(end); t += END_;
    return { seq, duration: t, timer, IN, REVEAL };
  }

  T['reel-quizrun'] = spec => {
    const W = 1080, H = 1920, X = 90, CW = 900; const c = P(); const LC = LEVEL_C(c);
    const { seq, duration, timer } = plan(spec);
    const Q = seq.filter(s => s.type === 'q');
    const n = spec.questions.length;
    stage.style.background = c.canvas;
    stage.style.fontFamily = BODY;
    // a very soft dot grid on the paper

    // ---- title (top): "HOE GOED KEN JIJ" / "DE BIJBEL?"
    const title = el('div', 'abs'); css(title, { left: 0, width: W + 'px', top: '196px', textAlign: 'center', fontFamily: DISPLAY, fontWeight: 700, lineHeight: 1, textTransform: 'uppercase' });
    el('div', '', title, esc(spec.title.pre)).style.cssText = `font-size:${fit(spec.title.pre, [[16, 64], [22, 56], [999, 48]], 900)}px;color:${c.ink};letter-spacing:1px`;
    el('div', '', title, esc(spec.title.hi)).style.cssText = `margin-top:10px;font-size:${fit(spec.title.hi, [[12, 104], [16, 88], [22, 72], [999, 60]], 900)}px;color:${c.lapis};letter-spacing:1px`;

    // ---- meta row: level chip, brand, counter
    const meta = el('div', 'abs'); css(meta, { left: X + 'px', width: CW + 'px', top: '436px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' });
    const chip = el('div', '', meta); chip.style.cssText = `font-family:${BODY};font-weight:900;font-size:26px;letter-spacing:2.5px;padding:10px 20px;border-radius:999px;text-transform:uppercase;min-width:120px;text-align:center`;
    const brand = el('div', '', meta); brand.style.cssText = `display:flex;align-items:center;gap:10px;font-family:${DISPLAY};font-weight:600;font-size:34px;color:${c.ink}`;
    el('div', '', brand, MARK).style.cssText = 'width:46px;height:46px';
    const wm = ctx.wordmark || ['Bijbel', 'Quiz'];
    el('div', '', brand, `${esc(wm[0])}<span style="color:${c.lapis}">${esc(wm[1])}</span>`);
    const counter = el('div', '', meta); counter.style.cssText = `font-family:${DISPLAY};font-weight:600;font-size:36px;color:${c.inkMuted};min-width:120px;text-align:right`;

    // ---- question cards + answers, one set per question (only the current one shows)
    const CARD_Y = 516, CARD_H = 300, ANS_Y = 846, ANS_H = 128, GAP = 24;
    const sets = spec.questions.map((q, i) => {
      const box = el('div', 'abs'); css(box, { left: 0, top: 0, width: W + 'px', height: '1100px', opacity: 0 });
      const card = el('div', 'abs', box); css(card, { left: X + 'px', top: CARD_Y + 'px', width: CW + 'px', height: CARD_H + 'px', boxSizing: 'border-box', background: c.card, borderRadius: '32px',
        border: `3px solid ${c.line}`, boxShadow: `0 8px 0 ${c.line}`, padding: '34px 44px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start' });
      if (q.ref) el('div', '', card, esc(q.ref)).style.cssText = `font-weight:900;font-size:24px;letter-spacing:2.5px;color:${c.lapis};background:${c.lapisTint};padding:8px 18px;border-radius:999px;margin-bottom:22px;text-transform:uppercase`;
      const qt = el('div', '', card, esc(q.text)); qt.style.cssText = `font-family:${DISPLAY};font-weight:600;font-size:${fit(q.text, [[40, 60], [70, 52], [100, 46], [999, 40]], 810)}px;line-height:1.16;color:${c.ink};text-wrap:balance`;
      const badge = el('div', 'abs', card, CHECK('#fff')); css(badge, { right: '-22px', top: '-22px', width: '74px', height: '74px', borderRadius: '50%', background: c.green, padding: '14px', boxSizing: 'border-box', boxShadow: `0 5px 0 ${c.greenEdge}`, opacity: 0 });
      const cols = q.answers.length === 3 ? 1 : 2;
      const aw = cols === 2 ? (CW - GAP) / 2 : CW, ah = q.answers.length === 3 ? 96 : ANS_H;
      const answers = q.answers.map((a, k) => {
        const b = el('div', 'abs', box); const col = cols === 2 ? k % 2 : 0, row = cols === 2 ? Math.floor(k / 2) : k;
        css(b, { left: X + col * (aw + GAP) + 'px', top: ANS_Y + row * (ah + GAP) + 'px', width: aw + 'px', height: ah + 'px', boxSizing: 'border-box', background: c.card, borderRadius: '24px',
          border: `3px solid ${c.line}`, boxShadow: `0 6px 0 ${c.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 26px' });
        const txt = el('div', '', b, esc(a)); txt.style.cssText = `font-weight:800;font-size:${fit(a, [[14, 40], [22, 36], [32, 31], [999, 28]], aw - 60)}px;line-height:1.14;color:${c.ink};text-wrap:balance`;
        return { b, txt, right: k === q.correct };
      });
      return { box, card, badge, answers };
    });

    // ---- timer: a gold bar that shrinks from both sides, the seconds in a ring in the middle
    const TIMER_Y = 1132;
    const tbar = el('div', 'abs'); css(tbar, { left: X + 'px', width: CW + 'px', top: TIMER_Y + 'px', height: '96px' });
    const track = el('div', 'abs', tbar); css(track, { left: 0, width: '100%', top: '42px', height: '12px', borderRadius: '6px', background: c.track });
    const fill = el('div', 'abs', tbar); css(fill, { left: 0, width: '100%', top: '42px', height: '12px', borderRadius: '6px', background: c.gold });
    const ring = el('div', 'abs', tbar); css(ring, { left: (CW / 2 - 48) + 'px', top: 0, width: '96px', height: '96px', borderRadius: '50%', background: c.card, border: `6px solid ${c.gold}`, boxSizing: 'border-box',
      display: 'grid', placeItems: 'center', fontFamily: DISPLAY, fontWeight: 700, fontSize: '50px', color: c.ink, boxShadow: `0 5px 0 ${c.line}` });
    const doneMark = el('div', 'abs', tbar, CHECK('#fff')); css(doneMark, { left: (CW / 2 - 48) + 'px', top: 0, width: '96px', height: '96px', borderRadius: '50%', background: c.green, padding: '20px', boxSizing: 'border-box', boxShadow: `0 5px 0 ${c.greenEdge}`, opacity: 0 });

    // ---- answer list 1..10 with the level written at the first row of each level
    const LIST_Y = 1262, ROW = 44;
    const list = el('div', 'abs'); css(list, { left: X + 'px', width: CW + 'px', top: LIST_Y + 'px' });
    const rows = spec.questions.map((q, i) => {
      const r = el('div', 'abs', list); css(r, { left: 0, top: i * ROW + 'px', width: CW + 'px', height: (ROW - 4) + 'px', boxSizing: 'border-box', borderRadius: '12px', border: '3px solid transparent',
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: '14px', fontWeight: 800, fontSize: '30px' });
      const [col] = LC[q.level];
      el('div', '', r, `${i + 1}.`).style.cssText = `width:46px;color:${col};font-weight:900`;
      const txt = el('div', '', r, ''); txt.style.cssText = `flex:1;color:${c.ink};white-space:nowrap;overflow:hidden;text-overflow:ellipsis`;
      return { r, txt, q };
    });

    // ---- cheer cards (after question 3, 6, ...): follow / like, with a tapping hand
    const cheers = seq.filter(s => s.type === 'cheer').map(s => {
      const box = el('div', 'abs'); css(box, { left: X + 'px', width: CW + 'px', top: CARD_Y + 'px', height: '540px', boxSizing: 'border-box', background: c.card, borderRadius: '36px',
        border: `4px solid ${c.gold}`, boxShadow: `0 10px 0 ${c.goldEdge}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', opacity: 0, padding: '0 50px' });
      el('div', '', box, esc(s.c.title)).style.cssText = `font-family:${DISPLAY};font-weight:700;font-size:${fit(s.c.title, [[18, 76], [26, 64], [999, 54]], 800)}px;line-height:1.05;color:${c.ink};text-transform:uppercase`;
      el('div', '', box, esc(s.c.sub)).style.cssText = `margin-top:18px;font-weight:900;font-size:38px;line-height:1.2;color:${c.goldText};text-transform:uppercase;letter-spacing:.5px`;
      const btn = el('div', '', box); btn.style.cssText = `position:relative;margin-top:50px;display:flex;align-items:center;gap:18px;padding:22px 46px;border-radius:999px;background:${c.lapis};box-shadow:0 7px 0 ${c.lapisEdge};color:#fff;font-family:${DISPLAY};font-weight:700;font-size:44px`;
      const ic = el('div', '', btn, ICONS[s.c.icon]('#fff')); ic.style.cssText = 'width:48px;height:48px';
      const label = el('div', '', btn, esc(s.c.button));
      const tick = el('div', '', btn, CHECK('#fff')); tick.style.cssText = 'width:0;height:44px;overflow:hidden;transition:none';
      return { s, box, btn, tick };
    });

    // ---- score call (after the last question)
    const sc = seq.find(s => s.type === 'score');
    const score = el('div', 'abs'); css(score, { left: X + 'px', width: CW + 'px', top: CARD_Y + 'px', height: '540px', boxSizing: 'border-box', background: c.lapis, borderRadius: '36px', boxShadow: `0 10px 0 ${c.lapisEdge}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 60px', color: '#fff', opacity: 0 });
    const sIcon = el('div', '', score, ICONS.comment('#fff')); sIcon.style.cssText = 'width:96px;height:96px';
    el('div', '', score, esc(spec.ui.score.title)).style.cssText = `margin-top:26px;font-family:${DISPLAY};font-weight:700;font-size:${fit(spec.ui.score.title, [[18, 80], [26, 66], [999, 56]], 780)}px;line-height:1.05`;
    el('div', '', score, esc(spec.ui.score.sub)).style.cssText = `margin-top:22px;font-weight:800;font-size:40px;line-height:1.25;color:${c.goldTint}`;
    const big = el('div', '', score, `?/${n}`); big.style.cssText = `margin-top:30px;font-family:${DISPLAY};font-weight:700;font-size:120px;color:${c.gold};line-height:1`;

    // ---- end card: paper ground, mark + wordmark, headline, one button, store badges, website
    const ec = seq.find(s => s.type === 'end'); const E = spec.ui.end;
    const end = el('div', 'abs full'); end.style.background = c.canvas;
    const inner = el('div', 'abs', end); css(inner, { left: '90px', width: '900px', top: '430px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' });
    const parts = [];
    const m = el('div', '', inner, MARK); m.style.cssText = 'width:230px;height:230px'; parts.push(m);
    const w = el('div', '', inner, `${esc(wm[0])}<span style="color:${c.lapis}">${esc(wm[1])}</span>`); w.style.cssText = `margin-top:20px;font-family:${DISPLAY};font-weight:600;font-size:92px;color:${c.ink};letter-spacing:-1px`; parts.push(w);
    const hl = el('div', '', inner, esc(E.headline)); hl.style.cssText = `margin-top:40px;font-family:${DISPLAY};font-weight:600;font-size:${fit(E.headline, [[30, 60], [45, 52], [999, 46]], 860)}px;line-height:1.12;color:${c.inkBody};text-wrap:balance`; parts.push(hl);
    const cta = el('div', '', inner, esc(E.button)); cta.style.cssText = `margin-top:56px;background:${c.lapis};color:#fff;border-radius:26px;padding:34px 90px;font-family:${DISPLAY};font-weight:700;font-size:54px;box-shadow:0 9px 0 ${c.lapisEdge}`; parts.push(cta);
    if (E.stores && ctx.badges.length) { const bd = el('div', '', inner); bd.style.cssText = 'margin-top:56px;display:flex;gap:24px;align-items:center'; ctx.badges.forEach(b => img(b, '', bd).style.height = '92px'); parts.push(bd); }
    const web = el('div', '', inner, esc(E.web)); web.style.cssText = `margin-top:34px;font-weight:800;font-size:38px;color:${c.lapis}`; parts.push(web);

    const pop = (t, a, d = .35) => out(prog(t, a, a + d));
    const back = x => { const s = 1.7; return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2); };   // overshoot

    return { width: W, height: H, duration, sfx: T['reel-quizrun'].sfx(spec), render(t) {
      // title + meta row in at the start; they stay (the end card covers them)
      const k0 = pop(t, 0, .45); set(title, k0, 0);
      set(meta, pop(t, .1, .4), 0);
      // which question is current (the last one that has started)
      let cur = -1; Q.forEach((s, i) => { if (t >= s.a) cur = i; });
      const curS = Q[Math.max(0, cur)]; const q = spec.questions[Math.max(0, cur)];
      const [lc, lt] = LC[q.level];
      chip.textContent = spec.ui.levels[q.level] || q.level; chip.style.color = lc; chip.style.background = lt;
      counter.textContent = `${Math.max(1, cur + 1)} / ${n}`;
      const inCheer = cheers.find(ch => t >= ch.s.a && t < ch.s.b);
      const inScore = t >= sc.a;
      sets.forEach((st, i) => {
        const s = Q[i];
        const vis = i === cur && !inCheer && !inScore;
        if (!vis) { st.box.style.opacity = 0; return; }
        const kin = pop(t, s.a, .4); st.box.style.opacity = 1;
        set(st.card, kin, (1 - kin) * 24);
        const r = prog(t, s.reveal, s.reveal + .3);
        st.card.style.borderColor = r > 0 ? c.green : c.line; st.card.style.boxShadow = `0 8px 0 ${r > 0 ? c.greenEdge : c.line}`;
        set(st.badge, out(r), 0);
        st.answers.forEach((a, k) => {
          const ka = pop(t, s.a + .1, .4);
          if (a.right && r > 0) {
            a.b.style.background = c.green; a.b.style.borderColor = c.greenEdge; a.b.style.boxShadow = `0 6px 0 ${c.greenEdge}`; a.txt.style.color = '#fff';
            set(a.b, 1, 0);
          } else {
            a.b.style.background = c.card; a.b.style.borderColor = c.line; a.b.style.boxShadow = `0 6px 0 ${c.line}`; a.txt.style.color = c.ink;
            set(a.b, ka * (1 - .6 * out(r)), (1 - ka) * 16);
          }
        });
      });
      // timer
      const timerVis = cur >= 0 && !inCheer && !inScore;
      tbar.style.opacity = timerVis ? pop(t, curS.a, .3) : 0;
      if (timerVis) {
        const p = prog(t, curS.think, curS.reveal);
        fill.style.left = (CW / 2) * p + 'px'; fill.style.width = CW * (1 - p) + 'px';
        const left = Math.max(1, Math.ceil(timer * (1 - p) - 1e-6));
        const last = left <= 1 && p < 1;
        fill.style.background = last ? c.coral : c.gold; ring.style.borderColor = last ? c.coral : c.gold;
        ring.textContent = String(Math.min(Math.ceil(timer), left));
        const done = out(prog(t, curS.reveal, curS.reveal + .25));
        set(ring, 1 - done, 0); set(doneMark, done, 0);
      }
      // list: rows fill as answers are revealed; the current row is marked
      set(list, pop(t, .2, .4), 0);
      rows.forEach((row, i) => {
        const s = Q[i]; const shown = t >= s.reveal; const now = i === cur && !shown && !inScore;
        row.txt.textContent = shown ? row.q.label : now ? '?' : '';
        if (now) { row.r.style.borderColor = c.gold; row.r.style.background = c.goldTint; row.txt.style.color = c.goldText; }
        else { row.r.style.borderColor = 'transparent'; row.r.style.background = 'transparent'; row.txt.style.color = c.ink; }
      });
      // cheers
      cheers.forEach(ch => {
        const { a, b } = ch.s; if (t < a - .05 || t >= b) { ch.box.style.opacity = 0; return; }
        const kin = pop(t, a, .4), kout = prog(t, b - .25, b);
        set(ch.box, kin * (1 - kout), (1 - kin) * 24);
        // the button turns "done" once, calmly
        const tapped = t >= a + 1.2;
        ch.btn.style.background = tapped ? c.green : c.lapis; ch.btn.style.boxShadow = `0 7px 0 ${tapped ? c.greenEdge : c.lapisEdge}`;
        ch.tick.style.width = tapped ? '44px' : '0px';
      });
      // score card
      const ks = pop(t, sc.a, .45); set(score, t >= sc.a - .05 ? ks : 0, (1 - ks) * 24);
      // end card slides up over everything
      const ke = inout(prog(t, ec.a, ec.a + .4)); end.style.transform = `translateY(${(1 - ke) * H}px)`;
      parts.forEach((p, i) => { const a = ec.a + .25 + i * .08; const q2 = out(prog(t, a, a + .35)); set(p, q2, (1 - q2) * 20); });
    } };
  };

  /** Sound effects on the reel clock (render.mjs mixes them over the music): assets/sfx/<name>.wav */
  T['reel-quizrun'].sfx = spec => {
    const { seq, timer } = plan(spec); const fx = [];
    for (const s of seq) {
      if (s.type === 'q') {
        const secs = Math.ceil(timer);
        for (let k = 0; k < secs; k++) { const at = s.think + k * (timer / secs); fx.push({ t: at, name: k === secs - 1 ? 'tick-last' : 'tick', gain: k === secs - 1 ? .55 : .35 }); }
        fx.push({ t: s.reveal, name: 'correct', gain: .7 });
      } else if (s.type === 'cheer') { fx.push({ t: s.a + 1.2, name: 'pop', gain: .5 }); }
      else if (s.type === 'score') fx.push({ t: s.a, name: 'finish', gain: .8 });
    }
    return fx;
  };
})();
