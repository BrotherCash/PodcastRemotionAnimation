# Podcast → video: preprocessing pipeline

Turns a raw podcast recording into the two JSON files the Remotion
composition consumes (`src/Composition.tsx` fetches them by
`scenesUrl`/`captionsUrl` and validates them against `src/schema.ts`).

## 0. One-time setup

```bash
cd scripts
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate
pip install -r requirements.txt
```

Diarization needs a free Hugging Face token with these model licenses
accepted (click "Agree" on each page while logged in). The exact gated
model depends on your installed `pyannote-audio` version - as of this
writing (`pyannote-audio` 4.x) it's `speaker-diarization-community-1`,
which the script only discovers at runtime (a 403 error names the exact
repo to accept). Accept all of these up front to avoid a mid-run stop:

- https://huggingface.co/pyannote/speaker-diarization-3.1
- https://huggingface.co/pyannote/speaker-diarization-community-1
- https://huggingface.co/pyannote/segmentation-3.0

Then create a token (read-only is enough) at
https://huggingface.co/settings/tokens.

To use it without setting any system-wide environment variable, save it
into a local, git-ignored file:

```bash
echo hf_xxx > scripts/.hf_token
```

(or pass `--hf-token hf_xxx` on the command line each time, or
`export HF_TOKEN=hf_xxx` for just the current shell session - the script
checks `--hf-token`, then `HF_TOKEN`, then `scripts/.hf_token`, in that
order).

## 1. Transcribe + diarize

```bash
# Windows: work around a real PyTorch/OpenMP segfault (hit this - not
# optional on Windows). Also lower --batch-size if you hit
# "mkl_malloc: failed to allocate memory" (16 needs ~16GB free RAM; 4 is
# safe on most laptops).
KMP_DUPLICATE_LIB_OK=TRUE OMP_NUM_THREADS=1 python scripts/transcribe_diarize.py \
  path/to/episode.mp3 scripts/out/episode01.raw.json --batch-size 4
```

Model download (large-v3, ~3GB) can crawl over plain HTTP on some
networks - `pip install hf_xet` once, beforehand, to pull it over the
much faster Xet protocol instead (no code change needed, huggingface_hub
picks it up automatically if installed).

Outputs a flat list of words with speaker labels (`SPEAKER_00`,
`SPEAKER_01`, ...). Diarization on cross-talk/overlapping speech is
imperfect - skim the output before moving on, especially near speaker
changes.

## 2. Normalize

```bash
node scripts/normalize_transcript.mjs scripts/out/episode01.raw.json episode01 \
  --speaker-map SPEAKER_00=host1,SPEAKER_01=host2
```

`--speaker-map` assigns pyannote's arbitrary labels to `host1`/`host2` -
listen to the start of the recording once to know which is which. Omit it
and the first speaker heard is assumed to be `host1`.

Writes:

- `public/data/episode01.captions.json` - word-level `Caption[]`
- `public/data/episode01.transcript.md` - compact speaker-labeled transcript,
  e.g. `[00:12] host1: Привет и добро пожаловать...`
- `public/data/episode01.turns.json` - `{speaker,startMs,endMs}[]`, one per
  continuous speaker turn. This is what drives the active-speaker
  highlight/brightness in `HostsRow.tsx` (much finer-grained than the
  15-30s scenes) - pass its path as `turnsUrl` in step 4.

## 3. Generate scenes (Claude Code task)

Ask Claude Code to read `public/data/episode01.transcript.md` and write
`public/data/episode01.scenes.json`, segmenting the conversation into
15-30s topic chunks. The schema (enforced at runtime by
`scenesFileSchema` in `src/schema.ts`):

```ts
type Scene = {
  sceneId: string;
  startMs: number;
  endMs: number;
  activeSpeaker: "host1" | "host2" | "both";
  slide: {
    title: string;
    bullets: string[];
    icon: string; // a lucide-react icon component name, e.g. "Rocket"
  };
};
```

Scenes must cover the whole episode with no gaps or overlaps
(`scenes[i].endMs === scenes[i + 1].startMs`). See
`public/data/sample.scenes.json` for a worked example.

This step is intentionally manual/human-reviewed at first - once the
prompt and schema are proven for a few episodes, it can be scripted with
`@anthropic-ai/sdk`.

## 4. Place the audio and render

Copy the episode audio into `public/audio/episode01.mp3`, then either:

- Add a new `<Composition>` in `src/Composition.tsx` with its own
  `defaultProps` (this is what was done for `PodcastVideo-hyperframes` -
  copy that block as a template) for a quick check in `npx remotion studio`, or
- Pass props at render time. `hosts.*.photoBase` is required (points at
  files in `public/characters/`, see `CLAUDE.md` for how those are made)
  and `turnsUrl` is optional but strongly recommended (see step 2):

```bash
npx remotion render PodcastVideo out/episode01.mp4 \
  --props='{"episodeId":"episode01","audioSrc":"audio/episode01.mp3","scenesUrl":"data/episode01.scenes.json","captionsUrl":"data/episode01.captions.json","turnsUrl":"data/episode01.turns.json","hosts":{"host1":{"label":"Ведущий","color":"#2f6fed","photoBase":"host1-turned"},"host2":{"label":"Ведущая","color":"#e0479e","photoBase":"host2-turned"}}}'
```
