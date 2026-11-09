/* reel-vraag, look "3d" (Alex, 9 Nov: style B, low-poly 3D like the explainers he saved): the picture of each
   scene is a small low-poly spot in one wide, single-colour world (warm evening or night), seen from a high
   isometric camera that glides from spot to spot. Each spot has a warm glow and a soft light beam; props pop
   up one by one. Our own scenes and props (VRAAG_PROPS in engine/spec.mjs), never God, Jesus or angels as a figure.
   templates/vraag.js keeps the question, sentences, verse card and end card and calls window.VRAAG3D for the
   picture. Everything is a pure function of t. */
import { THREE, getRenderer, V, clamp, lerp, prog, inout, out, mat, mesh, at, rot, scl, group, G, rng, particles, canvasTexture, setStyle } from '../3d/core.js';
import { person, shade } from '../3d/people.js';
import { olive, rock } from '../3d/props-outdoor.js';

const SFEER = {
  avond: { bg: '#8e5444', ground: '#8a5040', prop: '#a0624f', key: '#ffd9b4', keyI: 1.25, sky: '#e8b49a', low: '#4a2219', hemi: .95, glow: '#ffc98a', dust: '#ffe4c8', beam: '#ffdcb0' },
  nacht: { bg: '#1c2748', ground: '#22305a', prop: '#3a4e86', key: '#b4c2ff', keyI: .8, sky: '#5a70b0', low: '#101830', hemi: 1.25, glow: '#ffcf7a', dust: '#d6e2ff', beam: '#ffe2a8' },
};
const GOLD = '#e8b44a', RED = '#c8343a', WOOD = '#8a5a3a', CREAM = '#efe4cf';
const PX = { links: -1.9, midden: 0, rechts: 1.9, boven: 0 };
const SKY = new Set(['zon', 'wolk', 'regen', 'ster', 'vraagteken', 'klok']);
const SPOT = 15;                                   // world units between two scenes' spots
const VIEW_W = 8.6, SKY_Y = 4.1;                                // world units across the frame
const DIR = V(.62, .78, 1).normalize();            // camera direction (from the target)
const backOut = x => { x = clamp(x); const c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };

/* ---------- people (simple robes, tiny in frame; faces barely read) ---------- */
const LOOK = {
  persoon: { skin: 'medium', hair: ['kort', '#2b1d14'], top: ['gewaad', '#ece2cf', '#b9a98c'], bottom: ['gewaad'], shoes: '#6b4a32' },
  kind: { skin: 'olijf', hair: ['krul', '#2a1a10'], top: ['gewaad', '#d9c49a', '#8a6a48'], bottom: ['gewaad'], shoes: '#6b4a32' },
  rechter: { skin: 'olijf', hair: ['kaal-rand', '#d8d4cc'], beard: ['kort', '#d8d4cc'], top: ['gewaad', '#2c2a33', '#e3b341'], bottom: ['gewaad'], shoes: '#3b2e25', old: true },
};
const POSE = {
  staan: { base: 'stand', action: 'idle' }, wijzen: { base: 'stand', action: 'point' }, knielen: { base: 'kneel', action: 'pray' },
  'armen-open': { base: 'stand', action: 'cheer' }, verdrietig: { base: 'stand', action: 'think', mood: 'verdrietig' },
  lopen: { base: 'walk', action: 'idle' }, omhoog: { base: 'stand', action: 'look-up' },
};

