"""
Qwen3-TTS 테스트 스튜디오 서버
로컬 테스트 전용 — 시 선택 + 화자/스타일 조절 + 생성 + 재생
+ 한국어 지원 + Voice Cloning (내 목소리 학습)

실행: cd /Users/jin/Documents/tangshi && python3 tools/tts-studio/server.py
브라우저: http://localhost:8989
"""

from __future__ import annotations

import os
import sys

# ── librosa/numba Python 3.13 호환성 패치 ──
# numba가 Python 3.13을 지원하지 않아 librosa import 시 크래시.
# librosa.load / librosa.resample 을 soundfile + scipy 기반으로 교체.
os.environ["NUMBA_DISABLE_JIT"] = "1"

import types
import numpy as np
import soundfile as _sf
from scipy.signal import resample_poly
from math import gcd

# librosa 모듈을 가짜로 만들어서 sys.modules에 등록
_fake_librosa = types.ModuleType("librosa")
_fake_librosa.__version__ = "0.0.0-patched"
_fake_librosa.__spec__ = types.SimpleNamespace(
    name="librosa", submodule_search_locations=[], origin=None, loader=None,
)
_fake_librosa.__path__ = []
_fake_librosa.__file__ = __file__

def _patched_load(path, sr=None, mono=True, **kwargs):
    """librosa.load 대체: soundfile로 로드 + scipy로 리샘플."""
    data, orig_sr = _sf.read(path, dtype="float32")
    if mono and data.ndim > 1:
        data = data.mean(axis=1)
    if sr is not None and sr != orig_sr:
        data = _resample(data, orig_sr, sr)
    return data, sr if sr else orig_sr

def _resample(y, orig_sr, target_sr, **kwargs):
    """librosa.resample 대체: scipy resample_poly 사용."""
    if orig_sr == target_sr:
        return y
    g = gcd(int(orig_sr), int(target_sr))
    up = int(target_sr) // g
    down = int(orig_sr) // g
    return resample_poly(y, up, down).astype(np.float32)

def _mel_filterbank(sr=22050, n_fft=2048, n_mels=128, fmin=0.0, fmax=None, **kwargs):
    """librosa.filters.mel 대체: numpy로 멜 필터뱅크 생성 (slaney norm)."""
    if fmax is None:
        fmax = sr / 2.0
    # Hz → Mel (slaney 공식)
    def hz_to_mel(f):
        f = np.asarray(f, dtype=np.float64)
        return np.where(f >= 1000.0, 15.0 + 27.0 * np.log10(f / 1000.0),
                        3.0 * f / 200.0)
    def mel_to_hz(m):
        m = np.asarray(m, dtype=np.float64)
        return np.where(m >= 15.0, 1000.0 * 10.0 ** ((m - 15.0) / 27.0),
                        200.0 * m / 3.0)
    min_mel, max_mel = hz_to_mel(fmin), hz_to_mel(fmax)
    mels = np.linspace(float(min_mel), float(max_mel), n_mels + 2)
    freqs = mel_to_hz(mels)
    fft_freqs = np.fft.rfftfreq(n_fft, d=1.0 / sr)
    weights = np.zeros((n_mels, len(fft_freqs)), dtype=np.float32)
    for i in range(n_mels):
        lo, mid, hi = freqs[i], freqs[i + 1], freqs[i + 2]
        up = (fft_freqs - lo) / max(mid - lo, 1e-10)
        down = (hi - fft_freqs) / max(hi - mid, 1e-10)
        weights[i] = np.maximum(0, np.minimum(up, down))
    # slaney norm
    enorm = 2.0 / (mel_to_hz(mels[2:n_mels+2]) - mel_to_hz(mels[:n_mels]))
    weights *= enorm[:, np.newaxis]
    return weights

_fake_librosa.load = _patched_load
_fake_librosa.resample = _resample

# 하위 모듈 생성 함수
def _make_submod(name):
    _sub = types.ModuleType(name)
    _sub.__spec__ = types.SimpleNamespace(
        name=name, submodule_search_locations=[], origin=None, loader=None,
    )
    _sub.__path__ = []
    _sub.__file__ = __file__
    _sub.load = _patched_load
    _sub.resample = _resample
    return _sub

# 하위 모듈 등록
for _submod_name in ["librosa.core", "librosa.core.audio", "librosa.util",
                      "librosa.feature"]:
    sys.modules[_submod_name] = _make_submod(_submod_name)

# librosa.filters — mel 함수 포함
_filters = _make_submod("librosa.filters")
_filters.mel = _mel_filterbank
sys.modules["librosa.filters"] = _filters
_fake_librosa.filters = _filters

sys.modules["librosa"] = _fake_librosa
# ── 패치 끝 ──

import json
import re
import time
import uuid
from pathlib import Path
from typing import Optional

