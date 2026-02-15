# GitHub 다중 환경 작업 가이드

작성일: 2026-02-11  
대상 환경: 집 PC(macOS) / 회사 PC(macOS) / 노트북(macOS) / 거실 PC(Windows)

## 1) 문서 목적
- 여러 기기에서 같은 저장소를 안전하게 이어서 작업하기 위한 실전 루틴 정리.
- 초보자 기준으로 "언제 무엇을 실행하는지"를 고정해 충돌/유실을 줄임.

## 2) GitHub/Git 용어 간단 설명
- `Repository(저장소)`: 프로젝트 파일과 변경 이력을 담는 공간.
- `Branch(브랜치)`: main에서 갈라져 나온 작업 라인.
- `Commit(커밋)`: "여기까지 작업 완료"를 기록한 저장 지점.
- `Pull(풀)`: 원격(GitHub) 변경을 내 컴퓨터로 가져오는 작업.
- `Push(푸시)`: 내 컴퓨터의 커밋을 원격(GitHub)으로 올리는 작업.
- `Merge(머지)`: 브랜치 작업을 main에 합치는 작업.
- `PR(Pull Request)`: 머지 전에 변경 내용을 검토/승인받는 절차.
- `Conflict(충돌)`: 같은 파일의 같은 부분을 서로 다르게 고쳐 자동 병합이 안 되는 상태.
- `origin`: 내 로컬 저장소가 연결된 기본 원격 저장소 이름.

## 3) 기본 원칙 (반드시 기억)
1. 기기를 바꾸기 전에는 반드시 `commit + push`.
2. 새 기기에서 시작할 때는 반드시 `main` 최신화 후 작업 브랜치로 이동.
3. `main`에서 직접 기능 개발하지 않기.
4. 한 브랜치에는 한 작업 목적만 담기.

## 4) 기기별 1회 초기 설정
### 4-1. 저장소 클론
```bash
git clone https://github.com/leejinwoo1973/tangshi-timeline.git
cd tangshi-timeline
```

### 4-2. 사용자 정보 확인
```bash
git config user.name
git config user.email
```

### 4-3. 줄바꿈 충돌 방지
- 저장소 루트의 `.gitattributes`에 아래 내용 권장:
```gitattributes
* text=auto eol=lf
```

## 5) 작업 시작 루틴 (매번)
```bash
git checkout main
git pull origin main
git checkout 내-작업-브랜치
git pull origin 내-작업-브랜치
git status
```

설명:
1. `main` 최신화를 먼저 받는다.
2. 내 브랜치로 이동하고, 원격 브랜치 변경도 받는다.
3. `git status`로 깨끗한 상태인지 확인한다.

## 6) 작업 중 루틴 (중간 점검)
### 6-1. 변경 확인
```bash
git status
git diff --name-only
```

### 6-2. 작은 단위 커밋
```bash
git add .
git commit -m "[JIN][Feat] 작업 요약"
```

## 7) 작업 종료 루틴 (기기 이동 전 필수)
```bash
git status
git add .
git commit -m "[주체][유형] 작업 요약"
git push
```

종료 체크:
1. 커밋 없이 기기 종료하지 않았는가
2. push까지 완료했는가
3. 다음 기기에서 이어갈 브랜치 이름을 알고 있는가

## 8) 기기 이동 루틴
### 8-1. 이전 기기
1. `commit`
2. `push`
3. 브랜치 이름 기록

### 8-2. 다음 기기
1. 저장소 열기
2. `git checkout main && git pull origin main`
3. `git checkout 브랜치명 && git pull origin 브랜치명`
4. `git status` 확인 후 작업 시작

## 9) 멀티 AI 협업 시 시작 프롬프트
- 세션 시작 시 아래 문장 사용:
  - `이 프로젝트는 docs/project_context.md, docs/collaboration_rules.md, docs/github_multi_environment_guide.md 기준으로 작업해줘.`

## 10) 자주 생기는 문제와 대응
### 10-1. 문제: 다른 기기에서 최신 코드가 안 보임
- 원인: 이전 기기에서 push 누락.
- 대응: 이전 기기에서 `git log -1`, `git push` 확인 후 다시 pull.

### 10-2. 문제: pull 시 충돌(conflict) 발생
- 원인: 같은 파일의 같은 부분을 두 기기에서 다르게 수정.
- 대응:
1. 충돌 파일 확인
2. 기능 기준으로 수동 선택
3. 해결 후 `add -> commit` 진행

### 10-3. 문제: main에 실수로 직접 커밋
- 대응:
1. 바로 새 브랜치 생성 `git checkout -b emergency-main-save-01`
2. 해당 브랜치를 push
3. 이후 정리/머지는 검토 후 진행

## 11) 자동화해서 일괄 실행할 수 있나?
가능하다. 다만 자동화는 "반복 루틴"까지만 하고, 충돌 해결과 머지 판단은 직접 확인이 필요하다.

### 11-1. 추천 자동화 대상
1. 작업 시작 루틴 (`main` 최신화 + 작업 브랜치 이동 + 상태 확인)
2. 작업 종료 루틴 (`status` 확인 + add + commit + push)

### 11-2. macOS/Linux용 alias 예시 (`~/.zshrc`)
```bash
# 사용법: gstart 브랜치명
gstart() {
  git checkout main &&
  git pull origin main &&
  git checkout "$1" &&
  git pull origin "$1" &&
  git status
}

# 사용법: gend "[JIN][Feat] 메시지"
gend() {
  git status &&
  git add . &&
  git commit -m "$1" &&
  git push
}
```

### 11-3. Windows PowerShell 함수 예시 (`$PROFILE`)
```powershell
function gstart($branch) {
  git checkout main
  git pull origin main
  git checkout $branch
  git pull origin $branch
  git status
}

function gend($msg) {
  git status
  git add .
  git commit -m $msg
  git push
}
```

### 11-4. 주의사항
1. 자동화 명령 실행 전 `branch` 이름을 반드시 확인한다.
2. `gend` 실행 전 커밋에 넣지 말아야 할 파일이 없는지 `git status`를 본다.
3. 충돌이 난 경우 자동화를 멈추고 수동으로 해결한다.

## 12) 빠른 체크리스트
- [ ] 시작 전에 `main` 최신화를 했다.
- [ ] 작업 브랜치에서 작업 중이다.
- [ ] 중간에 `git status`로 확인했다.
- [ ] 종료 전에 `commit + push`를 완료했다.
- [ ] 다음 기기에서 같은 브랜치로 이어갈 준비가 됐다.
