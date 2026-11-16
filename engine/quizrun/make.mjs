// Builds a reel-quizrun spec from the quiz platform's own questions (BijbelQuiz on bijbelquiz.com, Bible
// Quizzes on biblequizzes.app): no model writes a question, an answer or a line on screen.
//   catalogue  GET <api>            cards: id, title, difficulty, category, passage { book, chapter, label }
//   one quiz   GET <api>/<id>       questions: text, answers [{ text, isCorrect }], bibleReference
// Ten questions climb from easy to expert. "Easy" for someone scrolling means a well-known story, so the
// level of a question comes from how well-known its book is plus the quiz's own difficulty.
import { locale } from './locales.mjs';

// Well-known books (Dutch + English names as the platforms spell them): the easy and medium questions.
const FAMOUS = new Set(['Genesis', 'Exodus', 'Jozua', 'Joshua', 'Richteren', 'Judges', 'Ruth', '1 Samuël', '1 Samuel', '2 Samuël', '2 Samuel', 'Esther', 'Daniël', 'Daniel', 'Jona', 'Jonah',
  'Matteüs', 'Mattheüs', 'Matthew', 'Marcus', 'Markus', 'Mark', 'Lucas', 'Lukas', 'Luke', 'Johannes', 'John', 'Handelingen', 'Acts', '1 Koningen', '1 Kings', 'Psalmen', 'Psalms']);
const GOSPELS = new Set(['Matteüs', 'Mattheüs', 'Matthew', 'Marcus', 'Markus', 'Mark', 'Lucas', 'Lukas', 'Luke', 'Johannes', 'John']);
// A question that only makes sense next to the reading, or an answer that is not a real choice.
const NEEDS_CONTEXT = /\b(dit|deze|dat|het gelezen|bovenstaande?)\s+(gedeelte|hoofdstuk|tekst|passage|vers|verzen|quiz|psalm|gezang|lied|gebed|verhaal|voedsel|visioen|gelijkenis)|\bvers(en)? \d|hierboven|\bthis (passage|chapter|text|quiz|psalm|song|prayer|story|vision|parable)\b|\bverses? \d|\babove\b|\bgelezen\b/i;
// Chapters with the stories most people know (book name as the platform spells it -> chapters): the easy questions.
const FAMOUS_CHAPTERS = {
  Genesis: [1, 2, 3, 4, 6, 7, 8, 9, 11, 12, 17, 22, 25, 27, 37, 39, 41, 45], Exodus: [1, 2, 3, 7, 8, 9, 10, 11, 12, 14, 16, 20, 32],
  Jozua: [2, 6], Joshua: [2, 6], Richteren: [6, 7, 13, 14, 15, 16], Judges: [6, 7, 13, 14, 15, 16], Ruth: [1, 2, 3, 4],
  '1 Samuël': [1, 3, 16, 17], '1 Samuel': [1, 3, 16, 17], '2 Samuël': [11, 12], '2 Samuel': [11, 12], '1 Koningen': [3, 17, 18, 19], '1 Kings': [3, 17, 18, 19],
  Daniël: [1, 2, 3, 5, 6], Daniel: [1, 2, 3, 5, 6], Jona: [1, 2, 3, 4], Jonah: [1, 2, 3, 4], Esther: [2, 4, 5, 7], Psalmen: [23], Psalms: [23],
  Matteüs: [1, 2, 4, 5, 6, 14, 26, 27, 28], Mattheüs: [1, 2, 4, 5, 6, 14, 26, 27, 28], Matthew: [1, 2, 4, 5, 6, 14, 26, 27, 28],
  Marcus: [1, 4, 6, 16], Markus: [1, 4, 6, 16], Mark: [1, 4, 6, 16], Lucas: [1, 2, 10, 15, 19, 23, 24], Lukas: [1, 2, 10, 15, 19, 23, 24], Luke: [1, 2, 10, 15, 19, 23, 24],
  Johannes: [1, 2, 3, 6, 11, 19, 20, 21], John: [1, 2, 3, 6, 11, 19, 20, 21], Handelingen: [1, 2, 9, 16, 27], Acts: [1, 2, 9, 16, 27],
};
const famousChapter = q => (FAMOUS_CHAPTERS[q.passage?.book] || []).includes(q.passage?.chapter);
const NOT_A_CHOICE = /^(alle|geen) (van )?(de )?(bovenstaande|antwoorden)|^(all|none) of the (above|answers)|^beide|^both\b/i;

export const THEMES = ['mixed', 'book', 'nt', 'book', 'mixed', 'ot', 'gospels', 'book'];
const LEVELS = ['easy', 'easy', 'easy', 'medium', 'medium', 'medium', 'hard', 'hard', 'hard', 'expert'];

