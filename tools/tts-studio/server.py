"""
Qwen3-TTS 테스트 스튜디오 서버
로컬 테스트 전용 — 시 선택 + 화자/스타일 조절 + 생성 + 재생

실행: cd /Users/jin/Documents/tangshi && python3 tools/tts-studio/server.py
브라우저: http://localhost:8989
"""

from __future__ import annotations

import json
import os
import re
import time
import uuid
from pathlib import Path

import soundfile as sf
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# ── 경로 설정 ──
ROOT = Path(__file__).resolve().parents[2]
POEM_DB = ROOT / "public" / "index" / "poems.full.json"
STUDIO_DIR = Path(__file__).resolve().parent
GENERATED_DIR = STUDIO_DIR / "generated"
GENERATED_DIR.mkdir(exist_ok=True)

# ── 주석 번호 제거 정규식 ──
NOTE_RE = re.compile(r"[\[\［]\s*\d+\s*[\]\］]")

# ── 화자 목록 (Qwen3-TTS CustomVoice) ──
SPEAKERS = [
    {"id": "Vivian", "name": "Vivian", "desc": "밝고 예리한 젊은 여성", "lang": "zh"},
    {"id": "Serena", "name": "Serena", "desc": "따뜻하고 부드러운 젊은 여성", "lang": "zh"},
    {"id": "Uncle_Fu", "name": "Uncle_Fu", "desc": "나이든 남성, 낮고 부드러운", "lang": "zh"},
    {"id": "Dylan", "name": "Dylan", "desc": "북경 청년, 맑고 자연스러운", "lang": "zh"},
    {"id": "Eric", "name": "Eric", "desc": "성도 남성, 밝고 허스키한", "lang": "zh"},
]

# ── Instruct 프리셋 ──
INSTRUCT_PRESETS = [
    {
        "id": "majestic",
        "label": "웅장 낭송",
        "text": "庄重缓慢地朗诵，低沉浑厚的声音，带有古典诗歌的韵律感，在逗号和句号处自然停顿",
    },
    {
        "id": "calm",
        "label": "담백 낭송",
        "text": "平和淡然地朗诵，语速适中，声音清晰自然，不带过多感情色彩",
    },
    {
        "id": "sad",
        "label": "슬픈 감성",
        "text": "深沉悲伤地朗诵，声音低沉缓慢，带有叹息和怀念之感",
    },
    {
        "id": "bright",
        "label": "경쾌한",
        "text": "轻快明亮地朗诵，声音清脆，语速稍快，充满活力和喜悦",
    },
    {
        "id": "slow",
        "label": "매우 느린 낭송",
        "text": "极其缓慢地朗诵，每个字都清晰饱满，字与字之间有明显停顿，适合初学者跟读",
    },
]

# ── 모델 (lazy load) ──
_model_cache: dict = {}


def get_model(checkpoint: str):
    """모델을 1회 로드 후 캐시."""
    if checkpoint in _model_cache:
        return _model_cache[checkpoint]

    os.environ.setdefault("NUMBA_DISABLE_JIT", "1")
    from qwen_tts import Qwen3TTSModel  # type: ignore

    print(f"[모델 로드] {checkpoint} ...")
    model = Qwen3TTSModel.from_pretrained(checkpoint, trust_remote_code=True)
    _model_cache[checkpoint] = model
    print(f"[모델 로드 완료] {checkpoint}")
    return model


def load_poems() -> list[dict]:
    """시 DB 로드."""
    with POEM_DB.open("r", encoding="utf-8") as f:
        data = json.load(f)
    if isinstance(data, list):
        return data
    return data.get("poems", [])


def strip_notes(text: str) -> str:
    """주석 번호 제거."""
    return NOTE_RE.sub("", text or "")


def poem_text_for_tts(poem: dict) -> str:
    """TTS 입력용 텍스트 생성 (간체자 우선, 주석 제거)."""
    raw = (poem.get("poemSimp") or poem.get("poemZh") or "").strip()
    raw = strip_notes(raw)
    lines = [ln.strip() for ln in raw.replace("\r\n", "\n").split("\n") if ln.strip()]
    return "\n".join(lines)


