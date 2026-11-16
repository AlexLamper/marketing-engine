// Every word a quiz-run video and its caption show, per language. No model writes these: the video
// is made from the platform's own questions plus these strings (engine/quizrun/make.mjs).
// Add a language: copy "en", translate, and give the project "quizrun": { "lang": "<code>" }.
// Plain hyphen only, never a long dash.

const L = {
  nl: {
    levels: { easy: 'Makkelijk', medium: 'Gemiddeld', hard: 'Moeilijk', expert: 'Expert' },
    titles: {
      mixed: { pre: 'Hoe goed ken jij', hi: 'de Bijbel?' },
      book: b => ({ pre: '10 vragen over', hi: b }),
      ot: { pre: 'Hoe goed ken jij', hi: 'het Oude Testament?' },
      nt: { pre: 'Hoe goed ken jij', hi: 'het Nieuwe Testament?' },
      gospels: { pre: 'Hoe goed ken jij', hi: 'Jezus?' },
    },
    cheers: [
      { after: 5, title: 'Alle 5 goed?', sub: 'Volg voor elke dag een quiz', button: 'Volgen', icon: 'follow' },
    ],
    score: { title: 'Hoeveel had jij goed?', sub: 'Zet je score in de reacties' },
    end: { headline: 'Speel elke dag nieuwe bijbelquizzen', button: 'Speel gratis', stores: true },
    caption: ({ theme, web, n }) => [
      `Hoeveel van deze ${n} bijbelvragen weet jij? ${theme}`,
      'Zet je score in de reacties en daag een vriend uit!',
      `Speel elke dag nieuwe bijbelquizzen, gratis op ${web} of in de BijbelQuiz-app.`,
    ].join('\n\n'),
    themeLine: { mixed: 'Van makkelijk tot expert.', book: b => `Alles over ${b}.`, ot: 'Over het Oude Testament.', nt: 'Over het Nieuwe Testament.', gospels: 'Over het leven van Jezus.' },
    hashtags: ['#bijbelquiz', '#bijbel', '#quiz', '#bijbelkennis', '#christelijk', '#geloof'],
  },
  en: {
    levels: { easy: 'Easy', medium: 'Medium', hard: 'Hard', expert: 'Expert' },
    titles: {
      mixed: { pre: 'How well do you', hi: 'know the Bible?' },
      book: b => ({ pre: '10 questions on', hi: b }),
      ot: { pre: 'How well do you know', hi: 'the Old Testament?' },
      nt: { pre: 'How well do you know', hi: 'the New Testament?' },
      gospels: { pre: 'How well do you', hi: 'know Jesus?' },
    },
    cheers: [
      { after: 5, title: 'All 5 right?', sub: 'Follow for a quiz every day', button: 'Follow', icon: 'follow' },
    ],
    score: { title: 'What was your score?', sub: 'Tell us in the comments' },
    end: { headline: 'Play new Bible quizzes every day', button: 'Play free', stores: false },
    caption: ({ theme, web, n }) => [
      `How many of these ${n} Bible questions can you answer? ${theme}`,
      'Drop your score in the comments and challenge a friend!',
      `New Bible quizzes every day, free at ${web}.`,
    ].join('\n\n'),
    themeLine: { mixed: 'From easy to expert.', book: b => `All about ${b}.`, ot: 'On the Old Testament.', nt: 'On the New Testament.', gospels: 'On the life of Jesus.' },
    hashtags: ['#biblequiz', '#bible', '#quiz', '#bibletrivia', '#christian', '#faith'],
  },
};

export function locale(lang) {
  const l = L[lang] || L[String(lang).slice(0, 2)];
  if (!l) throw new Error(`No quiz-run strings for language "${lang}" - add them in engine/quizrun/locales.mjs`);
  return l;
}
export const LANGS = Object.keys(L);
