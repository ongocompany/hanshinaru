/**
 * merge_poet_data.js
 * 
 * 목적:
 * 1. docs/research/ 폴더의 조사 결과(MD 파일)에서 JSON 데이터를 추출
 * 2. public/index/db_author.with_ko.json 파일에 병합 (birthplace, relations)
 * 3. relations 중 'EXT_'로 시작하는 외부 인물을 추출하여 docs/research/ext_figures_list.json 저장
 * 
 * 실행:
 *   node scripts/merge_poet_data.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const DB_PATH = path.join(ROOT, 'public/index/db_author.with_ko.json');
const RESEARCH_DIR = path.join(ROOT, 'docs/research');
const EXT_OUTPUT_PATH = path.join(ROOT, 'docs/research/ext_figures_list.json');

// 조사 결과 파일 목록
const RESEARCH_FILES = [
    '01_시인72명_데이터조사_250214_GE.md',
    '02_시인72명_데이터조사_250214_GE.md',
    '03_시인72명_데이터조사_250214_GE.md',
    '04_시인72명_데이터조사_250214_GE.md',
    '05_시인72명_데이터조사_250214_GE.md',
    '06_시인72명_데이터조사_250214_GE.md'
];

function extractJsonFromMd(content) {
    // 마크다운 내 ```json ... ``` 블록 추출
    const match = content.match(/```json\n([\s\S]*?)\n```/);
    return match ? JSON.parse(match[1]) : null;
}

function main() {
    // 1. DB 로드
    if (!fs.existsSync(DB_PATH)) {
        console.error(`❌ DB file not found: ${DB_PATH}`);
        return;
    }
    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    const authors = db.authors || {};

    let mergedCount = 0;
    const extFigures = new Map();

    // 2. 조사 파일 순회 및 병합
    RESEARCH_FILES.forEach(file => {
        const filePath = path.join(RESEARCH_DIR, file);
        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️ Research file not found: ${filePath}`);
            return;
        }
        const content = fs.readFileSync(filePath, 'utf8');
        const data = extractJsonFromMd(content);

        if (!data) return;

        Object.keys(data).forEach(authorId => {
            const researchData = data[authorId];
            
            if (authors[authorId]) {
                // 출생지 병합
                if (researchData.birthplace) {
                    authors[authorId].birthplace = researchData.birthplace;
                }
                // 관계 데이터 병합
                if (researchData.relations) {
                    authors[authorId].relations = researchData.relations;

                    // 외부 인물(EXT_) 수집
                    researchData.relations.forEach(rel => {
                        if (rel.targetId && rel.targetId.startsWith('EXT_')) {
                            if (!extFigures.has(rel.targetId)) {
                                extFigures.set(rel.targetId, {
                                    id: rel.targetId,
                                    name: rel.targetName || "",
                                    nameKo: rel.targetNameKo || "",
                                    desc: rel.desc || ""
                                });
                            }
                        }
                    });
                }
                mergedCount++;
            }
        });
    });

    // 4. 외부 인물 목록 저장
    const extList = Array.from(extFigures.values()).sort((a, b) => a.id.localeCompare(b.id));
    fs.writeFileSync(EXT_OUTPUT_PATH, JSON.stringify(extList, null, 2), 'utf8');
    console.log(`✅ Saved ${extList.length} external figures to ${path.basename(EXT_OUTPUT_PATH)}`);

    // 5. 외부 인물을 authors DB에도 추가 (UI 표시용)
    let extCount = 0;
    extList.forEach(ext => {
        if (!authors[ext.id]) {
            authors[ext.id] = {
                titleId: ext.id,
                name: {
                    zh: ext.name,
                    ko: ext.nameKo
                },
                life: {
                    birth: null,
                    death: null,
                    raw: "외부인물",
                    birthApprox: false,
                    deathApprox: false
                },
                bioKo: ext.desc,
                isExternal: true
            };
            extCount++;
        }
    });
    console.log(`✅ Added ${extCount} external figures to main DB for UI display`);

    // 3. DB 저장 (순서 변경: 외부 인물 추가 후 저장)
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
    console.log(`✅ Merged data for ${mergedCount} authors into ${path.basename(DB_PATH)}`);
}

main();