/* ---------- props: low-poly, origin at the bottom centre, about 1-2 units ---------- */
function makeProps(S) {
  const P = k => mat(shade(S.prop, k)), M = c => mat(c);
  const glowM = c => mat(c, { emissive: c, glow: 1.4 });
  const box = (w, h, d, m, x = 0, y = 0, z = 0) => at(mesh(G.box(w, h, d), m), x, y, z);
  const heartGeo = () => {
    const s = new THREE.Shape(); s.moveTo(0, -.55); s.bezierCurveTo(-.15, -.35, -.62, -.1, -.6, .22); s.bezierCurveTo(-.58, .5, -.2, .6, 0, .32);
    s.bezierCurveTo(.2, .6, .58, .5, .6, .22); s.bezierCurveTo(.62, -.1, .15, -.35, 0, -.55);
    const g = new THREE.ExtrudeGeometry(s, { depth: .22, bevelEnabled: true, bevelThickness: .05, bevelSize: .05, bevelSegments: 1, curveSegments: 5 }); g.translate(0, .55, -.11); return g;
  };
  return {
    huis: () => { const g = new THREE.Group(); g.add(box(1.6, 1.1, 1.3, P(.12), 0, .55, 0));
      const roof = mesh(new THREE.CylinderGeometry(.01, 1.15, .7, 4, 1), P(-.18)); roof.rotation.y = Math.PI / 4; roof.scale.set(1.05, 1, .85); g.add(at(roof, 0, 1.45, 0));
      g.add(box(.36, .62, .04, glowM(S.glow), .3, .31, .66)); g.add(box(.32, .28, .04, glowM(S.glow), -.42, .62, .66)); return g; },
    deur: () => { const g = new THREE.Group(); g.add(box(.16, 2, .2, P(-.1), -.55, 1, 0)); g.add(box(.16, 2, .2, P(-.1), .55, 1, 0)); g.add(box(1.26, .18, .22, P(-.1), 0, 2.05, 0));
      g.add(box(.94, 1.92, .04, glowM(S.glow), 0, .96, -.06)); const d = box(.9, 1.9, .08, M(WOOD), .45, .95, 0); const hinge = group(g, d); hinge.position.set(-.47, 0, .06); d.position.x = .45; hinge.rotation.y = -.9; return g; },
    boom: () => olive({ s: .55, seed: 3 }),
    berg: () => { const g = new THREE.Group(); g.add(at(mesh(G.cone(1.4, 2.2, 6), P(-.08)), 0, 1.1, 0)); g.add(at(mesh(G.cone(.9, 1.4, 6), P(.1)), .9, .7, .3)); g.add(at(mesh(G.cone(.42, .5, 6), M('#f3ece0')), 0, 1.98, 0)); return g; },
    weg: () => { const g = new THREE.Group(); g.add(at(rot(mesh(G.plane(.9, 5.5), P(-.2)), -Math.PI / 2, 0, 0), 0, .015, 0));
      for (let i = 0; i < 6; i++) g.add(at(rot(mesh(G.plane(.07, .4), P(.25)), -Math.PI / 2, 0, 0), 0, .02, -2.3 + i * .9)); return g; },
    kruis: () => { const g = new THREE.Group(); g.add(box(.22, 2.6, .22, M(WOOD), 0, 1.3, 0)); g.add(box(1.3, .2, .2, M(WOOD), 0, 1.95, 0)); g.add(at(scl(mesh(G.sphere(.5, 8, 6), P(-.05)), 1.3, .4, 1.3), 0, .05, 0)); return g; },
    graf: () => { const g = new THREE.Group(); g.add(at(scl(mesh(G.sphere(1.1, 8, 6), P(-.06)), 1.2, .85, .9), 0, .35, -.2)); g.add(at(mesh(G.cyl(.55, .55, .14, 8), P(.12)), 0, .62, .7));
      g.add(at(rot(mesh(G.cyl(.62, .62, .14, 8), P(-.25)), Math.PI / 2, 0, 0), .9, .6, .6)); g.add(box(.9, .9, .05, mat('#120a08'), 0, .5, .62)); return g; },
    bijbel: () => { const g = new THREE.Group(); g.add(box(.9, .2, 1.2, M('#5b2a2a'), 0, .1, 0)); g.add(box(.84, .16, 1.14, M('#f4ecd8'), .04, .11, 0)); g.add(box(.08, .04, .5, M(GOLD), -.2, .215, 0)); g.add(box(.3, .04, .08, M(GOLD), -.2, .215, -.08)); return g; },
    lamp: () => { const g = new THREE.Group(); const l = new THREE.PointLight('#ffc070', 4, 3, 1.5); l.position.set(.58, .7, .2); g.add(l); g.add(at(scl(mesh(G.sphere(.32, 8, 6), M('#b9714a')), 1.3, .55, .9), 0, .16, 0)); g.add(at(rot(mesh(G.cone(.08, .3, 5), M('#b9714a')), 0, 0, -1.2), .45, .26, 0));
      g.add(at(scl(mesh(G.sphere(.1, 6, 5), glowM('#ffd27a')), .8, 1.6, .8), .58, .42, 0)); return g; },
    ster: () => at(mesh(new THREE.OctahedronGeometry(.36, 0), mat('#ffe2a0', { emissive: '#e8a440', glow: .9 })), 0, 0, 0),
    zon: () => { const g = new THREE.Group(); g.add(mesh(new THREE.IcosahedronGeometry(.45, 1), mat('#ffc96e', { emissive: '#ff9f3a', glow: .9 }))); return g; },
    wolk: () => { const g = new THREE.Group(); [[0, 0, .55], [-.6, -.1, .4], [.6, -.08, .42], [.25, .25, .38]].forEach(([x, y, r]) => g.add(at(mesh(G.sphere(r, 8, 6), M(shade(S.sky, .55))), x, y, 0))); return g; },
    regen: () => { const g = new THREE.Group(); [[0, 0, .55], [-.6, -.1, .4], [.6, -.08, .42]].forEach(([x, y, r]) => g.add(at(mesh(G.sphere(r, 8, 6), M(shade(S.sky, .1))), x, y, 0)));
      for (let i = 0; i < 9; i++) g.add(at(mesh(G.box(.03, .3, .03), mat('#cfe2ff', { transparent: true, opacity: .8 })), -.7 + i * .18, -.75 - (i % 3) * .25, 0)); return g; },
    weegschaal: () => { const g = new THREE.Group(); g.add(box(.5, .12, .5, M(GOLD), 0, .06, 0)); g.add(box(.08, 1.6, .08, M(GOLD), 0, .85, 0)); g.add(box(1.5, .07, .07, M(GOLD), 0, 1.6, 0));
      [-.7, .7].forEach(x => { g.add(box(.02, .5, .02, M(GOLD), x, 1.35, 0)); g.add(at(mesh(G.cyl(.3, .18, .08, 10), M(GOLD)), x, 1.08, 0)); }); return g; },
    hamer: () => { const g = new THREE.Group(); g.add(at(rot(box(.12, 1.2, .12, M(WOOD)), 0, 0, 1.2), 0, .14, 0)); g.add(at(rot(box(.5, .26, .26, M('#6b4a32')), 0, 0, 1.2), -.5, .36, 0)); g.add(box(.7, .1, .5, P(-.2), .4, .05, 0)); return g; },
    vonnis: () => { const g = new THREE.Group(); g.add(box(.9, .02, 1.1, M(CREAM), 0, .3, 0)); g.add(at(rot(mesh(G.cyl(.09, .09, 1, 8), M('#d9c9a8')), 0, 0, Math.PI / 2), 0, .3, -.58)); g.add(at(rot(mesh(G.cyl(.09, .09, 1, 8), M('#d9c9a8')), 0, 0, Math.PI / 2), 0, .3, .58));
      g.add(box(.08, .3, .08, P(-.1), -.35, .15, 0)); g.add(box(.08, .3, .08, P(-.1), .35, .15, 0)); g.add(at(mesh(G.cyl(.12, .12, .04, 10), M(RED)), .25, .33, .3)); return g; },
    ketting: () => { const g = new THREE.Group(); for (let i = 0; i < 6; i++) g.add(at(rot(mesh(G.torus(.17, .05, Math.PI * 2, 5, 10), M('#8d8d93')), i % 2 ? Math.PI / 2 : 0, 0, 0), -.9 + i * .36, .2, 0)); return g; },
    schaap: () => { const g = new THREE.Group(); g.add(at(scl(mesh(G.sphere(.45, 8, 6), M('#f1ece2')), 1.3, .95, 1), 0, .6, 0)); g.add(at(scl(mesh(G.sphere(.18, 6, 5), M('#3b302a')), 1, 1.2, 1), .6, .75, 0));
      [[-.3, .2], [-.3, -.2], [.3, .2], [.3, -.2]].forEach(([x, z]) => g.add(box(.08, .32, .08, M('#3b302a'), x, .16, z))); return g; },
    brood: () => { const g = new THREE.Group(); g.add(at(scl(mesh(G.sphere(.5, 8, 6), M('#d29a55')), 1.4, .55, .9), 0, .26, 0)); for (let i = 0; i < 3; i++) g.add(at(rot(box(.05, .03, .45, M('#a8702f')), 0, .5, 0), -.3 + i * .3, .53, 0)); return g; },
    beker: () => { const g = new THREE.Group(); g.add(at(mesh(G.lathe([[.3, 0], [.32, .04], [.08, .1], [.06, .5], [.18, .62], [.34, .95], [.36, 1.05]], 10), M(GOLD)), 0, 0, 0)); return g; },
    sleutel: () => { const g = new THREE.Group(); const k = group(g); k.add(at(mesh(G.torus(.32, .09, Math.PI * 2, 5, 10), M(GOLD)), -.7, 0, 0)); k.add(box(1.2, .12, .12, M(GOLD), .1, 0, 0)); k.add(box(.1, .28, .12, M(GOLD), .45, -.16, 0)); k.add(box(.1, .2, .12, M(GOLD), .65, -.12, 0));
      k.rotation.z = .5; k.position.y = .75; return g; },
    vraagteken: () => { const tex = canvasTexture(256, 256, (c, w, h) => { c.font = '700 230px Lora, Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#ffe1a6'; c.shadowColor = 'rgba(255,190,110,.9)'; c.shadowBlur = 24; c.fillText('?', w / 2, h / 2 + 10); });
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false })); s.scale.set(1.6, 1.6, 1); return s; },
    geschenk: () => { const g = new THREE.Group(); g.add(box(.9, .75, .9, M(RED), 0, .38, 0)); g.add(box(1, .2, 1, M(RED), 0, .82, 0)); g.add(box(.14, .97, 1.02, M(GOLD), 0, .48, 0)); g.add(box(1.02, .97, .14, M(GOLD), 0, .48, 0));
      g.add(at(rot(mesh(G.torus(.16, .05, Math.PI * 2, 4, 8), M(GOLD)), 0, .7, 0), -.12, 1.02, 0)); g.add(at(rot(mesh(G.torus(.16, .05, Math.PI * 2, 4, 8), M(GOLD)), 0, -.7, 0), .12, 1.02, 0)); return g; },
    klok: () => { const g = new THREE.Group(); g.add(rot(mesh(G.cyl(.6, .6, .12, 12), M(CREAM)), Math.PI / 2, 0, 0)); g.add(rot(mesh(G.torus(.6, .06, Math.PI * 2, 4, 12), M(GOLD)), 0, 0, 0));
      g.add(at(box(.05, .42, .05, M('#2b2824')), 0, .18, .08)); const h = at(box(.05, .3, .05, M('#2b2824')), .1, .1, .08); h.rotation.z = -1.1; g.add(h); return g; },
    telescoop: () => { const g = new THREE.Group(); [-.5, .5, 0].forEach((x, i) => { const l = box(.06, 1.1, .06, M(WOOD), x * .5, .5, i === 2 ? -.3 : .15); l.rotation.z = -x * .35; l.rotation.x = i === 2 ? .3 : -.15; g.add(l); });
      const tube = at(rot(mesh(G.cyl(.1, .16, 1.3, 8), M(GOLD)), 0, 0, 1.05), 0, 1.15, 0); g.add(tube); return g; },
    hart: () => { const g = new THREE.Group(); g.add(at(mesh(heartGeo(), mat(RED, { emissive: '#5a0d10', glow: 1 })), 0, .25, 0)); return g; },
    'gebroken-hart': () => { const g = new THREE.Group(); const m = mat(RED); const geo = heartGeo();
      const clip = () => { const grp = new THREE.Group(); grp.add(mesh(geo, m)); return grp; };
      const a = clip(), b = clip(); a.position.set(-.18, .25, 0); a.rotation.z = .18; a.scale.x = .55; b.position.set(.22, .2, 0); b.rotation.z = -.22; b.scale.x = .55; g.add(a, b); return g; },
  };
}

