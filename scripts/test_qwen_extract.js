const fs = require('fs');
const path = require('path');

// 경로 설정
const QWEN_FILE = path.join(__dirname, '../docs/research/qwen_translations/qwen_translation_20260221_143125.json');
const FULL_DB_FILE = path.join(__dirname, '../public/index/poems.full.json');
const OWNED_DB_FILE = path.join(__dirname, '../public/index/poems.full.owned.json'); // 기본 타겟
const TEST_OUT_FILE = path.join(__dirname, '../public/index/poems.qwen_test.json');

// 유틸리티: 마크다운 텍스트 파싱
// Qwen의 응답(markdown) 구조:
// ... (원문/집평)
// ### 번역
// (내용)
// ### 집평 번역
// (내용)
// ### 주석
// 1. **(head)**: (text) ...
// ### 해설
// (내용)
function parseQwenMarkdown(markdown) {
    const result = {
        translationKoOwned: "",
        jipyeongKoOwned: "",
        commentaryKoOwned: "",
        notesOwned: []
    };

    if (!markdown) return result;

    // 정규식을 사용한 섹션 분리. 각 헤딩 사이의 내용을 추출합니다.
    const regexTranslation = /###\s*번역\s*\n([\s\S]*?)(?=\n*###|$)/i;
    const regexJipyeong = /###\s*(?:집평|집평\s*번역)\s*\n([\s\S]*?)(?=\n*###|$)/i;
    const regexNotes = /###\s*주석\s*\n([\s\S]*?)(?=\n*###|$)/i;
    const regexCommentary = /###\s*해설\s*\n([\s\S]*)/i;

    const matchTra = markdown.match(regexTranslation);
    if (matchTra) result.translationKoOwned = matchTra[1].trim();

    const matchJip = markdown.match(regexJipyeong);
    if (matchJip) result.jipyeongKoOwned = matchJip[1].trim();

    const matchCom = markdown.match(regexCommentary);
    if (matchCom) result.commentaryKoOwned = matchCom[1].trim();

    const matchNot = markdown.match(regexNotes);
    if (matchNot) {
        const notesText = matchNot[1].trim();
        const noteLines = notesText.split('\n');
        let currentNote = null;

        // 1. **head**: text 형식 매칭
        // 때론 **[head]** 또는 그냥 1. head : text 등 변형 대응 필요
        // 일반적인 형태: ^\d+[.)]\s*(?:\*\*)?(.*?)(?:\*\*)?\s*:\s*(.*)$
        const noteLineRegex = /^(\d+)[.)]\s*(?:\*\*)?(?:\[|【)?([^\]】\*]*?)(?:\]|】)?(?:\*\*)?\s*[:：]\s*(.*)$/;
        const noteLineRegexAlt = /^(\d+)[.)]\s*(.+?)[:：]\s*(.*)$/; // 단순 버전

        noteLines.forEach(line => {
            line = line.trim();
            if (!line) return;

            let m = line.match(noteLineRegex);
            if (!m) m = line.match(noteLineRegexAlt);

            if (m) {
                if (currentNote) result.notesOwned.push(currentNote);
                currentNote = {
                    no: parseInt(m[1], 10),
                    head: m[2].trim(),
                    text: m[3].trim()
                };
            } else if (currentNote) {
                // 줄바꿈 대응
                currentNote.text += '\n' + line;
            }
        });
        if (currentNote) result.notesOwned.push(currentNote);
    }

    return result;
}

async function run() {
    console.log('--- Test Extraction ---');

    if (!fs.existsSync(QWEN_FILE)) {
        console.error(`Error: Cannot find Qwen file: ${QWEN_FILE}`);
        return;
    }

    const targetDbPath = fs.existsSync(OWNED_DB_FILE) ? OWNED_DB_FILE : FULL_DB_FILE;
    if (!fs.existsSync(targetDbPath)) {
        console.error(`Error: Cannot find DB file: ${targetDbPath}`);
        return;
    }

    const qwenData = JSON.parse(fs.readFileSync(QWEN_FILE, 'utf-8'));
    const dbData = JSON.parse(fs.readFileSync(targetDbPath, 'utf-8'));

    if (!qwenData.results || !qwenData.results.length) {
        console.error('No results found in Qwen data.');
        return;
    }

    // Qwen 데이터 중 122번 시를 무조건 포함하여 10개 선택
    const q122 = qwenData.results.find(q => q.poemNoStr === "122");
    const others = qwenData.results.filter(q => q.poemNoStr !== "122").sort(() => 0.5 - Math.random());
    const selected = [q122, ...others].filter(Boolean).slice(0, 10);

    console.log(`Selected ${selected.length} random poems for test.`);

    // DB 데이터를 Map으로 생성 (빠른 조회를 위해)
    const dbMap = new Map();
    dbData.forEach((p, idx) => {
        // poemNoStr가 없으면 titleId나 구조에서 추측. 보통 있음.
        const key = p.poemNoStr || String(p.poemNo || "").padStart(3, "0");
        dbMap.set(key, { index: idx, data: p });
    });

    let matchCount = 0;

    selected.forEach(qItem => {
        const key = qItem.poemNoStr;
        const dbEntry = dbMap.get(key);

        if (dbEntry) {
            matchCount++;
            const parsed = parseQwenMarkdown(qItem.markdown);

            // 기존 DB 데이터에 병합
            const targetPoem = dbData[dbEntry.index];
            targetPoem.translationKoOwned = parsed.translationKoOwned;
            targetPoem.jipyeongKoOwned = parsed.jipyeongKoOwned;
            targetPoem.commentaryKoOwned = parsed.commentaryKoOwned;
            targetPoem.notesOwned = parsed.notesOwned;

            // 메타 갱신
            targetPoem.ownedContentMeta = {
                editedBy: "Qwen_Test",
                updatedAt: new Date().toISOString(),
                status: "translated",
                model: qwenData.model || "qwen-plus-latest"
            };

            console.log(`  [Match] No: ${key} / Title: ${targetPoem.title?.ko || targetPoem.title?.zh}`);
        } else {
            console.log(`  [Skip] No: ${key} not found in DB.`);
        }
    });

    // 테스트 파일로 전체 덤프 저장
    fs.writeFileSync(TEST_OUT_FILE, JSON.stringify(dbData, null, 2), 'utf-8');
    console.log(`\nSuccessfully created test file: ${TEST_OUT_FILE} with ${matchCount} updated poems.`);
}

run();
