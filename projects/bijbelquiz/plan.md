# BijbelQuiz - weekly recipe and rules

Read together with `planner/PLAN.md` (the steps). Where this file is more specific, it wins.
Paths here (`brand/`, `content/`) are inside this project folder.

## Report sections
- **Wat werkte** - top 3 items with numbers
- **Wat niet** - bottom 3 and the likely reason
- **Groei** - followers and new signups vs the week before
- **Volgende week** - what you change and why

## Weekly recipe (start small, grow with the data)

| What | How many | Slot | Platforms |
|---|---|---|---|
| TODO e.g. `reel-demo` | 3 | 19:30 Mon, Wed, Fri | instagram, facebook, tiktok, youtube |
| TODO e.g. `post-statement` | 2 | 12:00 Tue, Thu | instagram, facebook |

## Rules
- Hook first: the first line must stop the scroll in under 2 seconds.
- Every reel ends with the end card; set `endCard.headline` to the benefit of that reel (max ~30 chars).
- Captions: language and voice from `brand/voice-and-rules.md`; end with one clear next step ("Download BijbelQuiz gratis").
- `basedOn`: the real fact or feature from `brand/product.md` the item rests on.

## Quality bar (this project, on top of `planner/PLAN.md` 3b)

- Audience: 20-35 year old Dutch Christians who love the Bible; the content goes out under the BijbelStudie name.
- **Bible facts:** every Bible fact must be checkable in the text. Before you use a reference, check it with
  `node engine/cli/verse.mjs "<Boek> <hoofdstuk>:<vers>[-<vers>]"` (prints the exact Statenvertaling verses and
  says when one was used; give only `"<Boek> <hoofdstuk>"` for a whole chapter) - never quote or cite from memory.
  Read only the verses you need, not whole chapter files. Background (dates, places, customs) only when broadly
  accepted. No denominational disputes.
- **Spread** books, persons, Old and New Testament over the days.
