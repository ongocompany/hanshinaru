const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../archive/database.json');
const outPath = path.join(__dirname, '../docs/research/07_유튜브링크_포함_시_목록_260215_GE.md');

try {
  if (!fs.existsSync(dbPath)) {
    console.error(`Error: Database file not found at ${dbPath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(dbPath, 'utf8');
  const db = JSON.parse(rawData);
  const items = db.data || [];

  let markdownContent = `# 유튜브 링크가 포함된 시 목록\n\n이 목록은 \`archive/database.json\` 파일에서 추출되었습니다.\n\n| 시인 | 시 제목 | 유튜브 링크 |\n|---|---|---|\n`;

  let count = 0;
  // 정규식 개선: 유튜브 링크 패턴을 좀 더 포괄적으로 매칭 (youtu.be 및 youtube.com)
  const linkRegex = /(https?:\/\/(?:www\.|m\.)?(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))[\w\-]+(?:[\&\?][\w\-=]+)*)/g;

  // 제목에서 주석([* ...]) 제거 + 파이프 이스케이프 (테이블 깨짐 방지)
  function cleanTitle(title) {
    return (title || '')
      .replace(/\[\*[^\]]*\]/g, '')  // [* ...] 주석 제거
      .replace(/\|/g, '｜')          // 파이프 → 전각으로 (테이블 보호)
      .trim();
  }

  items.forEach(item => {
    if (item.type === 'poet' && Array.isArray(item.poems)) {
      item.poems.forEach(poem => {
        // simplified, content, desc 필드 모두에서 링크 검색
        const textToCheck = [poem.simplified, poem.content, poem.desc].join('\n');
        const matches = textToCheck.match(linkRegex);

        if (matches) {
          // 중복 링크 제거
          const uniqueLinks = [...new Set(matches)];
          uniqueLinks.forEach(link => {
            markdownContent += `| ${item.name} | ${cleanTitle(poem.title)} | [바로가기](${link}) |\n`;
            count++;
          });
        }
      });
    }
  });

  if (count === 0) {
    markdownContent += `| - | - | (추출된 링크 없음) |\n`;
  }

  fs.writeFileSync(outPath, markdownContent, 'utf8');
  console.log(`Successfully extracted ${count} links to ${outPath}`);

} catch (err) {
  console.error('Error:', err);
}