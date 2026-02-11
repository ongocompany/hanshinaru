/**
 * generate_author_name_ko.js
 *
 * 목적:
 * - db_author.json의 name.zh(한자 이름) → 한국 한자음 기반 name.ko 자동 생성
 * - 원본(db_author.json) 절대 수정 X
 * - 결과: db_author.ko.json
 *
 * 실행:
 *   node generate_author_name_ko.js
 *
 * 추가:
 * - 매핑이 부족하면 missing_hanja.json이 생성됩니다.
 * - 그 파일을 보고 hanja_kr_custom_map.json에 필요한 글자만 보충하면 끝.
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const INPUT = path.join(ROOT, "db_author.json");
const OUTPUT = path.join(ROOT, "db_author.ko.json");
const CUSTOM_MAP_PATH = path.join(ROOT, "hanja_kr_custom_map.json");
const MISSING_PATH = path.join(ROOT, "missing_hanja.json");

/**
 * 1) 최소 내장 한자음(자주 나오는 성씨/시인명 글자 위주)
 * - 여기만으로도 꽤 커버됨
 * - 부족분은 custom map으로 보완 (하드코딩 X, 파일로 분리)
 */
const BASE_MAP = {
  // 성씨/흔한 글자
  "李": "이",
  "杜": "두",
  "王": "왕",
  "孟": "맹",
  "白": "백",
  "韓": "한",
  "劉": "유",
  "韋": "위",
  "柳": "유",
  "陳": "진",
  "張": "장",
  "元": "원",
  "蘇": "소",
  "盧": "노",
  "羅": "라",
  "馬": "마",
  "楊": "양",
  "許": "허",
  "高": "고",
  "鄭": "정",
  "沈": "심",
  "溫": "온",
  "岑": "잠",
  "崔": "최",
  "裴": "배",
  "賈": "가",
  "郭": "곽",
  "錢": "전",
  "孫": "손",
  "趙": "조",
  "周": "주",
  "吳": "오",
  "徐": "서",
  "何": "하",
  "曹": "조",
  "孔": "공",
  "武": "무",
  "薛": "설",
  "范": "범",
  "秦": "진",
  "顧": "고",
  "歐": "구",
  "歐陽": "구양", // (참고용: 본 스크립트는 글자 단위라 실제로는 아래 두 글자가 필요)
  "歐": "구",
  "陽": "양",

  // 이름에 자주 나오는 글자(당시 시인들에 많이 출현)
  "白": "백",
  "甫": "보",
  "維": "유",
  "浩": "호",
  "然": "연",
  "禹": "우",
  "錫": "석",
  "愈": "유",
  "牧": "목",
  "商": "상",
  "隱": "은",
  "郊": "교",
  "賀": "하",
  "知": "지",
  "章": "장",
  "岱": "대",
  "齡": "령",
  "昌": "창",
  "齡": "령",
  "參": "참",
  "嶺": "령",
  "涼": "량",
  "宗": "종",
  "元": "원",
  "稹": "진",
  "居": "거",
  "易": "이",
  "白": "백",
  "居": "거",
  "易": "이",
  "溫": "온",
  "庭": "정",
  "筠": "균",
  "韋": "위",
  "莊": "장",
  "李": "이",
  "商": "상",
  "隱": "은",
  "杜": "두",
  "牧": "목",
  "王": "왕",
  "勃": "발",
  "駱": "낙",
  "賓": "빈",
  "王": "왕",
  "維": "유",
  "王": "왕",
  "昌": "창",
  "齡": "령",
  "岑": "잠",
  "參": "참",
  "孟": "맹",
  "浩": "호",
  "然": "연",
  "劉": "유",
  "長": "장",
  "卿": "경",
  "錢": "전",
  "起": "기",
  "韋": "위",
  "應": "응",
  "物": "물",
  "戴": "대",
  "叔": "숙",
  "倫": "륜",
  "王": "왕",
  "翰": "한",
  "高": "고",
  "適": "적",
  "盧": "노",
  "綸": "륜",

  // 숫자/기타 흔한 표기(이름에 끼는 경우 대비)
  "一": "일",
  "二": "이",
  "三": "삼",
  "四": "사",
  "五": "오",
  "六": "육",
  "七": "칠",
  "八": "팔",
  "九": "구",
  "十": "십",
};

/**
 * 유틸: JSON 읽기
 */
function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (e) {
    return fallback;
  }
}

/**
 * 유틸: JSON 쓰기
 */
function writeJson(filePath, obj) {
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), "utf8");
}

/**
 * 2) 커스텀 매핑 로드/생성
 * - 파일이 없으면 자동 생성(빈 객체)
 * - 형은 “필요할 때만” 여기 채우면 됨 (missing_hanja.json 보고 최소만)
 */
