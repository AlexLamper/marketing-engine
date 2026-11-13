// Print exact Statenvertaling verses for one or more references, so the planner checks a fact without
// reading a whole chapter file (fewer tokens and turns). Also says when a verse already went out.
//   node engine/cli/verse.mjs "1 Koningen 17:1-6" "Johannes 3:16"
//   node engine/cli/verse.mjs "Psalmen 23"          (a whole chapter: give no verse numbers)
import { getVerse, isUsed } from '../verses.mjs';

const refs = process.argv.slice(2);
if (!refs.length) { console.log('usage: node engine/cli/verse.mjs "<Boek> <hoofdstuk>:<vers>[-<vers>]" ...'); process.exit(1); }
let bad = 0;
for (const raw of refs) {
  try {
    // a whole chapter: try verse 1 up to the last one that exists
    let ref = raw;
    if (!/:\d/.test(raw)) {
      let n = 1; while (n < 200) { try { getVerse(`${raw}:${n + 1}`); n++; } catch { break; } }
      ref = `${raw}:1-${n}`;
    }
    const v = getVerse(ref);
    let used = false; try { used = isUsed(v.ref); } catch { /* no project ledger here */ }
    console.log(`${v.ref}${used ? '  [AL GEBRUIKT - kies een ander vers]' : ''}`);
    for (const x of v.verses) console.log(`${x.n} ${x.text}`);
  } catch (e) { bad++; console.log(`FAIL ${raw}: ${e.message}`); }
}
process.exit(bad ? 1 : 0);
