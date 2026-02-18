// temp_youtube_finder.js
const fs = require('fs');

const dbPath = '/Users/jin/Documents/tangshi/archive/database.json';
const outputFile = '/Users/jin/Documents/tangshi/docs/research/07_유튜브링크_포함_시_목록_260215_GE.md';

try {
    const jsonString = fs.readFileSync(dbPath, 'utf8');
    const db = JSON.parse(jsonString);

    let markdown = `# 유튜브 링크가 포함된 시 목록\\n\\n`;
    markdown += '이 목록은 `archive/database.json` 파일에서 추출되었습니다.\\n\\n';
    markdown += '| 시인 | 시 제목 | 유튜브 링크 |\\n';
    markdown += '|---|---|---|\\n';

    const found = new Set();
    // Using new RegExp constructor to avoid escaping issues.
    // The backslashes for the regex need to be double-escaped for the string literal.
    const youtubePattern = "https?://(?:www\\\\.)?(?:youtu\\\\.be/|youtube\\\\.com/)[^\\\\s\\\"'<`]+";
    const youtubeRegex = new RegExp(youtubePattern, "g");

    for (const entry of db.data) {
        if (entry.type === 'poet' && entry.poems) {
            const poetName = entry.name.trim();
            for (const poem of entry.poems) {
                if (!poem) continue;

                const poemTitle = poem.title ? poem.title.trim() : '제목 없음';
                const content = poem.content;
                
                if (content) {
                    const matches = content.match(youtubeRegex);
                    if (matches) {
                        const uniqueLinks = [...new Set(matches)];
                        for (const link of uniqueLinks) {
                             const key = `${poetName}|${poemTitle}|${link}`;
                             if (!found.has(key)) {
                                markdown += `| ${poetName} | ${poemTitle} | ${link} |\\n`;
                                found.add(key);
                            }
                        }
                    }
                }
            }
        }
    }
    
    fs.writeFileSync(outputFile, markdown.trim() + '\\n');

} catch (error) {
    // Error logging for debugging, but won't show in agent output
    // fs.writeFileSync('/Users/jin/Documents/tangshi/debug_error.log', error.stack);
    process.exit(1);
}