function ensureCustomMap() {
  if (!fs.existsSync(CUSTOM_MAP_PATH)) {
    writeJson(CUSTOM_MAP_PATH, {});
  }
  const custom = readJson(CUSTOM_MAP_PATH, {});
  return custom && typeof custom === "object" ? custom : {};
}

/**
 * 3) 한자 문자열을 한국 한자음으로 변환
 * - 글자 단위 변환
 * - 매핑 없으면 missing에 기록
 */
function hanjaToKoreanReading(hanja, map, missingCounter, sampleMap) {
  if (!hanja || typeof hanja !== "string") return "";

  let out = "";
  for (const ch of hanja) {
    // 공백/중간점/특수문자 처리
    if (ch === " " || ch === "·" || ch === "・" || ch === "　") continue;

    const v = map[ch];
    if (v) {
      out += v;
      continue;
    }

    // 매핑 없는 글자: 기록
    missingCounter[ch] = (missingCounter[ch] || 0) + 1;
    if (!sampleMap[ch]) sampleMap[ch] = [];
    if (sampleMap[ch].length < 10) sampleMap[ch].push(hanja);

    // 출력은 일단 빈칸 처리하면 이름이 깨지니까
    // 최소한 원문 글자를 그대로 넣어 “어디가 비었는지” 보이게 함
    out += ch;
  }
  return out;
}

/**
 * 4) db_author 구조 다양성 대응
 * - name.zh가 없고 name이 문자열인 경우도 대응
 */
function extractZhName(author) {
  if (!author) return "";
  const n = author.name;

  if (typeof n === "string") return n;
  if (n && typeof n === "object") {
    if (typeof n.zh === "string") return n.zh;
    if (typeof n.han === "string") return n.han; // 혹시 han 키가 쓰인 경우
    if (typeof n.cn === "string") return n.cn;
  }
  if (typeof author.nameZh === "string") return author.nameZh;
  return "";
}

function injectKoName(author, ko) {
  if (!author) return author;

  // name이 문자열이면 객체로 승격
  if (typeof author.name === "string") {
    author.name = { zh: author.name, ko };
    return author;
  }

  if (!author.name || typeof author.name !== "object") {
    author.name = { zh: "", ko };
    return author;
  }

  author.name.ko = ko;
  // zh가 비어있으면 채움
  if (!author.name.zh) author.name.zh = extractZhName(author);
  return author;
}

/**
 * main
 */
(function main() {
  if (!fs.existsSync(INPUT)) {
    console.error(`❌ 입력 파일이 없습니다: ${INPUT}`);
    console.error(`   현재 폴더에 db_author.json을 두고 실행하세요.`);
    process.exit(1);
  }

  const authors = readJson(INPUT, null);
  if (!Array.isArray(authors)) {
    console.error("❌ db_author.json이 배열(Array) 형태가 아닙니다.");
    process.exit(1);
  }

  const customMap = ensureCustomMap();
  const map = { ...BASE_MAP, ...customMap };

  const missingCounter = {};
  const sampleMap = {};

  const out = authors.map((a) => {
    const cloned = JSON.parse(JSON.stringify(a));
    const zh = extractZhName(cloned);
    const ko = hanjaToKoreanReading(zh, map, missingCounter, sampleMap);
    injectKoName(cloned, ko);
    return cloned;
  });

  writeJson(OUTPUT, out);

  // missing 정리해서 파일로 저장 (빈 값이면 파일은 안 만들지 않고 깔끔하게)
  const missingKeys = Object.keys(missingCounter);
  if (missingKeys.length) {
    // 빈도 내림차순
    missingKeys.sort((a, b) => missingCounter[b] - missingCounter[a]);

    const missingReport = missingKeys.map((ch) => ({
      hanja: ch,
      count: missingCounter[ch],
      examples: sampleMap[ch] || [],
      suggestion: "hanja_kr_custom_map.json에 이 글자의 한국 한자음을 추가하세요.",
    }));

    writeJson(MISSING_PATH, missingReport);

    console.log("✅ 완료: db_author.ko.json 생성");
    console.log("⚠️  누락 한자 발견: missing_hanja.json 생성");
    console.log("   → hanja_kr_custom_map.json에 필요한 글자만 보충 후 다시 실행하면 끝.");
  } else {
    // 혹시 예전 실행의 missing 파일이 남아있으면 정리
    if (fs.existsSync(MISSING_PATH)) fs.unlinkSync(MISSING_PATH);

    console.log("✅ 완료: db_author.ko.json 생성");
    console.log("🎉 누락 한자 없음 (custom map 보완 불필요)");
  }
})();
