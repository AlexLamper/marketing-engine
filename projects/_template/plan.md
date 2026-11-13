# {{name}} - recipe and rules

Read together with `planner/PLAN.md` (the steps). Where this file is more specific, it wins.
Paths here (`brand/`, `content/`) are inside this project folder.

## Report sections (Mondays, about last week)
- **Wat werkte** - top 3 items with numbers and why you think they worked
- **Wat niet** - bottom 3 and the likely reason
- **Experimenten** - per trait the leader and the laggard with n (say when n is still too small)
- **Groei** - followers and new signups vs the week before
- **Volgende week** - what you change and why (one line per change)

## Quality bar (this project, on top of `planner/PLAN.md` 3b)
- Audience: TODO who the app is for (age, situation, the problem they have) - also in `brand/voice-and-rules.md`.
- Product facts only from `brand/product.md`; every screen you show must really show what the line says
  (`assets/screenshots/screens.json` says what each screenshot shows).
- Spread over the days: problem, feature, result, tip and story items; never two items about the same feature in a row.

## Recipe (per day)

The planner plans the days in `content/context/target-week.json` (usually 3 per run); this is per day.
`project.json` `recipe.reelsPerDay` caps the reels a day, the voice budget (`allocation.json`) decides how many.

| What | Per day | Platforms |
|---|---|---|
| Reels (`formatsAllowed` in project.json) | 1 (`recipe.reelsPerDay`) | instagram, facebook, tiktok, youtube |

App formats that work for any app (the engine has templates for all of them):
- `reel-demo` - hook + 2-5 app screens with a short caption each ("zo werkt het"). Best for features.
- `reel-kinetic` - big words line by line, optionally voiced. Best for POV, problem, relief ("POV: je weet weer niet ...").
- `reel-list` - "3 dingen die ..." tips, one item per beat, optionally with a screen per item.
- `reel-explainer` - one voice explains a problem and the app's answer, with screens.
Ids: `<idPrefix>-demo`, `-pov`, `-list`, `-uitleg` (`-b` for a second of the same).

## Rules
- Hook first: the first line must stop the scroll in under 2 seconds and the reel pays it off.
- Every reel ends with the end card; set `endCard.headline` to the benefit of that reel (max ~30 chars).
- Captions: language and voice from `brand/voice-and-rules.md`; end with one clear next step ("Download {{name}} gratis").
- `basedOn`: the real fact or feature from `brand/product.md` the item rests on.
- `experiment.hook` and `experiment.topic`: the app values (hooks: pijnpunt, waardebelofte, verrassing, vraag,
  herkenning, pov, voor-na, opluchting; topics: probleem, functie, resultaat, vergelijking, tip, verhaal, app, praktisch).

## No repeats
`subject` not within 12 weeks, no near-identical hook within 26 weeks (the validator checks `history.json`).
