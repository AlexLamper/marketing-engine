// Make a quiz-run spec from the live platform without a database (to look at, or as a sample):
//   PROJECT=bijbelquiz node engine/cli/quizrun-sample.mjs out.json [n] [seed]
import '../env.mjs';
import { writeFileSync } from 'node:fs';
import { project } from '../project.mjs';
import { makeSpec, platformApi } from '../quizrun/make.mjs';
import { localDate, isoWeekOf, isoWithOffset } from '../slots.mjs';

const P = project(); const [out = 'quizrun-sample.json', n = '0', seed = 'sample'] = process.argv.slice(2);
const api = platformApi(P.quizrun.api); const tz = P.timezone || 'Europe/Amsterdam';
const spec = await makeSpec({ project: P, catalogue: await api.catalogue(), fetchQuiz: api.fetchQuiz, n: +n, seed,
  id: `sample-quizrun-${P.quizrun.lang}-${n}`, week: isoWeekOf(localDate(new Date(), tz)), slot: isoWithOffset(new Date(), tz) });
delete spec._theme;
writeFileSync(out, JSON.stringify(spec, null, 2) + '\n');
console.log(`${out}: ${spec.title.pre} ${spec.title.hi} - ${spec.questions.length} questions`);
