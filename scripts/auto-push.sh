#!/bin/bash
# ============================================
# tangshi 프로젝트 자동 push 스크립트
# 밤 10시 ~ 아침 8시, 변경사항 있으면 자동 commit + push
# ============================================

REPO_DIR="/Users/jin/Documents/tangshi"
LOG_FILE="$REPO_DIR/scripts/auto-push.log"
BRANCH="jin-practice-01"

# --- 시간 체크 (22:00 ~ 07:59) ---
HOUR=$(date +%H)
if [ "$HOUR" -ge 8 ] && [ "$HOUR" -lt 22 ]; then
    exit 0  # 낮 시간이면 아무것도 안 함
fi

cd "$REPO_DIR" || exit 1

# --- 변경사항 체크 ---
CHANGES=$(git status --porcelain 2>/dev/null)
if [ -z "$CHANGES" ]; then
    exit 0  # 변경사항 없으면 종료
fi

# --- 현재 브랜치 확인 ---
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null)
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M')] 브랜치가 $BRANCH 아님 ($CURRENT_BRANCH). 스킵." >> "$LOG_FILE"
    exit 0
fi

# --- 자동 commit + push ---
TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
FILE_COUNT=$(echo "$CHANGES" | wc -l | tr -d ' ')

git add -A
git commit -m "[Auto] 야간 자동 저장 ($FILE_COUNT개 파일, $TIMESTAMP)"
COMMIT_RESULT=$?

if [ $COMMIT_RESULT -eq 0 ]; then
    git push origin "$BRANCH"
    PUSH_RESULT=$?
    if [ $PUSH_RESULT -eq 0 ]; then
        echo "[$TIMESTAMP] push 성공 - ${FILE_COUNT}개 파일" >> "$LOG_FILE"

        # --- docs 변경이 있으면 Notion 동기화 ---
        DOCS_CHANGED=$(echo "$CHANGES" | grep "docs/")
        NOTION_CONFIG="$REPO_DIR/scripts/notion-config.json"
        if [ -n "$DOCS_CHANGED" ] && [ -f "$NOTION_CONFIG" ]; then
            node "$REPO_DIR/scripts/notion-sync.js" >> "$LOG_FILE" 2>&1
            echo "[$TIMESTAMP] Notion 동기화 실행" >> "$LOG_FILE"
        fi
    else
        echo "[$TIMESTAMP] push 실패 (에러코드: $PUSH_RESULT)" >> "$LOG_FILE"
    fi
else
    echo "[$TIMESTAMP] commit 실패 (에러코드: $COMMIT_RESULT)" >> "$LOG_FILE"
fi