window.VRAAG3D = (spec, sources, root, timing) => {
  const W = 1080, H = 1920;
  setStyle('lowpoly');
  const S = SFEER[spec.sfeer] || SFEER.avond;
  stage.style.background = S.bg;
  const r = getRenderer(stage); r.domElement.style.zIndex = '0';
  const scene = new THREE.Scene(); scene.background = new THREE.Color(S.bg);
  const PROPS = makeProps(S);

  // camera: orthographic and high, the frame's picture centre a bit above the middle (text sits under it)
  const VH = VIEW_W * H / W, CY = .5;
  const camera = new THREE.OrthographicCamera(-VIEW_W / 2, VIEW_W / 2, VH * CY, -VH * (1 - CY), .1, 200);
  scene.fog = new THREE.Fog(S.bg, 34, 70);

  // light: one key (casts the shadows, follows the camera), a soft fill
  const sun = new THREE.DirectionalLight(S.key, S.keyI); sun.castShadow = true; sun.shadow.mapSize.set(1536, 1536); sun.shadow.bias = -.0006; sun.shadow.normalBias = .02;
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: .5, far: 60 }); scene.add(sun, sun.target);
  scene.add(new THREE.HemisphereLight(S.sky, S.low, S.hemi));

  // the ground and the wide world around the spots
  const spots = sources.map((_, d) => V(d * SPOT, 0, -d * 2.5));
  const ground = mesh(new THREE.PlaneGeometry(400, 400, 1, 1), mat(S.ground)); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; ground.castShadow = false; scene.add(ground);
  const rnd = rng('vraag3d' + spec.id);
  const near = (x, z, pad) => spots.some(p => Math.hypot(x - p.x, z - p.z) < pad || (Math.abs(x - p.x) < 4.2 && z > p.z - 1 && z < p.z + 9));
  const span = [-12, (sources.length - 1) * SPOT + 12];
  for (let i = 0; i < 70 + sources.length * 20; i++) {
    const x = lerp(span[0], span[1], rnd()), z = -16 + rnd() * 26 - (x / SPOT) * 2.5;
    if (near(x, z, 4.6)) continue;
    const kind = rnd();
    let o;
    if (kind < .45) o = olive({ s: .4 + rnd() * .35, seed: Math.floor(rnd() * 9) });
    else if (kind < .8) o = rock({ s: .25 + rnd() * .4, seed: Math.floor(rnd() * 9), c: shade(S.prop, -.1) });
    else { o = new THREE.Group(); const h = .7 + rnd() * .6; o.add(at(mesh(G.box(1.1, h, 1), mat(shade(S.prop, .08))), 0, h / 2, 0)); o.add(at(mesh(G.box(1.2, .14, 1.1), mat(shade(S.prop, -.15))), 0, h + .07, 0)); }
    o.position.set(x, 0, z); o.rotation.y = rnd() * 6.28;
    // one-colour world: the scenery takes tones of the ground colour (only the scenes' props keep their colours)
    const tones = [mat(shade(S.prop, -.12)), mat(shade(S.prop, .06)), mat(shade(S.prop, -.25))];
    o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; m.material = tones[Math.floor(rnd() * 3)]; } });
    scene.add(o);
  }

  // per spot: a glowing ground disc, a soft light beam, a warm point light, the props
  const discTex = canvasTexture(256, 256, (c, w) => { const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(255,220,170,.85)'); g.addColorStop(.45, 'rgba(255,200,140,.35)'); g.addColorStop(1, 'rgba(255,190,130,0)'); c.fillStyle = g; c.fillRect(0, 0, w, w); });
  const beamTex = canvasTexture(64, 256, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,230,190,0)'); g.addColorStop(.6, 'rgba(255,230,190,.5)'); g.addColorStop(1, 'rgba(255,230,190,.9)'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
  const used = {};
  const worldSpots = sources.map((list, d) => {
    const c = spots[d], g = new THREE.Group(); g.position.copy(c); scene.add(g);
    const disc = mesh(new THREE.PlaneGeometry(7.5, 7.5), new THREE.MeshBasicMaterial({ map: discTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0 }), { cast: false, receive: false });
    disc.rotation.x = -Math.PI / 2; disc.position.y = .02; g.add(disc);
    const beam = mesh(new THREE.CylinderGeometry(1.1, 2.4, 14, 16, 1, true), new THREE.MeshBasicMaterial({ map: beamTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false, opacity: 0 }), { cast: false, receive: false });
    beam.position.y = 7; g.add(beam);
    const lamp = new THREE.PointLight(S.glow, 0, 9, 1.6); lamp.position.set(0, 2.6, 1.2); g.add(lamp);
    const at0 = {};
    const parts = list.map((dr, j) => {
      const sky = dr.at === 'boven' || SKY.has(dr.p);
      const k = at0[dr.at || 'midden'] = (at0[dr.at || 'midden'] || 0) + 1;
      let x = PX[dr.at || 'midden'] + (sky ? 0 : (k - 1) * 1.1), z = sky ? 0 : (k - 1) * -.4;
      const holder = new THREE.Group(); const skyY = dr.p === 'vraagteken' || d === 0 ? SKY_Y - 1.3 : SKY_Y;   // under the question title
      holder.position.set(x, sky ? skyY : 0, z); g.add(holder);
      const inner = new THREE.Group(); holder.add(inner);
      let actor = null;
      if (LOOK[dr.p]) {
        actor = person(LOOK[dr.p], { seed: spec.id + d + j }); inner.add(actor.root);
        if (dr.p === 'kind') actor.root.scale.setScalar(.62);
        actor.root.rotation.y = dr.at === 'links' ? .55 : dr.at === 'rechts' ? -.55 : 0;
      } else inner.add((PROPS[dr.p] || PROPS.vraagteken)());
      const s = (dr.big ? 1.45 : 1) * (list.length >= 4 ? .88 : 1); holder.scale.setScalar(s);
      inner.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
      const top = (LOOK[dr.p] ? (dr.p === 'kind' ? 1.25 : 2.05) : sky ? .9 : 1.6) * s;
      let chip = null;
      if (dr.label) {
        chip = el('div', 'abs', root, esc(dr.label.toUpperCase()));
        css(chip, { left: 0, top: 0, transform: 'translate(-50%,-100%)', background: 'rgba(24,14,12,.82)', color: '#fff', font: '700 24px Inter', letterSpacing: '3px', padding: '10px 18px', borderRadius: '8px', whiteSpace: 'nowrap', opacity: 0, zIndex: 2 });
        const stem = el('div', 'abs', root); css(stem, { width: '3px', height: '40px', background: 'rgba(255,255,255,.85)', opacity: 0, zIndex: 2, transform: 'translate(-50%,0)' });
        chip = [chip, stem];
      }
      return { holder, inner, actor, sky, skyY, pose: POSE[dr.pose] || POSE.staan, top, chip, x, z };
    });
    return { c, g, disc, beam, lamp, parts };
  });
  // night: a moon high in the frame (kept in place relative to the camera)
  let moon = null;
  if (spec.sfeer === 'nacht') {
    moon = new THREE.Group(); scene.add(moon);
    moon.add(mesh(new THREE.IcosahedronGeometry(.42, 2), new THREE.MeshBasicMaterial({ color: '#fbf3dc', fog: false }), { cast: false, receive: false }));
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTex, color: '#cfdcff', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: .55 })); halo.scale.set(3.2, 3.2, 1); moon.add(halo);
  }
  const dust = particles(scene, { count: 160, area: [VIEW_W * 1.6, 7, 10], center: [0, 3, 0], color: S.dust, size: .05, opacity: .55, drift: [.12, 0, 0], seed: 7 });
  dust.obj.material.fog = false;
  const tmp = new THREE.Vector3();

  return {
    ready: Promise.resolve(),
    render(t, { segs, drawOf, firstSeg, i, endStart }) {
      // camera: at the active spot; glides to the next one in the 1.3 s before its first line
      const cur = drawOf[i];
      let target = spots[cur].clone();
      const nxt = firstSeg[cur + 1];
      if (nxt != null) { const a = segs[nxt].start - 1.35, k = inout(prog(t, a, a + 1.25)); target.lerp(spots[cur + 1], k); }
      if (cur > 0) { const a = segs[firstSeg[cur]].start - 1.35, k = inout(prog(t, a, a + 1.25)); if (k < 1) target = spots[cur - 1].clone().lerp(spots[cur], k); }
      target.add(V(Math.sin(t * .23) * .25, .9, Math.cos(t * .19) * .2));   // a calm drift
      const zoom = 1 + .05 * Math.sin(t * .15) + .04 * prog(t, 0, endStart);
      camera.zoom = zoom; camera.updateProjectionMatrix();
      camera.position.copy(target).addScaledVector(DIR, 40); camera.lookAt(target); camera.updateMatrixWorld();
      sun.position.copy(target).add(V(5, 9, 4)); sun.target.position.copy(target);
      dust.obj.position.set(target.x, 0, target.z); dust.update(t);
      if (moon) { const up = V(0, 1, 0).applyQuaternion(camera.quaternion), right = V(1, 0, 0).applyQuaternion(camera.quaternion);
        moon.position.copy(target).addScaledVector(DIR, 12).addScaledVector(up, VH * .4 / zoom).addScaledVector(right, 2.3 / zoom); }
      scene.updateMatrixWorld();

      worldSpots.forEach((w, d) => {
        const from = segs[firstSeg[d]].start - .35;
        const on = d === cur ? 1 : 0;
        const lit = out(prog(t, from - .3, from + .6)) * (d <= cur ? 1 : 0) * (d < cur ? .35 : 1);
        w.disc.material.opacity = .9 * lit; w.beam.material.opacity = .22 * lit; w.lamp.intensity = 7 * lit;
        w.parts.forEach((p, j) => {
          const a = from + j * .22, k = backOut(prog(t, a, a + .55));
          p.inner.scale.setScalar(Math.max(.001, k)); p.inner.visible = k > .002;
          if (p.sky) p.inner.position.y = Math.sin((t - a) * 1.3) * .12;
          if (p.actor) {
            const st = { ...p.pose, t0: a };
            if (st.base === 'walk') st.walk = { phase: (t - a) * 6, amount: 1 };
            p.actor.pose(t, st);
          }
          if (p.chip) {
            tmp.set(p.x, p.top + (p.sky ? p.skyY : 0) + .25, p.z).applyMatrix4(p.holder.parent.matrixWorld);
            tmp.project(camera); const sx = (tmp.x + 1) / 2 * W, sy = (1 - tmp.y) / 2 * H;
            const c = out(prog(t, a + .6, a + 1)) * on * (1 - inout(prog(t, (segs[firstSeg[d + 1]]?.start ?? 1e9) - 1.4, (segs[firstSeg[d + 1]]?.start ?? 1e9) - 1)));
            css(p.chip[0], { left: sx + 'px', top: sy - 48 + 'px', opacity: c.toFixed(3) }); css(p.chip[1], { left: sx + 'px', top: sy - 46 + 'px', opacity: c.toFixed(3) });
          }
        });
      });
      r.render(scene, camera);
    },
  };
};
