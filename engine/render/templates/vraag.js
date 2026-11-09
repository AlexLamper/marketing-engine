/* reel-vraag: an honest question, answered with one image (Alex, 9 Nov: "copy these style videos", the
   whywouldgod-style explainers he saved). Cream ground, flat line drawings that draw themselves, one
   sentence at a time with one word in colour, a verse card, and a question back to the viewer.
   Units: the question, every scene's say, the ask. Spec: engine/spec.mjs ReelVraag. */
(() => {
  const C = { ink: '#2B2824', gold: '#E2A43A', goldSoft: '#F4DCA6', terra: '#C4523A', cream: '#F7F0E3', paper: '#FFFDF8', wood: '#B98A5B', sky: '#8FA6BC', leaf: '#86A66F', stone: '#D9CFC0', dark: '#3A3632' };
  const W = 1080, H = 1920, GROUND = 1170, TEXT_Y = 1255;
  const X = { links: 290, midden: 540, rechts: 790, boven: 540 };
  const SKY = new Set(['zon', 'wolk', 'regen', 'ster', 'vraagteken', 'klok']);

  // Every stroke draws itself (pathLength 1 + dash offset), fills fade in after. Origin: bottom centre.
  const L = (d, extra = '') => `<path class="d" pathLength="1" d="${d}" ${extra}/>`;
  const F = (d, fill, extra = '') => `<path class="d f" pathLength="1" d="${d}" fill="${fill}" ${extra}/>`;
  const circ = (cx, cy, r, fill = 'none') => `<circle class="d${fill !== 'none' ? ' f' : ''}" pathLength="1" cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
  const rect = (x, y, w, h, fill = 'none', rx = 6) => `<rect class="d${fill !== 'none' ? ' f' : ''}" pathLength="1" x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/>`;
  const heart = (s, fill) => F(`M0,${-20 * s} C${-10 * s},${-48 * s} ${-58 * s},${-46 * s} ${-58 * s},${-14 * s} C${-58 * s},${14 * s} ${-18 * s},${34 * s} 0,${56 * s} C${18 * s},${34 * s} ${58 * s},${14 * s} ${58 * s},${-14 * s} C${58 * s},${-46 * s} ${10 * s},${-48 * s} 0,${-20 * s} Z`, fill);

  function person(pose = 'staan', robe = C.paper) {
    const body = 'M-44,0 L-44,-118 Q-44,-172 0,-172 Q44,-172 44,-118 L44,0 Z';
    switch (pose) {
      case 'knielen': return `<g transform="translate(0,0)">${F('M-46,0 L-46,-80 Q-46,-128 0,-128 Q40,-128 40,-80 L40,-34 L78,-34 Q86,-34 86,-20 L86,0 Z', robe)}${circ(-2, -158, 30, robe)}${L('M28,-96 L74,-118')}</g>`;
      case 'verdrietig': return `<g transform="rotate(6)">${F(body, robe)}${circ(14, -196, 30, robe)}</g>`;
      case 'lopen': return `${F('M-42,-36 L-42,-122 Q-42,-172 0,-172 Q42,-172 42,-122 L42,-36 Z', robe)}${circ(0, -206, 30, robe)}${L('M-16,-36 L-30,0')}${L('M16,-36 L34,0')}`;
      case 'wijzen': return `${F(body, robe)}${circ(0, -206, 30, robe)}${L('M30,-130 L104,-162')}`;
      case 'armen-open': return `${F(body, robe)}${circ(0, -206, 30, robe)}${L('M-34,-134 L-100,-184')}${L('M34,-134 L100,-184')}`;
      case 'omhoog': return `${F(body, robe)}${circ(0, -206, 30, robe)}${L('M-26,-150 L-58,-246')}${L('M26,-150 L58,-246')}`;
      default: return `${F(body, robe)}${circ(0, -206, 30, robe)}`;
    }
  }

  const PROPS = {
    persoon: d => person(d.pose),
    kind: d => `<g transform="scale(.64)">${person(d.pose)}</g>`,
    rechter: () => `${F('M-56,0 L-56,-124 Q-56,-178 0,-178 Q56,-178 56,-124 L56,0 Z', C.dark)}${F('M-18,-176 L0,-140 L18,-176 Z', C.paper)}${circ(0, -212, 31, C.paper)}${F('M-34,-226 Q-36,-252 0,-254 Q36,-252 34,-226 Q30,-206 34,-188 L22,-190 Q24,-212 0,-216 Q-24,-212 -22,-190 L-34,-188 Q-30,-206 -34,-226 Z', C.stone)}`,
    hart: () => heart(1.25, C.gold),
    'gebroken-hart': () => `${heart(1.25, C.gold)}${L('M0,-22 L-12,4 L10,22 L-6,48 L0,70', `stroke="${C.terra}" stroke-width="7"`)}`,
    zon: () => `${circ(0, -60, 54, C.gold)}${Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6, r1 = 74, r2 = 104; return L(`M${(Math.cos(a) * r1).toFixed(1)},${(-60 + Math.sin(a) * r1).toFixed(1)} L${(Math.cos(a) * r2).toFixed(1)},${(-60 + Math.sin(a) * r2).toFixed(1)}`); }).join('')}`,
    wolk: () => F('M-96,-30 Q-104,-72 -62,-78 Q-56,-122 -10,-118 Q24,-150 58,-112 Q100,-110 98,-72 Q120,-56 104,-30 Z', '#EEE7DA'),
    regen: () => `${F('M-96,-90 Q-104,-132 -62,-138 Q-56,-182 -10,-178 Q24,-210 58,-172 Q100,-170 98,-132 Q120,-116 104,-90 Z', '#E2DCD2')}${[-60, -24, 12, 48, 84].map(x => L(`M${x},-70 L${x - 16},-20`, `stroke="${C.sky}"`)).join('')}`,
    weegschaal: () => `${L('M0,0 L0,-230')}${L('M-46,0 L46,0')}${L('M-110,-210 L110,-210')}${L('M-110,-210 L-140,-130 M-110,-210 L-80,-130')}${L('M110,-210 L80,-130 M110,-210 L140,-130')}${F('M-150,-130 Q-110,-92 -70,-130 Z', C.gold)}${F('M70,-130 Q110,-92 150,-130 Z', C.gold)}${circ(0, -236, 10, C.gold)}`,
    hamer: () => `${rect(-70, -26, 140, 26, C.wood)}<g transform="rotate(-28,0,-60)">${rect(-20, -150, 40, 70, C.wood)}${L('M0,-80 L0,10', 'stroke-width="12"')}</g>`,
    vonnis: () => `${rect(-70, -190, 140, 190, C.paper, 4)}${[-150, -126, -102, -78].map(y => L(`M-46,${y} L46,${y}`, 'stroke-width="3"')).join('')}<text x="0" y="-30" text-anchor="middle" font-family="Inter" font-weight="700" font-size="22" letter-spacing="3" fill="${C.terra}" class="t">VONNIS</text>${rect(-56, -54, 112, 34, 'none', 4).replace('class="d"', `class="d" stroke="${C.terra}"`)}`,
    kruis: () => `${F('M-14,0 L-14,-150 L-70,-150 L-70,-176 L-14,-176 L-14,-250 L14,-250 L14,-176 L70,-176 L70,-150 L14,-150 L14,0 Z', C.wood)}${L('M-90,0 Q0,-30 90,0')}`,
    graf: () => `${F('M-130,0 Q-130,-170 0,-176 Q130,-170 130,0 Z', C.stone)}${F('M-40,0 L-40,-70 Q0,-104 40,-70 L40,0 Z', C.dark)}${circ(132, -56, 56, '#CFC3B0')}`,
    bijbel: () => `${F('M0,-30 Q-60,-58 -120,-40 L-120,-160 Q-60,-178 0,-150 Z', C.paper)}${F('M0,-30 Q60,-58 120,-40 L120,-160 Q60,-178 0,-150 Z', C.paper)}${L('M0,-150 L0,-30')}${[-128, -108, -88].map(y => L(`M-96,${y + 10} Q-60,${y} -22,${y + 12}`, 'stroke-width="3"') + L(`M22,${y + 12} Q60,${y} 96,${y + 10}`, 'stroke-width="3"')).join('')}`,
    lamp: () => `${F('M-80,-20 Q-80,-70 0,-70 Q60,-70 92,-48 L120,-62 L104,-34 Q70,-14 0,-14 Q-60,-14 -80,-20 Z', C.wood)}${F('M112,-70 Q100,-100 118,-126 Q138,-96 124,-70 Z', C.gold)}${circ(118, -96, 46, 'none').replace('class="d"', `class="glow" fill="${C.goldSoft}" opacity=".5" stroke="none"`)}`,
    ster: () => F('M0,-170 Q10,-104 64,-90 Q10,-76 0,-10 Q-10,-76 -64,-90 Q-10,-104 0,-170 Z', C.gold),
    telescoop: () => `${L('M0,-110 L-50,0 M0,-110 L50,0 M0,-110 L0,0')}<g transform="rotate(-30,0,-110)">${rect(-90, -136, 190, 46, C.paper, 10)}${rect(96, -142, 30, 58, C.gold, 6)}</g>`,
    huis: () => `${F('M-110,0 L-110,-130 L0,-220 L110,-130 L110,0 Z', C.paper)}${rect(-30, -90, 60, 90, C.wood, 4)}${rect(48, -116, 38, 38, C.goldSoft, 3)}`,
    deur: () => `${F('M-80,0 L-80,-240 Q0,-300 80,-240 L80,0 Z', C.goldSoft)}${F('M-80,0 L-80,-240 Q-40,-270 -10,-266 L-10,0 Z', C.wood)}${L('M-80,0 L-80,-240 Q0,-300 80,-240 L80,0')}`,
    boom: () => `${F('M-14,0 L-14,-120 L14,-120 L14,0 Z', C.wood)}${circ(0, -190, 86, C.leaf)}`,
    berg: () => `${F('M-200,0 L-60,-220 L20,-110 L80,-170 L200,0 Z', '#DCD3C3')}${F('M-60,-220 L-34,-178 L-60,-168 L-84,-182 Z', C.paper)}`,
    weg: () => [-170, -100, -30, 40, 110].map(x => L(`M${x},-12 L${x + 44},-12`, `stroke="${C.gold}" stroke-width="8"`)).join(''),
    ketting: () => `${rect(-150, -110, 110, 56, 'none', 28)}${rect(-60, -110, 100, 56, 'none', 28)}<g transform="rotate(18,110,-82)">${rect(64, -110, 110, 56, 'none', 28)}</g>${L('M36,-110 L48,-124 M42,-54 L56,-44', `stroke="${C.terra}"`)}`,
    schaap: () => `${F('M-80,-40 Q-100,-80 -70,-110 Q-60,-150 -10,-140 Q30,-160 60,-126 Q100,-120 90,-80 Q104,-48 70,-36 Q20,-24 -20,-34 Q-60,-20 -80,-40 Z', C.paper)}${F('M70,-120 Q110,-130 118,-96 Q118,-70 90,-70 Z', C.dark)}${L('M-40,-34 L-40,0 M30,-34 L30,0')}`,
    brood: () => `${F('M-110,0 Q-120,-90 0,-96 Q120,-90 110,0 Z', '#D9A867')}${L('M-50,-70 L-30,-30 M0,-80 L20,-40 M50,-70 L70,-30', 'stroke-width="4"')}`,
    beker: () => `${F('M-50,-170 L50,-170 Q46,-100 0,-90 Q-46,-100 -50,-170 Z', C.gold)}${L('M0,-90 L0,-24')}${F('M-46,0 Q0,-30 46,0 Z', C.gold)}`,
    sleutel: () => `${circ(-90, -80, 44, C.gold)}${circ(-90, -80, 16, C.cream)}${L('M-46,-80 L120,-80', 'stroke-width="10"')}${L('M90,-80 L90,-50 M120,-80 L120,-44', 'stroke-width="10"')}`,
    vraagteken: () => `<text class="t" x="0" y="-20" text-anchor="middle" font-family="Lora" font-weight="700" font-size="240" fill="${C.terra}">?</text>`,
    geschenk: () => `${rect(-90, -130, 180, 130, C.terra, 6)}${rect(-100, -160, 200, 36, C.terra, 6)}${L('M0,-160 L0,0', `stroke="${C.gold}" stroke-width="16"`)}${F('M0,-160 Q-50,-210 -60,-170 Q-50,-150 0,-160 Q50,-150 60,-170 Q50,-210 0,-160 Z', C.gold)}`,
    klok: () => `${circ(0, -110, 92, C.paper)}${L('M0,-110 L0,-170')}${L('M0,-110 L44,-90')}${[0, 1, 2, 3].map(i => { const a = i * Math.PI / 2; return L(`M${(Math.cos(a) * 76).toFixed(1)},${(-110 + Math.sin(a) * 76).toFixed(1)} L${(Math.cos(a) * 86).toFixed(1)},${(-110 + Math.sin(a) * 86).toFixed(1)}`); }).join('')}`,
  };
  const TALL = { persoon: 240, kind: 160, rechter: 260, weegschaal: 250, kruis: 250, deur: 290, boom: 280, berg: 220, weg: 240, huis: 220, graf: 180, vonnis: 190, telescoop: 200 };

  /** One drawing (a scene's props) as an SVG over the whole frame. */
  function drawing(list, parent) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('class', 'abs full');
    svg.style.overflow = 'visible'; parent.appendChild(svg);
    const n = list.length, ground = list.filter(d => d.at !== 'boven' && !SKY.has(d.p));
    // spread ground props that share a place
    const used = {};
    const parts = list.map((d, i) => {
      const sky = d.at === 'boven' || SKY.has(d.p);
      const sc = (d.big ? 1.7 : 1.25) * (n >= 4 ? .9 : 1);
      let x = X[d.at || 'midden'];
      if (!sky) { const k = used[d.at || 'midden'] = (used[d.at || 'midden'] || 0) + 1; if (k > 1) x += (k - 1) * 130; }
      const y = sky ? 780 + (d.p === 'vraagteken' ? 90 : 0) : GROUND;
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.innerHTML = PROPS[d.p](d); g.setAttribute('transform', `translate(${x},${y}) scale(${sc})`);
      svg.appendChild(g);
      let chip = null;
      if (d.label) {
        const top = y - (TALL[d.p] || 170) * sc - 70;
        chip = el('div', 'abs', parent, esc(d.label.toUpperCase()));
        css(chip, { left: x + 'px', top: top + 'px', transform: 'translate(-50%,0)', background: C.ink, color: C.paper, font: '700 24px Inter', letterSpacing: '3px', padding: '10px 18px', borderRadius: '8px', whiteSpace: 'nowrap', opacity: 0 });
        const stem = el('div', 'abs', parent); css(stem, { left: x - 1.5 + 'px', top: top + 46 + 'px', width: '3px', height: '42px', background: C.ink, opacity: 0 });
        chip = [chip, stem];
      }
      return { g, chip, sky, strokes: [...g.querySelectorAll('.d')], fills: [...g.querySelectorAll('.f, .t, .glow')] };
    });
    parts.forEach(p => p.strokes.forEach(s => { s.style.strokeDasharray = 1; s.style.strokeDashoffset = 1; }));
    return { svg, parts, groundCount: ground.length };
  }

  T['reel-vraag'] = (spec, timing) => {
    const is3d = spec.look === '3d';                                     // style B: templates/vraag3d.js draws the picture
    const INK = is3d ? '#fff' : C.ink, SHADOW = is3d ? '0 2px 22px rgba(0,0,0,.45)' : 'none';
    stage.style.background = C.cream;
    const style = el('style', '', stage); style.textContent = `.vq .d{stroke:${C.ink};stroke-width:5;stroke-linecap:round;stroke-linejoin:round;fill-opacity:0}.vq .d:not(.f){fill:none}`;
    const root = el('div', 'abs full vq');
    // warm halo behind the picture and a fine paper vignette
    const halo = el('div', 'abs', root); css(halo, { left: '90px', top: '420px', width: '900px', height: '900px', borderRadius: '50%', background: `radial-gradient(closest-side, ${C.goldSoft}, rgba(244,220,166,0))`, opacity: .0 });
    const vig = el('div', 'abs full', root); vig.style.background = is3d ? 'radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 50%, rgba(10,4,2,.38) 100%)' : 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(120,90,50,.10) 100%)';
    if (is3d) root.style.zIndex = '1';   // above the 3D canvas
    if (is3d) el('div', 'abs full', root).style.background = 'linear-gradient(to bottom, rgba(12,5,3,0) 58%, rgba(12,5,3,.34) 64%, rgba(12,5,3,.34) 76%, rgba(12,5,3,0) 84%)';   // reads over the scenery
    if (is3d) halo.style.display = 'none';
    const ground = el('div', 'abs', root); css(ground, { left: '130px', top: GROUND + 'px', width: '820px', height: '4px', borderRadius: '2px', background: C.ink, transformOrigin: 'left center' });
    const chip = el('div', 'abs', root, `<span style="color:${C.gold}">?</span>&nbsp;&nbsp;${esc((spec.series || 'Eerlijke vragen').toUpperCase())}`);
    css(chip, { left: '56px', top: (WM.top + 4) + 'px', font: '700 24px Inter', letterSpacing: '4px', color: INK, textShadow: SHADOW, opacity: 0 });
    if (is3d) ground.style.display = 'none';

    const units = T['reel-vraag'].units(spec);
    const segs = layout(units, timing);
    const talkEnd = endOf(segs) + .3;
    const duration = talkEnd + .9 + END;

    // the drawings: the question's, then each scene that has one (a scene without one keeps the last)
    const sources = [spec.draw?.length ? spec.draw : (spec.scenes[0].draw || [])];
    const drawOf = [0]; let cur = 0;
    spec.scenes.forEach(s => { if (s.draw?.length) { sources.push(s.draw); cur = sources.length - 1; } drawOf.push(cur); });
    drawOf.push(cur);                                                     // the ask keeps the last picture
    const drawings = is3d ? [] : sources.map(list => drawing(list, root));
    const pic = is3d ? window.VRAAG3D(spec, sources, root, timing) : null;
    const firstSeg = drawOf.map((d, i) => i).reduce((m, i) => (m[drawOf[i]] ??= i, m), {});

    // the question (title) at the top
    const qBox = el('div', 'abs serif', root);
    const keyRe = k => new RegExp(`(${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i');
    qBox.innerHTML = esc(spec.question).replace(keyRe(spec.key), `<span style="color:${C.gold}">$1</span>`);
    css(qBox, { left: '90px', width: '900px', top: TEXT_TOP + 'px', textAlign: 'center', fontWeight: 700, fontSize: fit(spec.question, [[40, 84], [60, 74], [999, 64]], 900) + 'px', lineHeight: 1.12, letterSpacing: '-1px', color: INK, textShadow: SHADOW, opacity: 0 });

    // the sentence under the picture: words light up as they are spoken, one word in colour
    const lines = segs.map((s, i) => {
      if (i === 0) return null;
      const sc = spec.scenes[i - 1];
      if (sc?.verse) return null;
      const text = i <= spec.scenes.length ? (sc.show || sc.say) : spec.ask;
      const key = i <= spec.scenes.length ? sc.key : null;
      const box = el('div', 'abs', root); css(box, { left: '90px', width: '900px', top: TEXT_Y + 'px', textAlign: 'center', fontWeight: 700, fontSize: fit(text, [[40, 66], [70, 58], [999, 52]], 900) + 'px', lineHeight: 1.18, letterSpacing: '-.8px', color: INK, textShadow: SHADOW, opacity: 0 });
      const words = text.split(/\s+/).filter(Boolean);
      const keyWords = key ? key.toLowerCase().split(/\s+/) : [];
      const spans = words.map(w => { const bare = w.toLowerCase().replace(/[^\p{L}\p{N}-]/gu, ''); const hit = keyWords.includes(bare);
        const sp = el('span', '', box, esc(w) + ' '); if (hit) sp.style.color = is3d ? C.gold : C.terra; return sp; });
      // times: the spoken words when the screen line is the spoken line, else spread over the segment
      const wt = wordTimes(sc?.show && sc.show !== sc.say ? { ...s, words: null, text } : s);
      const at = spans.map((_, j) => (wt[Math.min(j, wt.length - 1)] || { a: s.start }).a);
      return { box, spans, at };
    });

    // verse cards
    const verses = segs.map((s, i) => {
      const sc = spec.scenes[i - 1];
      if (!sc?.verse || !sc.verseData) return null;
      const card = el('div', 'abs full', root); css(card, { background: is3d ? 'rgba(22,12,10,.78)' : C.cream, opacity: 0 });
      const keys = (sc.verseKeys || []).map(k => k.toLowerCase());
      const txt = sc.verseData.text;
      const html = esc(`"${txt}"`).split(/(\s+)/).map(w => { const bare = w.toLowerCase().replace(/[^\p{L}\p{N}-]/gu, ''); return bare && keys.includes(bare) ? `<b style="font-style:normal;font-family:Inter;font-weight:700;font-size:.82em;letter-spacing:2px;color:${is3d ? C.gold : C.terra}">${w.toUpperCase()}</b>` : w; }).join('');
      const holder = el('div', '', card); css(holder, { position: 'absolute', left: '110px', width: '860px', top: '0', height: '1500px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '56px' });
      const q = el('div', 'serif', holder, html);
      css(q, { textAlign: 'center', fontStyle: 'italic', fontSize: fit(txt, [[90, 62], [160, 54], [260, 48], [999, 42]], 860) + 'px', lineHeight: 1.42, color: INK });
      const r = el('div', '', holder, vref(sc.verseData.ref).replace(/ SV$/, ' · SV'));
      css(r, { textAlign: 'center', font: '700 26px Inter', letterSpacing: '4px', color: is3d ? C.gold : C.terra });
      return { card, q, r };
    });

    // watermark on a light ground: the full-colour logo, small and calm in the top right (WM spot)
    const wmDark = is3d ? watermark(5) : null;   // dark ground: the outlined mark + white wordmark
    const wmBox = el('div', 'abs', stage); css(wmBox, { top: WM.top + 'px', right: WM.right + 'px', height: WM.h + 'px', zIndex: 5, opacity: 0 });
    img(ctx.logos.full, '', wmBox).style.height = WM.h + 'px';
    const wm = wmDark || ((t, endStart) => { wmBox.style.opacity = (.75 * out(prog(t, 0, .4)) * (1 - prog(t, endStart - .1, endStart + .2))).toFixed(3); });
    const end = endCard(spec);
    const k = (t, a, d = .45) => out(prog(t, a, a + d));

    return { width: W, height: H, duration, ...(is3d ? { fps: 24, ready: pic.ready } : {}), starts: segs.map(s => s.start), render(t) {
      const segAt = segs.findIndex((s, i) => t < (segs[i + 1]?.start ?? 1e9) - .2);
      const i = segAt < 0 ? segs.length - 1 : segAt;
      set(chip, k(t, .1) * .85 * (1 - prog(t, duration - END - .1, duration - END + .2)));
      ground.style.transform = `scaleX(${k(t, .15, .7)})`;
      halo.style.opacity = (.85 * k(t, .3, 1.2)).toFixed(3);
      // question title: on for the question, then gone
      const qOut = inout(prog(t, segs[1].start - .45, segs[1].start - .1));
      set(qBox, k(t, .05, .5) * (1 - qOut), (1 - k(t, .05, .5)) * 24);
      // drawings: the active one draws itself, the others fade
      drawings.forEach((dr, d) => {
        const from = segs[firstSeg[d]].start - .25;
        const active = drawOf[i] === d;
        const fade = active ? 1 : (d < drawOf[i] ? 1 - inout(prog(t, segs[nextStart(d)]?.start - .45, segs[nextStart(d)]?.start - .1)) : 0);
        dr.svg.style.opacity = Math.max(0, fade).toFixed(3);
        dr.parts.forEach((p, j) => {
          const a = from + j * .22;
          const draw = prog(t, a, a + .8), fill = k(t, a + .45, .5);
          p.strokes.forEach(s => { s.style.strokeDashoffset = (1 - out(draw)).toFixed(4); });
          p.fills.forEach(f => { f.style.fillOpacity = fill.toFixed(3); if (f.classList.contains('t') || f.classList.contains('glow')) f.style.opacity = fill.toFixed(3); });
          const bob = p.sky ? Math.sin((t - a) * 1.4) * 6 : 0;
          p.g.style.translate = `0 ${bob.toFixed(1)}px`;
          if (p.chip) { const c = k(t, a + .7, .4) * Math.max(0, fade); p.chip[0].style.opacity = c; p.chip[1].style.opacity = c; }
        });
      });
      // the sentence
      lines.forEach((ln, j) => {
        if (!ln) return;
        const s = segs[j], until = segs[j + 1] ? segs[j + 1].start - .15 : talkEnd + .9;
        const o = k(t, s.start - .2, .3) * (1 - inout(prog(t, until - .3, until)));
        set(ln.box, o, (1 - k(t, s.start - .2, .3)) * 18);
        ln.spans.forEach((sp, m) => { sp.style.opacity = (.22 + .78 * k(t, ln.at[m] - .06, .18)).toFixed(3); });
      });
      // verse cards cover the picture while they are read
      verses.forEach((v, j) => {
        if (!v) return;
        const s = segs[j], until = segs[j + 1] ? segs[j + 1].start - .15 : talkEnd + .9;
        const o = k(t, s.start - .35, .4) * (1 - inout(prog(t, until - .35, until)));
        v.card.style.opacity = o.toFixed(3);
        set(v.q, k(t, s.start - .2, .6), (1 - k(t, s.start - .2, .6)) * 20);
        set(v.r, k(t, s.start + .6, .5));
      });
      if (pic) pic.render(t, { segs, drawOf, firstSeg, i, endStart: duration - END });
      wm(t, duration - END);
      end(t, duration - END);
    } };

    function nextStart(d) { return firstSeg[d + 1]; }
  };
  T['reel-vraag'].units = spec => [
    { text: spec.question },
    ...spec.scenes.map(s => ({ text: s.say, pause: s.verse ? .35 : .1 })),
    { text: spec.ask, pause: .3 },
  ];
})();
