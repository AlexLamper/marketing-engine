// Keeps a quiz-run channel stocked, per project with "quizrun" in project.json (BijbelQuiz nl, Bible
// Quizzes en, ...). Runs every few hours (quizrun.yml); each run makes what is missing to keep about two
// days of videos ahead (quizrun.perDay x 2) and leaves them queued for render-pending, which puts them on
// the pile by itself (quizrun.autoPublish). Nothing for Alex to review: every question and answer comes
// from the platform (engine/quizrun/make.mjs), every other word from engine/quizrun/locales.mjs.
//
// It waits, without making anything, while
//   - the platform's catalogue has fewer than quizrun.minQuizzes quizzes (Bible Quizzes en starts by
//     itself once biblequizzes.app has its English quizzes - Alex, 16 Nov 2026), or
//   - no account of the project is linked yet (nothing could go out).
import '../env.mjs';
import { db, close, STATUS, heartbeat } from '../db.mjs';
import { applyConnections } from '../connections.mjs';
import { project } from '../project.mjs';
import { prepare } from '../spec.mjs';
import { makeSpec, platformApi } from '../quizrun/make.mjs';
import { localDate, isoWeekOf, isoWithOffset } from '../slots.mjs';
import { metaConfigured } from '../publish/meta.mjs';
import { youtubeConfigured } from '../publish/youtube.mjs';
import { tiktokConfigured, uploadPostConfigured } from '../publish/tiktok.mjs';

const P = project(); const cfg = P.quizrun;
if (!cfg) { console.log(`[${P.id}] no quizrun in project.json - nothing to do`); process.exit(0); }
const force = process.argv.includes('--force');   // make even without a linked account (to look at)

const api = platformApi(cfg.api);
const catalogue = await api.catalogue();
const min = cfg.minQuizzes ?? 20;
if (catalogue.length < min) {
  console.log(`[${P.id}] ${cfg.api} has ${catalogue.length} quizzes (needs ${min}) - waiting, nothing made`);
  await heartbeat('quizrun', { waiting: `catalogus ${catalogue.length}/${min}` }); await close(); process.exit(0);
}

const d = await db(); const items = d.collection('items');
await applyConnections();
const reachable = { instagram: metaConfigured(), facebook: !!(process.env.META_PAGE_TOKEN && process.env.FB_PAGE_ID), youtube: youtubeConfigured(), tiktok: tiktokConfigured() || uploadPostConfigured() };
const live = P.platforms.filter(p => reachable[p]);
if (!live.length && !force) {
  console.log(`[${P.id}] no account linked yet (${P.platforms.join(', ')}) - nothing made`);
  await heartbeat('quizrun', { waiting: 'geen account gekoppeld' }); await close(); process.exit(0);
}

// what is still to come: made, rendering, on the pile
const now = new Date();
const ahead = await items.countDocuments({ kind: 'reel-quizrun', $or: [
  { status: { $in: [STATUS.QUEUED, STATUS.RENDERING, STATUS.REVIEW] } },
  { status: STATUS.FAILED, renderAttempts: { $not: { $gte: 3 } } },
  { status: STATUS.APPROVED, $or: [{ postAt: null }, { postAt: { $gt: now } }] }] });
const target = (cfg.perDay || 2) * (cfg.daysAhead || 2);
const make = Math.max(0, target - ahead);
if (!make) { console.log(`[${P.id}] ${ahead} quiz videos ahead - enough`); await heartbeat('quizrun', { ahead }); await close(); process.exit(0); }

// never a question twice on this channel; never the same book as the last few videos
const past = await items.find({ kind: 'reel-quizrun' }, { projection: { 'spec.questions.qid': 1, quizTheme: 1, createdAt: 1 } }).sort({ createdAt: -1 }).toArray();
const used = new Set(past.flatMap(it => (it.spec?.questions || []).map(q => q.qid)));
const recent = past.slice(0, 4).map(it => it.quizTheme).filter(Boolean);
const counter = d.collection('settings');
const tz = P.timezone || 'Europe/Amsterdam'; const today = localDate(now, tz);
const ymd = `${today.y}${String(today.m).padStart(2, '0')}${String(today.d).padStart(2, '0')}`;
let made = 0; const problems = [];
for (let k = 0; k < make; k++) {
  const c = await counter.findOneAndUpdate({ _id: 'quizrun' }, { $inc: { n: 1 } }, { upsert: true, returnDocument: 'after' });
  const n = (c?.value ?? c)?.n ?? past.length + k + 1;
  const id = `qr-${cfg.lang}-${ymd}-${n}`;
  try {
    const raw = await makeSpec({ project: P, catalogue, fetchQuiz: api.fetchQuiz, used, n, seed: id, id,
      week: isoWeekOf(today), slot: isoWithOffset(now, tz), recentThemes: recent });
    const theme = raw._theme; delete raw._theme;
    raw.platforms = live.length ? live : [...P.platforms];
    const spec = await prepare(raw);
    await items.insertOne({ _id: id, spec, kind: spec.kind, week: spec.week, slot: new Date(spec.slot), status: STATUS.QUEUED, aiLabel: false, renderAttempts: 0,
      quizTheme: theme, auto: true, createdAt: new Date(), updatedAt: new Date(), history: [{ at: new Date(), event: 'made', note: `quiz run: ${spec.title.pre} ${spec.title.hi}` }] });
    spec.questions.forEach(q => used.add(q.qid)); recent.unshift(theme);
    made++; console.log(`[${P.id}] ${id}: ${spec.title.pre} ${spec.title.hi} (${spec.questions.length} vragen) -> ${raw.platforms.join(', ')}`);
  } catch (e) { problems.push(`${id}: ${e.message}`); console.error(`[${P.id}] ${id}: ${e.message}`); }
}
await heartbeat('quizrun', { made, ahead: ahead + made, problems: problems.length });
if (process.env.GITHUB_OUTPUT && made) (await import('node:fs')).appendFileSync(process.env.GITHUB_OUTPUT, `made=${made}\n`);
await close();
if (problems.length && !made) process.exit(1);