def poem_title(poem: dict) -> str:
    t = poem.get("title")
    if isinstance(t, dict):
        return strip_notes(str(t.get("zh") or t.get("ko") or ""))
    return strip_notes(str(t or ""))


# ── FastAPI 앱 ──
app = FastAPI(title="Qwen3-TTS Studio")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", response_class=HTMLResponse)
async def index():
    html_path = STUDIO_DIR / "index.html"
    return HTMLResponse(html_path.read_text(encoding="utf-8"))


@app.get("/api/poems")
async def api_poems():
    poems = load_poems()
    result = []
    for p in poems:
        no_str = str(p.get("poemNoStr") or p.get("poemNo") or "")
        result.append(
            {
                "poemNoStr": no_str,
                "titleZh": poem_title(p),
                "titleKo": strip_notes(
                    str((p.get("title") or {}).get("ko", ""))
                    if isinstance(p.get("title"), dict)
                    else ""
                ),
                "poetZh": strip_notes(
                    str((p.get("poet") or {}).get("zh", ""))
                    if isinstance(p.get("poet"), dict)
                    else str(p.get("poet") or "")
                ),
                "poetKo": str((p.get("poet") or {}).get("ko", ""))
                if isinstance(p.get("poet"), dict)
                else "",
                "textForTTS": poem_text_for_tts(p),
                "category": p.get("category", ""),
                "meter": p.get("meter", 0),
            }
        )
    return result


@app.get("/api/speakers")
async def api_speakers():
    return SPEAKERS


@app.get("/api/presets")
async def api_presets():
    return INSTRUCT_PRESETS


class GenerateRequest(BaseModel):
    text: str
    mode: str = "custom_voice"  # "custom_voice" | "voice_design"
    speaker: str = "Uncle_Fu"
    instruct: str = ""
    language: str = "Chinese"
    checkpoint: str = ""  # 빈 문자열이면 모드에 따라 자동 선택
    max_new_tokens: int = 2048


@app.post("/api/generate")
async def api_generate(req: GenerateRequest):
    # 체크포인트 자동 선택
    if not req.checkpoint:
        if req.mode == "voice_design":
            checkpoint = "Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign"
        else:
            checkpoint = "Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice"
    else:
        checkpoint = req.checkpoint

    try:
        model = get_model(checkpoint)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"모델 로드 실패: {e}")

    start = time.time()
    try:
        if req.mode == "voice_design":
            audios, sample_rate = model.generate_voice_design(
                text=req.text,
                instruct=req.instruct,
                language=req.language,
                non_streaming_mode=True,
                max_new_tokens=req.max_new_tokens,
            )
        else:
            audios, sample_rate = model.generate_custom_voice(
                text=req.text,
                speaker=req.speaker,
                instruct=req.instruct,
                language=req.language,
                non_streaming_mode=True,
                max_new_tokens=req.max_new_tokens,
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS 생성 실패: {e}")

    elapsed = round(time.time() - start, 2)

    # WAV 저장
    file_id = uuid.uuid4().hex[:8]
    filename = f"{file_id}.wav"
    filepath = GENERATED_DIR / filename
    sf.write(str(filepath), audios[0], sample_rate)

    return {
        "fileId": file_id,
        "filename": filename,
        "url": f"/generated/{filename}",
        "sampleRate": sample_rate,
        "elapsed": elapsed,
        "mode": req.mode,
        "speaker": req.speaker if req.mode == "custom_voice" else None,
        "instruct": req.instruct,
    }


# 생성된 오디오 서빙
app.mount("/generated", StaticFiles(directory=str(GENERATED_DIR)), name="generated")


if __name__ == "__main__":
    import uvicorn

    print("=" * 50)
    print("  Qwen3-TTS 테스트 스튜디오")
    print("  http://localhost:8989")
    print("=" * 50)
    uvicorn.run(app, host="0.0.0.0", port=8989)
