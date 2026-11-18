# Lessen - wat Alex wil

Alex' feedback als vaste regels, zodat elke video beter is dan de vorige en geen fout twee keer gebeurt.
De planner en revise lezen dit bij elke run eerst en controleren elk item tegen elke regel
(`planner/PLAN.md` stap 1b en 3b). Nieuwe opmerkingen uit de studio komen er automatisch bij; feedback
uit een chat met Claude zet Claude er meteen in. Een nieuwere opmerking die een oudere tegenspreekt,
wint: dan wordt de regel herschreven. Een regel verdwijnt alleen als Alex hem vervangt.

Vorm: `- Regel. (Alex, <datum>: "<zijn woorden>"; <item>)`

## Wat we maken

- Quiz-run video's (`reel-quizrun`): tien echte vragen van het platform, van makkelijk naar expert, met timer en antwoordlijst. Alex kijkt ze nooit na: ze worden vanzelf gemaakt, goedgekeurd en geplaatst (`quizrun.autoPublish`); hij geeft af en toe feedback. (Alex, 16 nov: "I don't want to EVER check the video's myself")

## Verhaal en script

## Stem en geluid

## Beeld

- Rustig en simpel, niet druk: effen papieren achtergrond (geen stippen), geen stuiterende of verende animaties (alleen rustig in- en uitfaden), antwoordknoppen zoals op de site (alleen de tekst, geen letterblokjes), geen handje dat tikt, één tussenmoment (volgen) in plaats van twee, geen extra labels naast de antwoordlijst. (Alex, 16 nov: "maak hem iets minder 'druk' en houdt het simpel"; sample-quizrun-nl)

## Overgangen en tempo

- Kijkers krijgen genoeg tijd: 6 seconden denktijd per vraag (was 4,5; een hele seconde-telling van 6 naar 1). (Alex, 16 nov: "de gebruiker iets meer tijd geven? een seconde of zo"; sample-quizrun-nl)

## Tekst en kleuren

## Einde en CTA

## Plaatsen

- Geen TikTok voor BijbelQuiz: alleen Instagram, Facebook en YouTube (`project.json` platforms). (Alex, 18 nov: TikTok overslaan)

## Nog op te lossen in de engine

Feedback die geen spec kan oplossen (templates, geluid, beweging). De planner zet het hier en Alex krijgt
er een bericht over; Claude verplaatst het naar "Opgelost" met de commit zodra het in de engine zit.

- (niets open)

## Opgelost in de engine (niet terugdraaien)

Wie een template of `render.mjs` aanpast, leest dit eerst en maakt niets hiervan ongedaan.

- Quiz-run minder druk en meer denktijd (Alex, 16 nov): `engine/render/templates/quizrun.js` zonder stippenraster, schaduw onder de titel, verende animaties, letterblokjes, tikkend handje en niveaulabels in de lijst; één tussenmoment (`engine/quizrun/locales.mjs`); minder geluidjes (geen whoosh, zachtere tikken); timer 6 s (`project.json` quizrun.timer).