import soundfile as sf
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# ── 경로 설정 ──
ROOT = Path(__file__).resolve().parents[2]
POEM_DB = ROOT / "public" / "index" / "poems.full.json"
HYEONTO_DB = ROOT / "public" / "index" / "hyeonto_data.json"
STUDIO_DIR = Path(__file__).resolve().parent
GENERATED_DIR = STUDIO_DIR / "generated"
GENERATED_DIR.mkdir(exist_ok=True)
REF_AUDIO_DIR = STUDIO_DIR / "ref_audio"
REF_AUDIO_DIR.mkdir(exist_ok=True)

# ── 주석 번호 제거 정규식 ──
NOTE_RE = re.compile(r"[\[\［]\s*\d+\s*[\]\］]")

# ── 지원 언어 ──
LANGUAGES = [
    {"id": "Chinese", "label": "중국어 (普通话)"},
    {"id": "Korean", "label": "한국어"},
    {"id": "English", "label": "영어"},
    {"id": "Japanese", "label": "일본어"},
]

# ── 화자 목록 (Qwen3-TTS CustomVoice) ──
SPEAKERS = [
    # ── 한국어 ──
    {"id": "Sohee", "name": "Sohee", "desc": "따뜻한 한국 여성, 감정 풍부", "lang": "ko"},
    # ── 중국어 ──
    {"id": "Vivian", "name": "Vivian", "desc": "밝고 예리한 젊은 여성", "lang": "zh"},
    {"id": "Serena", "name": "Serena", "desc": "따뜻하고 부드러운 젊은 여성", "lang": "zh"},
    {"id": "Uncle_Fu", "name": "Uncle_Fu", "desc": "나이든 남성, 낮고 부드러운", "lang": "zh"},
    {"id": "Dylan", "name": "Dylan", "desc": "북경 청년, 맑고 자연스러운", "lang": "zh"},
    {"id": "Eric", "name": "Eric", "desc": "성도 남성, 밝고 허스키한", "lang": "zh"},
    # ── 영어 ──
    {"id": "Ryan", "name": "Ryan", "desc": "역동적 남성, 강한 리듬감", "lang": "en"},
    {"id": "Aiden", "name": "Aiden", "desc": "밝은 미국 남성, 깨끗한 중음", "lang": "en"},
    # ── 일본어 ──
    {"id": "Ono_Anna", "name": "Ono_Anna", "desc": "활발한 일본 여성, 가볍고 경쾌", "lang": "ja"},
]

# ── Instruct 프리셋 ──
INSTRUCT_PRESETS = [
    {
        "id": "majestic",
        "label": "웅장 낭송",
        "text": "用朗诵古诗的方式，声音洪亮有力，语速稍慢，每句之间停顿分明，像在大殿上诵读经典",
    },
    {
        "id": "calm",
        "label": "담백 낭송",
        "text": "用平静清晰的声音朗读古诗，语速适中，吐字清楚，不加过多感情，像老师在课堂上示范朗读",
    },
    {
        "id": "sad",
        "label": "슬픈 감성",
        "text": "用略带忧伤的语气朗诵古诗，语速偏慢，声音柔和低沉，像在回忆往事时轻声吟诵",
    },
    {
        "id": "bright",
        "label": "경쾌한",
        "text": "用轻快愉悦的语气朗诵古诗，声音明亮，语速适中偏快，充满欣喜之情",
    },
    {
        "id": "slow",
        "label": "또박또박 느리게",
        "text": "非常缓慢地朗读，每个字都读得饱满清晰，字与字之间有明显停顿，像教小朋友读古诗一样",
    },
]

# ── 모델 (lazy load) ──
_model_cache: dict = {}


def get_model(checkpoint: str):
    """모델을 1회 로드 후 캐시."""
    if checkpoint in _model_cache:
        return _model_cache[checkpoint]

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


def load_hyeonto() -> dict:
    """현토 DB 로드."""
    if not HYEONTO_DB.exists():
        return {}
    with HYEONTO_DB.open("r", encoding="utf-8") as f:
        return json.load(f)


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
    hyeonto_data = load_hyeonto()
    hyeonto_map = {}
    for h in hyeonto_data.get("poems", []):
        hyeonto_map[h.get("poemNoStr", "")] = h

    result = []
    for p in poems:
        no_str = str(p.get("poemNoStr") or p.get("poemNo") or "")
        hy = hyeonto_map.get(no_str)

        item = {
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
            "translationKo": strip_notes(p.get("translationKo") or ""),
            "category": p.get("category", ""),
            "meter": p.get("meter", 0),
        }

        # 현토 데이터 추가
        if hy:
            item["hyeontoFull"] = hy.get("hyeontoFull", "")
            item["readingFull"] = hy.get("readingFull", "")
        else:
            item["hyeontoFull"] = ""
            item["readingFull"] = ""

        result.append(item)
    return result


@app.get("/api/speakers")
async def api_speakers():
    return SPEAKERS


@app.get("/api/presets")
async def api_presets():
    return INSTRUCT_PRESETS


@app.get("/api/languages")
async def api_languages():
    return LANGUAGES


