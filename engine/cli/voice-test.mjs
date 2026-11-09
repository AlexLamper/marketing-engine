// Voice test (9 Nov, Alex: questions did not rise at the end, "dengenen" misspoken): voices the same few
// lines with several models/settings, uploads each take and prints a speech-to-text transcript, so takes
// can be compared (pitch at the end of a question, how a word was heard) before the engine changes.
// Run through the Samples workflow with filter "voice-test" (render-samples.mjs hands over to this file).
// Costs about 200 ElevenLabs characters per variant.
import '../env.mjs';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { project } from '../project.mjs';
import { resolveVoice } from '../tts/index.mjs';
import { upload } from '../storage/index.mjs';

const Q = 'Als God alles al weet, waarom zou je dan nog bidden?';
const ASK = 'Wanneer heb jij voor het laatst iets aan je Vader gevraagd?';
const V = w => `Hoeveel te meer zal uw Vader, Die in de hemelen is, goede gaven geven ${w}, die ze van Hem bidden!`;
const v2 = { stability: 0.55, similarity_boost: 0.8, style: 0.15, use_speaker_boost: true };
const v3n = { stability: 0.5, similarity_boost: 0.8, use_speaker_boost: true };
// Round 2 (only the two questions): audio tags and punctuation, since no model/setting rose by itself.
const ROUND2 = [
  ['v3-curious', 'eleven_v3', v3n, null, ['[curious] ' + Q, '[curious] ' + ASK]],
  ['v3-wondering', 'eleven_v3', v3n, null, ['[wondering] ' + Q, '[wondering] ' + ASK]],
  ['v3-qq', 'eleven_v3', v3n, null, [Q + '?', ASK + '?']],
  ['v2-qq', 'eleven_multilingual_v2', v2, null, [Q + '?', ASK + '?']],
];
const ROUND1 = [
  ['v2-now', 'eleven_multilingual_v2', v2, 'dengenen'],
  ['v2-now-alias', 'eleven_multilingual_v2', v2, 'den-genen'],
  ['v2-loose', 'eleven_multilingual_v2', { stability: 0.35, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true }, 'den-genen'],
  ['v3-natural', 'eleven_v3', { stability: 0.5, similarity_boost: 0.8, use_speaker_boost: true }, 'den-genen'],
  ['v3-robust', 'eleven_v3', { stability: 1.0, similarity_boost: 0.8, use_speaker_boost: true }, 'den-genen'],
];

export async function voiceTest(voiceKey = 'male', round = '2') {
  const VARIANTS = round === '1' ? ROUND1 : ROUND2;
  const key = process.env.ELEVENLABS_API_KEY; if (!key) throw new Error('no ELEVENLABS_API_KEY');
  const voice = resolveVoice(voiceKey); const stamp = Date.now();
  for (const [name, model, settings, word, lines] of VARIANTS) {
    const text = (lines || [Q, V(word), ASK]).join('\n\n');
    const body = { text, model_id: model, voice_settings: settings, seed: 11 };
    if (!model.startsWith('eleven_multilingual_v2')) body.language_code = 'nl';
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice.id}?output_format=mp3_44100_128`, {
      method: 'POST', headers: { 'xi-api-key': key, 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok) { console.log(`${name}: ElevenLabs ${r.status} ${(await r.text()).slice(0, 200)}`); continue; }
    const audio = Buffer.from(await r.arrayBuffer()); const file = join(tmpdir(), `vt-${name}.mp3`); writeFileSync(file, audio);
    console.log(`${name}: ${await upload(file, `${project().id}/samples/voice-test/${stamp}-${name}.mp3`)}`);
    try {
      const fd = new FormData(); fd.append('model_id', 'scribe_v1'); fd.append('language_code', 'nld');
      fd.append('file', new Blob([audio], { type: 'audio/mpeg' }), `${name}.mp3`);
      const s = await fetch('https://api.elevenlabs.io/v1/speech-to-text', { method: 'POST', headers: { 'xi-api-key': key }, body: fd });
      console.log(`${name} heard: ${s.ok ? (await s.json()).text : `STT ${s.status} ${(await s.text()).slice(0, 120)}`}`);
    } catch (e) { console.log(`${name} heard: STT failed ${e.message}`); }
  }
}
