/**
 * archive/database.json에서 유튜브 링크를 추출하여
 * poems.full.json의 media.youtube 필드에 매핑
 *
 * 매칭 로직: 한글 시인명 + 중국어 제목 핵심 한자 비교
 */

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../archive/database.json');
const POEMS_PATH = path.join(__dirname, '../public/index/poems.full.json');

// 유튜브 링크 정규식 (한자/한글 섞이는 경우 대비, URL 문자만 추출)
const YT_REGEX = /(https?:\/\/(?:www\.|m\.)?(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))[\w\-]+(?:[&?][\w\-.=%]+)*)/g;

// 제목에서 핵심 한자만 추출 (괄호, 주석, 한글, 숫자 등 제거)
function extractCoreChars(title) {
  return (title || '')
    .replace(/〈|〉/g, '')           // 꺾쇠 제거
    .replace(/\[\*[^\]]*\]/g, '')    // [* ...] 주석 제거
    .replace(/\[[^\]]*\]/g, '')      // [...] 태그 제거
    .replace(/\(.*?\)/g, '')         // (...) 제거
    .replace(/其[一二三四五六七八九十\d]+/g, '')  // 其二, 其三 등 제거
    .replace(/[a-zA-Z0-9]/g, '')     // 영문/숫자 제거
    .replace(/[가-힣]/g, '')         // 한글 제거
    .replace(/[,，、·\s]/g, '')      // 구두점/공백 제거
    .replace(/四首|二首|三首|幷序/g, '')  // "四首", "幷序" 등 제거
    .trim();
}

function main() {
  // 1. database.json 로드
  if (!fs.existsSync(DB_PATH)) {
    console.error('Error: database.json not found');
    process.exit(1);
  }
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  const dbItems = db.data || [];

  // 2. 유튜브 링크 추출 (한글 시인명 + 제목 + 링크)
  const ytEntries = [];
  dbItems.forEach(item => {
    if (item.type !== 'poet' || !Array.isArray(item.poems)) return;
    const poetNameKo = item.name || '';

    item.poems.forEach(poem => {
      const text = [poem.simplified, poem.content, poem.desc].join('\n');
      const matches = text.match(YT_REGEX);
      if (!matches) return;

      const uniqueLinks = [...new Set(matches)];
      const titleCore = extractCoreChars(poem.title);

      ytEntries.push({
        poetKo: poetNameKo,
        titleRaw: poem.title,
        titleCore: titleCore,
        links: uniqueLinks,
      });
    });
  });

  console.log(`database.json에서 유튜브 링크 ${ytEntries.length}건 추출`);

  // 3. poems.full.json 로드
  const poems = JSON.parse(fs.readFileSync(POEMS_PATH, 'utf8'));
  console.log(`poems.full.json: ${poems.length}편`);

  // 4. 매칭 + media.youtube 할당
  let matched = 0;
  let unmatched = [];
  let totalLinks = 0;

  ytEntries.forEach(entry => {
    // 한글 시인명으로 후보 필터
    const candidates = poems.filter(p => {
      const poetKo = (p.poet?.ko || '').trim();
      // "당 현종" vs "당현종" 같은 공백 차이 처리
      return poetKo.replace(/\s/g, '') === entry.poetKo.replace(/\s/g, '');
    });

    if (candidates.length === 0) {
      unmatched.push(`[시인 미발견] ${entry.poetKo}: ${entry.titleRaw}`);
      return;
    }

    // 제목 핵심 한자로 매칭
    const entryCore = entry.titleCore;
    let bestMatch = null;
    let bestScore = 0;

    candidates.forEach(poem => {
      const poemTitleCore = extractCoreChars(poem.title?.zh || '');

      // 포함 관계 확인 (짧은 쪽이 긴 쪽에 포함되는지)
      const shorter = entryCore.length <= poemTitleCore.length ? entryCore : poemTitleCore;
      const longer = entryCore.length > poemTitleCore.length ? entryCore : poemTitleCore;

      if (shorter && longer.includes(shorter)) {
        const score = shorter.length / longer.length;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = poem;
        }
      }

      // 정확히 같은 경우
      if (entryCore === poemTitleCore && entryCore.length > 0) {
        bestScore = 1;
        bestMatch = poem;
      }
    });

    if (bestMatch && bestScore >= 0.3) {
      // media.youtube에 링크 추가 (기존 링크와 병합)
      if (!bestMatch.media || typeof bestMatch.media !== 'object') {
        bestMatch.media = {};
      }
      if (!Array.isArray(bestMatch.media.youtube)) {
        bestMatch.media.youtube = [];
      }

      entry.links.forEach(link => {
        if (!bestMatch.media.youtube.includes(link)) {
          bestMatch.media.youtube.push(link);
          totalLinks++;
        }
      });
      matched++;
    } else {
      unmatched.push(`[제목 미매칭] ${entry.poetKo} "${entry.titleRaw}" (core: "${entryCore}")`);
    }
  });

  // 5. 저장
  fs.writeFileSync(POEMS_PATH, JSON.stringify(poems, null, 2), 'utf8');

  // 6. 결과 출력
  console.log(`\n=== 결과 ===`);
  console.log(`매칭 성공: ${matched}편`);
  console.log(`매칭 실패: ${unmatched.length}편`);
  console.log(`총 유튜브 링크: ${totalLinks}개`);

  if (unmatched.length > 0) {
    console.log(`\n--- 미매칭 목록 ---`);
    unmatched.forEach(msg => console.log(`  ${msg}`));
  }

  // media.youtube가 있는 시 개수
  const withYT = poems.filter(p => p.media?.youtube?.length > 0).length;
  console.log(`\npoems.full.json에 유튜브 링크 보유: ${withYT}편 / ${poems.length}편`);
}

main();
