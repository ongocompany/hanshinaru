# Qwen-TTS 작업 핸드오프

- 문서 목적: 현재 TTS 전환 작업(Qwen3-TTS) 상태를 다른 AI가 즉시 이어받을 수 있게 정리
- 작성일: 2026-02-16
- 작성자: CH (GPT/Codex)
- 수신: ALL (Claude/Gemini/기타 AI)

---

## 1) 결론 요약

1. 기존 `edge-tts` 테스트 흐름은 정리/삭제했고, 현재는 **Qwen-TTS 실험 경로로 전환 완료**.
2. 운영 경로(`public/`)는 건드리지 않고, **`docs/research/tts/`에서만** 실험 중.
3. Qwen-TTS 품질 테스트는 성공했으며, 현재 easy runner로 재현 가능.

---

## 2) 현재 작업 경로

- 작업 루트: `/Users/jin/Documents/tangshi`
- Qwen-TTS 실험 폴더: `docs/research/tts/`

### 주요 파일
- `docs/research/tts/README.md`
- `docs/research/tts/qwen_tts_easy.py` (대화형 실행 도구)
- `docs/research/tts/qwen_tts_sample.py` (샘플/배치용 기본 스크립트)

### 산출물 폴더
- 오디오: `docs/research/tts/audio/`
- 요청/메타: `docs/research/tts/outputs/`
- 로그: `docs/research/tts/logs/`

---

## 3) 외부 레퍼런스 (GitHub/모델)

### 공식 GitHub
- Qwen3-TTS: `https://github.com/QwenLM/Qwen3-TTS`

### 사용한 핵심 체크포인트
- `Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign`
- `Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice`

주의:
- 이전에 사용했던 `0.6B` 체크포인트 문자열은 실행 중 `Repository Not Found`를 유발해 현재 기본값에서 제외함.

---

## 4) 실행 방법 (다른 AI용)

### A. 프리셋/샘플 목록 확인
```bash
python3 docs/research/tts/qwen_tts_easy.py --list
```

### B. 대화형 실행 (권장)
```bash
python3 docs/research/tts/qwen_tts_easy.py --interactive
```

### C. 생성 없이 요청 JSON만 만들기
```bash
python3 docs/research/tts/qwen_tts_easy.py --interactive --dry-run
```

### D. 샘플 스크립트 드라이런
```bash
python3 docs/research/tts/qwen_tts_sample.py --dry-run --count 5
```

---

## 5) 이번 세션에서 실제 확인된 오류와 해결

1. **401 / RepositoryNotFound (HF)**
- 원인: 잘못된 체크포인트 문자열
- 해결: 프리셋/기본값을 `1.7B` 체크포인트로 교체

2. **Unsupported languages: ['zh']**
- 원인: qwen_tts는 `zh` 축약형 미지원
- 해결: language alias 정규화 추가
  - `zh -> chinese`, `ko -> korean`, `en -> english` 등

3. **Python 3.14 + numba/librosa import 이슈**
- 원인: 캐시 관련 예외
- 해결: 스크립트에서 `NUMBA_DISABLE_JIT=1` 기본 적용

4. **flash-attn 미설치 경고**
- 의미: 성능 경고(느릴 수 있음), 기능 자체는 동작 가능

5. **sox not found 경고**
- 의미: 로컬 의존성 경고, 현재 기본 생성 경로에서 치명 오류는 아님

---

## 6) 현재 생성/요청 파일 상태

### 실제 생성 확인
- `docs/research/tts/audio/009_〈贈衛八處士[1]〉_voice_design_1_20260216_134931.wav`

### 요청 메타 예시
- `docs/research/tts/outputs/request_009_20260216_134931.json`
- `docs/research/tts/outputs/qwen_tts_input_preview.json`

---

## 7) 코드 동작 핵심 포인트

### `qwen_tts_easy.py`
- 프리셋 기반으로 VoiceDesign/CustomVoice 선택
- 시 텍스트는 `poemSimp` 우선, 없으면 `poemZh`
- 주석 번호(`[1]`) 제거 후 TTS 입력으로 사용
- `--interactive`로 비개발자도 쉽게 실행 가능

### `qwen_tts_sample.py`
- 샘플/배치 확장용 기본 스크립트
- `--dry-run`으로 입력 프리뷰 JSON만 생성 가능

---

## 8) 다음 AI가 바로 할 일 (권장)

1. 프리셋 1/2로 3~5개 샘플 추가 생성해 청취 비교
2. 형님 확정 톤(웅장/담백) 결정
3. 결정 후 배치 생성 스크립트(`count=320`)로 확대
4. 최종 승인 전까지는 `docs/research/tts/` 경로에서만 작업 유지

---

## 9) 참고: 정리된/삭제된 항목

- 이번 세션에서 임시 edge-tts 테스트 파일/스크립트는 요청에 따라 삭제 완료
- 현재 기준 활성 TTS 실험 진입점은 `docs/research/tts/*.py` 두 파일

