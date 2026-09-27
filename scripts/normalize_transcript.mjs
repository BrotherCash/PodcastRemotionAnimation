#!/usr/bin/env node
/**
 * Converts the raw word+speaker JSON produced by transcribe_diarize.py into:
 *   1. public/data/<episodeId>.captions.json - Caption[] for @remotion/captions
 *   2. public/data/<episodeId>.transcript.md  - compact speaker-labeled transcript,
 *      meant to be read by the "Transcript-First" scene-generation step (a Claude
 *      Code task that turns this into <episodeId>.scenes.json - see README.md).
 *   3. public/data/<episodeId>.turns.json     - {speaker,startMs,endMs}[], one entry
 *      per continuous speaker turn. Drives per-turn (not per-scene) active-speaker
 *      highlighting in HostsRow - much finer-grained than the 15-30s scenes.
 *
 * Usage:
 *   node scripts/normalize_transcript.mjs <raw.json> <episodeId> \
 *     [--speaker-map SPEAKER_00=host1,SPEAKER_01=host2] [--out-dir public/data]
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith("--"));
if (positional.length < 2) {
  console.error(
    "Usage: node normalize_transcript.mjs <raw_whisperx.json> <episodeId> " +
      "[--speaker-map SPEAKER_00=host1,SPEAKER_01=host2] [--out-dir public/data]",
  );
  process.exit(1);
}

const [rawPath, episodeId] = positional;
const speakerMapArg = args.find((a) => a.startsWith("--speaker-map="))?.split("=")[1];
const outDir = args.find((a) => a.startsWith("--out-dir="))?.split("=")[1] ?? "public/data";

const raw = JSON.parse(readFileSync(rawPath, "utf-8"));

const explicitMap = new Map();
if (speakerMapArg) {
  for (const pair of speakerMapArg.split(",")) {
    const [from, to] = pair.split("=");
    explicitMap.set(from, to);
  }
}

// Falls back to "first speaker heard -> host1, second -> host2" when no
// --speaker-map is given. Diarization doesn't know which voice is which
// host, so pass --speaker-map once you've listened and know the mapping.
const seenSpeakers = [];
const mapSpeaker = (rawSpeaker) => {
  if (explicitMap.has(rawSpeaker)) return explicitMap.get(rawSpeaker);
  if (!seenSpeakers.includes(rawSpeaker)) seenSpeakers.push(rawSpeaker);
  const index = seenSpeakers.indexOf(rawSpeaker);
  return index === 0 ? "host1" : index === 1 ? "host2" : `host${index + 1}`;
};

const withTrailingSpace = (text) => (text.endsWith(" ") ? text : `${text} `);
// createTikTokStyleCaptions only checks for a page break *before* a token
// whose text starts with a space (see its source) - so captions need a
// LEADING space, not a trailing one, or every word silently gets glued
// into a single giant page.
const withLeadingSpace = (text) => (text.startsWith(" ") ? text : ` ${text}`);

// 1. Captions for @remotion/captions
const SENTENCE_END = /[.!?…]$/;
const captions = raw.map((word, i) => {
  const next = raw[i + 1];
  const pageBreakAfter = SENTENCE_END.test(word.text.trim()) && (!next || next.startMs - word.endMs > 400);
  return {
    text: i === 0 ? word.text : withLeadingSpace(word.text),
    startMs: word.startMs,
    endMs: word.endMs,
    timestampMs: word.startMs,
    confidence: null,
    ...(pageBreakAfter ? { pageBreakAfter: true } : {}),
  };
});

// 2. Compact speaker-labeled transcript for the scene-generation step
const formatTimestamp = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const MAX_GAP_MS = 2000; // pause longer than this starts a new turn even for the same speaker
const turns = [];
for (const word of raw) {
  const speaker = mapSpeaker(word.speaker);
  const last = turns[turns.length - 1];
  if (last && last.speaker === speaker && word.startMs - last.endMs < MAX_GAP_MS) {
    last.text += withTrailingSpace(word.text);
    last.endMs = word.endMs;
  } else {
    turns.push({ speaker, startMs: word.startMs, endMs: word.endMs, text: withTrailingSpace(word.text) });
  }
}

const transcriptMd = turns.map((t) => `[${formatTimestamp(t.startMs)}] ${t.speaker}: ${t.text.trim()}`).join("\n");
const turnsJson = turns.map(({ speaker, startMs, endMs }) => ({ speaker, startMs, endMs }));

writeFileSync(path.join(outDir, `${episodeId}.captions.json`), JSON.stringify(captions, null, 2));
writeFileSync(path.join(outDir, `${episodeId}.transcript.md`), transcriptMd);
writeFileSync(path.join(outDir, `${episodeId}.turns.json`), JSON.stringify(turnsJson, null, 2));

console.log(`Wrote ${captions.length} captions and ${turns.length} speaker turns for episode "${episodeId}"`);
console.log(`-> ${path.join(outDir, `${episodeId}.captions.json`)}`);
console.log(`-> ${path.join(outDir, `${episodeId}.transcript.md`)}`);
console.log(`-> ${path.join(outDir, `${episodeId}.turns.json`)}`);