/** A small seeded random generator, so the same seed always makes the same video. */
export function rng(seed) {
  let h = 2166136261; for (const c of String(seed)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const shuffle = (a, r) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

/** Usable on screen: short enough, 3-4 real answers, exactly one right. */
export function usable(q) {
  const a = q.answers || []; const right = a.filter(x => x.isCorrect);
  return q.text && q.text.length >= 12 && q.text.length <= 118 && !NEEDS_CONTEXT.test(q.text)
    && a.length >= 3 && a.length <= 4 && right.length === 1
    && a.every(x => x.text && x.text.trim().length >= 1 && x.text.length <= 34 && !NOT_A_CHOICE.test(x.text.trim()));
}

const testament = c => { const s = `${c?.slug || ''} ${c?.name || ''}`.toLowerCase(); return /oud|old/.test(s) ? 'ot' : /nieuw|new/.test(s) ? 'nt' : null; };

/** Which quizzes a theme draws from, and its title. */
export function themePool(theme, catalogue, r) {
  const live = catalogue.filter(q => q.questionCount > 0 && q.isActive !== false);
  if (theme === 'book') {
    const byBook = new Map();
    for (const q of live) { const b = q.passage?.book; if (b) byBook.set(b, [...(byBook.get(b) || []), q]); }
    // books with enough quizzes; well-known books three times as likely
    // well-known books only (a video of ten Kronieken details loses everyone), with enough quizzes
    const books = [...byBook.entries()].filter(([b, qs]) => qs.length >= 4 && FAMOUS_CHAPTERS[b]);
    if (!books.length) return null;
    const weighted = books.flatMap(([b, qs]) => qs.some(famousChapter) ? [b, b] : [b]);
    const book = weighted[Math.floor(r() * weighted.length)];
    return { theme, book, quizzes: byBook.get(book) };
  }
  if (theme === 'ot' || theme === 'nt') { const qs = live.filter(q => testament(q.category) === theme); return qs.length >= 8 ? { theme, quizzes: qs } : null; }
  if (theme === 'gospels') { const qs = live.filter(q => GOSPELS.has(q.passage?.book)); return qs.length >= 6 ? { theme, quizzes: qs } : null; }
  return { theme: 'mixed', quizzes: live };
}

/** How well a quiz fits a level (higher = better). */
function fitness(level, quiz) {
  const story = famousChapter(quiz), famous = FAMOUS.has(quiz.passage?.book); const d = quiz.difficulty || 'medium';
  const diff = { easy: 0, medium: 1, hard: 2 }[d] ?? 1;
  if (level === 'easy') return (story ? 10 : 0) + (famous ? 2 : 0) - diff;
  if (level === 'medium') return (story ? 5 : 0) + (famous ? 4 : 0) - Math.abs(diff - 1);
  if (level === 'hard') return (story ? 0 : 3) + (famous ? 2 : 0) + diff;
  return (story ? -4 : 2) + (famous ? 0 : 2) + 2 * diff;
}

/** Ten questions for a theme, climbing in level; fewer when the theme runs out of new ones. */
async function pick(pool, { r, used, quizOf }) {
  const inBook = pool.theme === 'book';
  const chosen = []; const fromQuiz = new Map(); const texts = new Set();
  const maxPerQuiz = inBook ? 3 : 1;
  for (const level of LEVELS) {
    // the best-fitting quizzes for this level first, shuffled within the same fitness
    const ranked = shuffle(pool.quizzes, r).map(q => ({ q, f: fitness(level, q) + r() * .5 })).sort((a, b) => b.f - a.f);
    let got = null;
    for (const { q } of ranked.slice(0, 30)) {
      if ((fromQuiz.get(q.id) || 0) >= maxPerQuiz) continue;
      const full = await quizOf(q); if (!full?.questions?.length) continue;
      let cands = full.questions.filter(x => usable(x) && !used.has(String(x.id)) && !texts.has(x.text.trim().toLowerCase()));
      if (level === 'easy' || level === 'medium') cands = cands.sort((a, b) => a.text.length - b.text.length).slice(0, level === 'easy' ? 3 : 5);   // the short, direct ones
      if (!cands.length) continue;
      got = { quiz: full, card: q, x: cands[Math.floor(r() * cands.length)] }; break;
    }
    if (!got) continue;
    fromQuiz.set(got.card.id, (fromQuiz.get(got.card.id) || 0) + 1); texts.add(got.x.text.trim().toLowerCase());
    const answers = shuffle(got.x.answers, r);
    const correct = answers.findIndex(a => a.isCorrect);
    chosen.push({
      qid: String(got.x.id), text: got.x.text.trim(), ref: got.quiz.passage?.label || got.card.passage?.label || undefined,
      answers: answers.map(a => a.text.trim()), correct, level, label: answers[correct].text.trim(), quiz: got.card.slug,
    });
  }
  return chosen;
}

/**
 * Make one spec.
 *   project   loaded project (name, web, platforms, timezone, quizrun { lang, api })
 *   catalogue the platform's quiz list; fetchQuiz(id) -> one quiz with questions
 *   used      Set of question ids that went out before on this channel (never twice)
 *   n         how many videos this channel made before (picks the theme), seed: any string
 */
export async function makeSpec({ project: P, catalogue, fetchQuiz, used = new Set(), n = 0, seed, id, week, slot, recentThemes = [] }) {
  const cfg = P.quizrun || {}; const lang = cfg.lang || P.language || 'nl'; const S = locale(lang);
  const r = rng(seed || id);
  const cache = new Map();
  const quizOf = async q => { if (!cache.has(q.id)) cache.set(q.id, await fetchQuiz(q.id).catch(() => null)); return cache.get(q.id); };
  // theme: the rotation, never the same book as the last few videos; a theme without enough new questions
  // gives way to the next one
  let pool = null, chosen = null; const tried = [];
  for (let k = 0; k <= THEMES.length && !chosen; k++) {
    const p = k < THEMES.length ? themePool(THEMES[(n + k) % THEMES.length], catalogue, r) : themePool('mixed', catalogue, r);
    if (!p || (p.book && recentThemes.includes(`book:${p.book}`))) continue;
    const got = await pick(p, { r, used, quizOf });
    tried.push(`${p.theme}${p.book ? `:${p.book}` : ''}=${got.length}`);
    if (got.length >= 8) { pool = p; chosen = got; }
  }
  if (!chosen) throw new Error(`not enough usable new questions (${tried.join(', ')})`);
  // when fewer than 10, keep the climb: the last one is still the expert question
  if (chosen.length < 10) chosen[chosen.length - 1].level = 'expert';

  const title = pool.theme === 'book' ? S.titles.book(pool.book) : S.titles[pool.theme];
  const themeLine = pool.theme === 'book' ? S.themeLine.book(pool.book) : S.themeLine[pool.theme];
  const k = chosen.length;
  const cheers = S.cheers.map(c => ({ ...c, title: c.title.replace(/\b5\b/, m => String(Math.min(+m, k - 1))), after: Math.min(c.after, k - 1) }));
  const bookTag = pool.book ? `#${pool.book.toLowerCase().normalize('NFD').replace(/[^\p{L}\p{N}]/gu, '')}` : null;
  return {
    id, week, slot, kind: 'reel-quizrun', lang,
    platforms: [...P.platforms],
    caption: S.caption({ theme: themeLine, web: P.web, n: k }),
    hashtags: [...S.hashtags, ...(bookTag && /^#[\p{L}\p{N}_]+$/u.test(bookTag) ? [bookTag] : [])].slice(0, 8),
    basedOn: `Echte vragen uit ${P.web}: ${[...new Set(chosen.map(c => c.quiz))].slice(0, 6).join(', ')}`.slice(0, 300),
    subject: (pool.theme === 'book' ? `Quiz: ${pool.book}` : `Quiz: ${pool.theme}`).slice(0, 60),
    experiment: { note: `quizrun theme=${pool.theme}${pool.book ? ` book=${pool.book}` : ''}` },
    music: cfg.music || 'upbeat',
    title, timer: cfg.timer || 6,
    questions: chosen.map(({ quiz, ...q }) => q),
    ui: {
      levels: S.levels, cheers, score: S.score,
      end: { headline: S.end.headline, button: S.end.button, web: P.web, stores: !!S.end.stores && (P.endCard?.stores || []).length > 0 },
    },
    _theme: pool.book ? `book:${pool.book}` : pool.theme,
  };
}

/** The platform's API: the catalogue and one quiz (Node 22 fetch; follows bijbelquiz.com -> www). */
export function platformApi(api) {
  const get = async url => { const r = await fetch(url, { headers: { 'user-agent': 'marketing-engine (quizrun)' } }); if (!r.ok) throw new Error(`${url}: ${r.status}`); return r.json(); };
  return {
    catalogue: async () => { const d = await get(api); return Array.isArray(d) ? d : d.quizzes || []; },
    fetchQuiz: id => get(`${api}/${encodeURIComponent(id)}`),
  };
}