# ── 레퍼런스 오디오 관리 ──

@app.get("/api/ref-audios")
async def api_ref_audios():
    """저장된 레퍼런스 오디오 목록."""
    audios = []
    for f in sorted(REF_AUDIO_DIR.glob("*.wav")):
        meta_path = f.with_suffix(".json")
        meta = {}
        if meta_path.exists():
            meta = json.loads(meta_path.read_text(encoding="utf-8"))
        audios.append({
            "id": f.stem,
            "filename": f.name,
            "url": f"/ref_audio/{f.name}",
            "label": meta.get("label", f.stem),
            "refText": meta.get("refText", ""),
            "createdAt": meta.get("createdAt", ""),
        })
    return audios


@app.post("/api/upload-ref-audio")
async def api_upload_ref_audio(
    file: UploadFile = File(...),
    label: str = Form(""),
    refText: str = Form(""),
):
    """마이크 녹음 또는 파일 업로드로 레퍼런스 오디오 저장."""
    file_id = uuid.uuid4().hex[:8]
    filename = f"{file_id}.wav"
    filepath = REF_AUDIO_DIR / filename

    content = await file.read()
    filepath.write_bytes(content)

    # 메타 저장
    meta = {
        "label": label or file_id,
        "refText": refText,
        "originalName": file.filename,
        "createdAt": time.strftime("%Y-%m-%d %H:%M:%S"),
    }
    meta_path = filepath.with_suffix(".json")
    meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")

    return {
        "id": file_id,
        "filename": filename,
        "url": f"/ref_audio/{filename}",
        "label": meta["label"],
        "refText": refText,
    }


@app.delete("/api/ref-audios/{audio_id}")
async def api_delete_ref_audio(audio_id: str):
    """레퍼런스 오디오 삭제."""
    wav_path = REF_AUDIO_DIR / f"{audio_id}.wav"
    meta_path = REF_AUDIO_DIR / f"{audio_id}.json"
    if wav_path.exists():
        wav_path.unlink()
    if meta_path.exists():
        meta_path.unlink()
    return {"ok": True}


# ── TTS 생성 ──

class GenerateRequest(BaseModel):
    text: str
    mode: str = "custom_voice"  # "custom_voice" | "voice_design" | "voice_clone"
    speaker: str = "Uncle_Fu"
    instruct: str = ""
    language: str = "Chinese"
    checkpoint: str = ""  # 빈 문자열이면 모드에 따라 자동 선택
    max_new_tokens: int = 2048
    # Voice Clone 전용
    refAudioId: Optional[str] = None
    refText: Optional[str] = None


@app.post("/api/generate")
async def api_generate(req: GenerateRequest):
    # 체크포인트 자동 선택
    if not req.checkpoint:
        if req.mode == "voice_design":
            checkpoint = "Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign"
        elif req.mode == "voice_clone":
            checkpoint = "Qwen/Qwen3-TTS-12Hz-1.7B-Base"
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
        if req.mode == "voice_clone":
            # Voice Clone: ref_audio 필요
            if not req.refAudioId:
                raise HTTPException(status_code=400, detail="레퍼런스 오디오를 선택하세요")
            ref_path = REF_AUDIO_DIR / f"{req.refAudioId}.wav"
            if not ref_path.exists():
                raise HTTPException(status_code=404, detail="레퍼런스 오디오를 찾을 수 없습니다")

            # soundfile로 직접 로드 (librosa → numba 호환성 문제 우회)
            audio_data, audio_sr = sf.read(str(ref_path), dtype="float32")
            if audio_data.ndim > 1:  # 스테레오 → 모노
                audio_data = audio_data.mean(axis=1)

            kwargs = dict(
                text=req.text,
                language=req.language,
                ref_audio=(audio_data, audio_sr),
                non_streaming_mode=True,
                max_new_tokens=req.max_new_tokens,
            )
            if req.refText:
                kwargs["ref_text"] = req.refText
            if req.instruct:
                kwargs["instruct"] = req.instruct

            audios, sample_rate = model.generate_voice_clone(**kwargs)

        elif req.mode == "voice_design":
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
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        print(f"[TTS 에러]\n{tb}")
        raise HTTPException(status_code=500, detail=f"TTS 생성 실패: {e}\n\n{tb}")

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
        "language": req.language,
        "instruct": req.instruct,
    }


# 생성된 오디오 서빙
app.mount("/generated", StaticFiles(directory=str(GENERATED_DIR)), name="generated")
app.mount("/ref_audio", StaticFiles(directory=str(REF_AUDIO_DIR)), name="ref_audio")


if __name__ == "__main__":
    import uvicorn

    print("=" * 50)
    print("  Qwen3-TTS 테스트 스튜디오 v2")
    print("  한국어 + Voice Cloning 지원")
    print("  http://localhost:8989")
    print("=" * 50)
    uvicorn.run(app, host="0.0.0.0", port=8989)
