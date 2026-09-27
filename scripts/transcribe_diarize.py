#!/usr/bin/env python3
"""Transcribe + diarize a podcast audio file with WhisperX.

Produces a flat JSON array of words with speaker labels:
    [{"text": "...", "startMs": 0, "endMs": 320, "speaker": "SPEAKER_00"}, ...]

Speaker labels are whatever pyannote assigns (SPEAKER_00, SPEAKER_01, ...) -
mapping them to host1/host2 happens in normalize_transcript.mjs.

Setup (one-time):
    python -m venv .venv
    .venv/Scripts/activate   (Windows)  or  source .venv/bin/activate (macOS/Linux)
    pip install -r requirements.txt

Requires a free Hugging Face token with access accepted for:
    https://huggingface.co/pyannote/speaker-diarization-3.1
    https://huggingface.co/pyannote/segmentation-3.0

The token is resolved in this order (first match wins), so it never has to
be set as a system-wide environment variable:
    1. --hf-token flag
    2. HF_TOKEN environment variable (only for the current shell, if you set it)
    3. scripts/.hf_token - a plain-text file containing just the token,
       git-ignored, read once per run and never persisted anywhere else

Usage:
    python transcribe_diarize.py <audio_file> <output.json>
"""

import argparse
import json
import os
import sys
from pathlib import Path

TOKEN_FILE = Path(__file__).parent / ".hf_token"


def resolve_hf_token(cli_value: str | None) -> str | None:
    if cli_value:
        return cli_value
    if os.environ.get("HF_TOKEN"):
        return os.environ["HF_TOKEN"]
    if TOKEN_FILE.exists():
        return TOKEN_FILE.read_text(encoding="utf-8").strip()
    return None


def main() -> int:
    parser = argparse.ArgumentParser(description="Transcribe + diarize an episode with WhisperX")
    parser.add_argument("audio", help="Path to the podcast audio file (wav/mp3/...)")
    parser.add_argument("output", help="Path to write the raw word+speaker JSON")
    parser.add_argument("--model", default="large-v3", help="Whisper model size")
    parser.add_argument("--language", default=None, help="Force language code, e.g. ru (default: auto-detect)")
    parser.add_argument("--device", default="cpu", choices=["cpu", "cuda"])
    parser.add_argument("--compute-type", default="int8", help="int8 for CPU, float16 for GPU")
    parser.add_argument("--num-speakers", type=int, default=2, help="Exact speaker count (both hosts)")
    parser.add_argument(
        "--batch-size", type=int, default=16, help="Lower this (e.g. 4 or 2) if transcription runs out of memory"
    )
    parser.add_argument(
        "--hf-token",
        default=None,
        help="Hugging Face token with pyannote model access "
        "(falls back to HF_TOKEN env var, then scripts/.hf_token)",
    )
    args = parser.parse_args()

    hf_token = resolve_hf_token(args.hf_token)
    if not hf_token:
        print(
            "Error: no Hugging Face token found. Pass --hf-token, set HF_TOKEN, "
            "or create scripts/.hf_token with the token on a single line (see scripts/README.md).",
            file=sys.stderr,
        )
        return 1

    import whisperx  # imported lazily so --help works without the heavy deps installed

    model = whisperx.load_model(args.model, args.device, compute_type=args.compute_type, language=args.language)
    audio = whisperx.load_audio(args.audio)
    result = model.transcribe(audio, batch_size=args.batch_size)

    align_model, align_metadata = whisperx.load_align_model(language_code=result["language"], device=args.device)
    result = whisperx.align(
        result["segments"], align_model, align_metadata, audio, args.device, return_char_alignments=False
    )

    diarize_model = whisperx.diarize.DiarizationPipeline(token=hf_token, device=args.device)
    diarize_segments = diarize_model(audio, min_speakers=args.num_speakers, max_speakers=args.num_speakers)
    result = whisperx.assign_word_speakers(diarize_segments, result)

    words = []
    for segment in result["segments"]:
        for word in segment.get("words", []):
            if "start" not in word or "end" not in word:
                # WhisperX occasionally can't align a word (e.g. cut off audio);
                # skip it rather than guessing its timing.
                continue
            words.append(
                {
                    "text": word["word"],
                    "startMs": round(word["start"] * 1000),
                    "endMs": round(word["end"] * 1000),
                    "speaker": word.get("speaker", segment.get("speaker", "SPEAKER_00")),
                }
            )

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(words, f, ensure_ascii=False, indent=2)

    print(f"Wrote {len(words)} words to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
