#!/usr/bin/env python3
"""
Generate poem TTS audio files from public/index/tts_voice_map.json.

Output filename pattern:
  public/audio/{poemNoStr}_normal.mp3
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from typing import Any

import soundfile as sf

NOTE_RE = re.compile(r"[\[\［]\s*\d+\s*[\]\］]")
DEFAULT_CHECKPOINT = "Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice"

INSTRUCT_PRESETS = {
    "majestic": "庄重缓慢地朗诵，低沉浑厚的声音，带有古典诗歌的韵律感，在逗号和句号处自然停顿",
    "calm": "平和淡然地朗诵，语速适中，声音清晰自然，不带过多感情色彩",
    "sad": "深沉悲伤地朗诵，声音低沉缓慢，带有叹息和怀念之感",
    "bright": "轻快明亮地朗诵，声音清脆，语速稍快，充满活力和喜悦",
    "slow": "极其缓慢地朗诵，每个字都清晰饱满，字与字之间有明显停顿，适合初学者跟读",
}


def normalize_poem_no(value: Any) -> str:
    if value is None:
        return ""
    s = str(value).strip()
    if not s:
        return ""
    digits = "".join(ch for ch in s if ch.isdigit())
    if digits:
        return digits.zfill(3)
    return s


def strip_notes(text: str) -> str:
    return NOTE_RE.sub("", text or "")


def poem_text_for_tts(poem: dict[str, Any]) -> str:
    raw = (poem.get("poemSimp") or poem.get("poemZh") or "").strip()
    raw = strip_notes(raw).replace("\r\n", "\n")
    lines = [line.strip() for line in raw.split("\n") if line.strip()]
    return "\n".join(lines)


def resolve_instruct(item: dict[str, Any]) -> str:
    custom = str(item.get("instructCustom") or "").strip()
    if custom:
        return custom
    preset_id = str(item.get("instruct") or "").strip()
    if preset_id in INSTRUCT_PRESETS:
        return INSTRUCT_PRESETS[preset_id]
    return preset_id


def load_poems(path: Path) -> dict[str, dict[str, Any]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    poems = data if isinstance(data, list) else data.get("poems", [])
    result: dict[str, dict[str, Any]] = {}
    for poem in poems:
        no = normalize_poem_no(poem.get("poemNoStr") or poem.get("poemNo"))
        if no:
            result[no] = poem
    return result


def ensure_ffmpeg() -> None:
    try:
        subprocess.run(
            ["ffmpeg", "-version"],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except Exception as exc:
        raise RuntimeError(
            "ffmpeg is required to convert WAV to MP3. Install ffmpeg and retry."
        ) from exc


def wav_to_mp3(wav_path: Path, mp3_path: Path) -> None:
    mp3_path.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-loglevel",
            "error",
            "-i",
            str(wav_path),
            "-codec:a",
            "libmp3lame",
            "-q:a",
            "2",
            str(mp3_path),
        ],
        check=True,
    )


def find_local_snapshot_for_repo_id(repo_id: str) -> Path | None:
    parts = repo_id.split("/")
    if len(parts) != 2:
        return None
    org, name = parts
    cache_dir = Path.home() / ".cache" / "huggingface" / "hub" / f"models--{org}--{name}"
    if not cache_dir.exists():
        return None

    ref_main = cache_dir / "refs" / "main"
    if ref_main.exists():
        rev = ref_main.read_text(encoding="utf-8").strip()
        snap = cache_dir / "snapshots" / rev
        if snap.exists():
            return snap

    snapshots_dir = cache_dir / "snapshots"
    if not snapshots_dir.exists():
        return None
    snapshots = sorted(p for p in snapshots_dir.iterdir() if p.is_dir())
    return snapshots[-1] if snapshots else None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Batch TTS from tts_voice_map.json")
    parser.add_argument(
        "--map-path",
        default="public/index/tts_voice_map.json",
        help="Path to voice map JSON file",
    )
    parser.add_argument(
        "--poems-path",
        default="public/index/poems.full.json",
        help="Path to poems DB JSON file",
    )
    parser.add_argument(
        "--output-dir",
        default="public/audio",
        help="Output directory for mp3 files",
    )
    parser.add_argument(
        "--checkpoint",
        default=DEFAULT_CHECKPOINT,
        help="Qwen3-TTS checkpoint",
    )
    parser.add_argument(
        "--language",
        default="Chinese",
        help="Language passed to qwen_tts",
    )
    parser.add_argument(
        "--max-new-tokens",
        type=int,
        default=2048,
        help="max_new_tokens for generation",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Regenerate even when output mp3 already exists",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Only process first N items (0 = all)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate mapping and print plan without generation",
    )
    parser.add_argument(
        "--save-wav",
        action="store_true",
        help="Keep intermediate wav as {poemNoStr}_normal.wav",
    )
    parser.add_argument(
        "--include-unmapped",
        action="store_true",
        help="Process all poems in poems DB; use mapped settings first and fallback defaults for missing poemNoStr",
    )
    parser.add_argument(
        "--default-speaker",
        default="Uncle_Fu",
        help="Fallback speaker for poems not present in tts_voice_map.json",
    )
    parser.add_argument(
        "--default-instruct",
        default="calm",
        help="Fallback instruct preset id/text for poems not present in tts_voice_map.json",
    )
    parser.add_argument(
        "--no-local-cache",
        action="store_true",
        help="Do not auto-switch repo checkpoint to local HuggingFace cache snapshot",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    map_path = Path(args.map_path)
    poems_path = Path(args.poems_path)
    output_dir = Path(args.output_dir)

    if not map_path.exists():
        print(f"[ERROR] Missing map file: {map_path}", file=sys.stderr)
        return 1
    if not poems_path.exists():
        print(f"[ERROR] Missing poems file: {poems_path}", file=sys.stderr)
        return 1

    raw_voice_map = json.loads(map_path.read_text(encoding="utf-8"))
    if not isinstance(raw_voice_map, list):
        print(f"[ERROR] Map file must be a JSON list: {map_path}", file=sys.stderr)
        return 1

    poems_by_no = load_poems(poems_path)
    voice_map_by_no: dict[str, dict[str, Any]] = {}
    for item in raw_voice_map:
        no = normalize_poem_no(item.get("poemNoStr"))
        if no:
            voice_map_by_no[no] = item

    items_to_process: list[dict[str, Any]]
    fallback_items = 0
    if args.include_unmapped:
        all_nos = sorted(
            poems_by_no.keys(),
            key=lambda x: int(x) if str(x).isdigit() else str(x),
        )
        items_to_process = []
        for no in all_nos:
            mapped = voice_map_by_no.get(no)
            if mapped is not None:
                items_to_process.append(mapped)
                continue
            fallback_items += 1
            items_to_process.append(
                {
                    "poemNoStr": no,
                    "speaker": args.default_speaker,
                    "instruct": args.default_instruct,
                    "instructCustom": "",
                    "_autoFallback": True,
                }
            )
    else:
        items_to_process = list(raw_voice_map)

    if args.limit > 0:
        items_to_process = items_to_process[: args.limit]

    output_dir.mkdir(parents=True, exist_ok=True)

    if not args.dry_run:
        ensure_ffmpeg()

    print(f"[INFO] map items: {len(raw_voice_map)}")
    if args.include_unmapped:
        print(
            f"[INFO] include_unmapped enabled: total={len(items_to_process)} (fallback={fallback_items})"
        )
    print(f"[INFO] output dir: {output_dir}")

    if args.dry_run:
        for item in items_to_process:
            no = normalize_poem_no(item.get("poemNoStr"))
            speaker = str(item.get("speaker") or "").strip()
            instruct = resolve_instruct(item)
            poem = poems_by_no.get(no)
            status = "OK" if poem and speaker and instruct else "INVALID"
            print(
                f"[DRY] {no} speaker={speaker} instruct_len={len(instruct)} status={status}"
            )
        return 0

    resolved_checkpoint = args.checkpoint
    if not args.no_local_cache:
        local_snapshot = find_local_snapshot_for_repo_id(args.checkpoint)
        if local_snapshot is not None:
            resolved_checkpoint = str(local_snapshot)
            os.environ.setdefault("HF_HUB_OFFLINE", "1")
            os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")
            print(f"[INFO] using local HF snapshot: {resolved_checkpoint}")

    os.environ.setdefault("NUMBA_DISABLE_JIT", "1")
    model: Any | None = None

    def ensure_model() -> Any:
        nonlocal model
        if model is None:
            from qwen_tts import Qwen3TTSModel  # type: ignore

            print(f"[INFO] loading model: {resolved_checkpoint}")
            model = Qwen3TTSModel.from_pretrained(
                resolved_checkpoint, trust_remote_code=True
            )
            print("[INFO] model loaded")
        return model

    generated = 0
    skipped = 0
    failed = 0
    results: list[dict[str, Any]] = []

    for idx, item in enumerate(items_to_process, start=1):
        no = normalize_poem_no(item.get("poemNoStr"))
        speaker = str(item.get("speaker") or "").strip()
        instruct = resolve_instruct(item)
        mp3_path = output_dir / f"{no}_normal.mp3"
        wav_path = output_dir / f"{no}_normal.wav"

        poem = poems_by_no.get(no)
        if not no or not poem:
            failed += 1
            msg = "poem not found"
            print(f"[{idx}/{len(items_to_process)}] {no} FAIL: {msg}")
            results.append({"poemNoStr": no, "status": "failed", "error": msg})
            continue
        if not speaker:
            failed += 1
            msg = "speaker is empty"
            print(f"[{idx}/{len(items_to_process)}] {no} FAIL: {msg}")
            results.append({"poemNoStr": no, "status": "failed", "error": msg})
            continue
        if not instruct:
            failed += 1
            msg = "instruct/instructCustom is empty"
            print(f"[{idx}/{len(items_to_process)}] {no} FAIL: {msg}")
            results.append({"poemNoStr": no, "status": "failed", "error": msg})
            continue

        text = poem_text_for_tts(poem)
        if not text:
            failed += 1
            msg = "poem text is empty"
            print(f"[{idx}/{len(items_to_process)}] {no} FAIL: {msg}")
            results.append({"poemNoStr": no, "status": "failed", "error": msg})
            continue

        if mp3_path.exists() and not args.force:
            skipped += 1
            print(f"[{idx}/{len(items_to_process)}] {no} SKIP: {mp3_path.name} already exists")
            results.append(
                {
                    "poemNoStr": no,
                    "status": "skipped",
                    "mp3": str(mp3_path),
                    "autoFallback": bool(item.get("_autoFallback")),
                }
            )
            continue

        temp_wav = wav_path if args.save_wav else None
        if temp_wav is None:
            fd, raw_temp = tempfile.mkstemp(prefix=f"{no}_", suffix=".wav")
            os.close(fd)
            temp_wav = Path(raw_temp)

        start = time.time()
        try:
            model_obj = ensure_model()
            audios, sample_rate = model_obj.generate_custom_voice(
                text=text,
                speaker=speaker,
                instruct=instruct,
                language=args.language,
                non_streaming_mode=True,
                max_new_tokens=args.max_new_tokens,
            )
            sf.write(str(temp_wav), audios[0], sample_rate)
            wav_to_mp3(temp_wav, mp3_path)
            elapsed = round(time.time() - start, 2)
            generated += 1
            print(
                f"[{idx}/{len(items_to_process)}] {no} DONE: {mp3_path.name} ({elapsed}s)"
            )
            results.append(
                {
                    "poemNoStr": no,
                    "status": "generated",
                    "speaker": speaker,
                    "instruct": item.get("instruct", ""),
                    "mp3": str(mp3_path),
                    "elapsedSec": elapsed,
                    "sampleRate": int(sample_rate),
                    "autoFallback": bool(item.get("_autoFallback")),
                }
            )
        except Exception as exc:  # noqa: BLE001
            failed += 1
            print(f"[{idx}/{len(items_to_process)}] {no} FAIL: {exc}")
            results.append(
                {"poemNoStr": no, "status": "failed", "error": str(exc)}
            )
        finally:
            if not args.save_wav and temp_wav.exists():
                temp_wav.unlink(missing_ok=True)

    ts = time.strftime("%Y%m%d_%H%M%S")
    manifest_path = output_dir / f"tts_batch_manifest_{ts}.json"
    manifest = {
        "generatedAt": ts,
        "mapPath": str(map_path),
        "poemsPath": str(poems_path),
        "outputDir": str(output_dir),
        "checkpointRequested": args.checkpoint,
        "checkpointResolved": resolved_checkpoint,
        "language": args.language,
        "totalRequested": len(items_to_process),
        "includeUnmapped": bool(args.include_unmapped),
        "fallbackSpeaker": args.default_speaker if args.include_unmapped else "",
        "fallbackInstruct": args.default_instruct if args.include_unmapped else "",
        "fallbackItems": fallback_items if args.include_unmapped else 0,
        "generated": generated,
        "skipped": skipped,
        "failed": failed,
        "items": results,
    }
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    print(
        f"[SUMMARY] generated={generated} skipped={skipped} failed={failed} manifest={manifest_path}"
    )
    return 0 if failed == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
