#!/usr/bin/env node
/**
 * tangshi 프로젝트 docs/ → Notion 동기화 스크립트
 *
 * 사용법:
 *   node scripts/notion-sync.js          # docs/ 전체 동기화
 *   node scripts/notion-sync.js --dry    # 실제 업로드 없이 확인만
 *
 * 설정: scripts/notion-config.json
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function fileHash(content) {
  return crypto.createHash("md5").update(content).digest("hex");
}

// ============ 설정 로드 ============
const CONFIG_PATH = path.join(__dirname, "notion-config.json");
const MAP_PATH = path.join(__dirname, "notion-page-map.json");
const DOCS_DIR = path.join(__dirname, "..", "docs");

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error("❌ 설정 파일이 없습니다: scripts/notion-config.json");
    console.error("   아래 명령으로 생성하세요:");
    console.error('   node scripts/notion-sync.js --init');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
}

function loadPageMap() {
  if (!fs.existsSync(MAP_PATH)) return {};
  return JSON.parse(fs.readFileSync(MAP_PATH, "utf-8"));
}

function savePageMap(map) {
  fs.writeFileSync(MAP_PATH, JSON.stringify(map, null, 2), "utf-8");
}

// ============ --init: 설정 파일 생성 ============
if (process.argv.includes("--init")) {
  if (fs.existsSync(CONFIG_PATH)) {
    console.log("⚠️  설정 파일이 이미 있습니다:", CONFIG_PATH);
  } else {
    const template = {
      notionApiKey: "여기에_Notion_API_키_입력",
      parentPageId: "여기에_부모_페이지_ID_입력",
      _설명: {
        notionApiKey: "https://www.notion.so/my-integrations 에서 생성",
        parentPageId: "Notion에서 부모 페이지 열고 URL의 마지막 32자리"
      }
    };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(template, null, 2), "utf-8");
    console.log("✅ 설정 파일 생성됨:", CONFIG_PATH);
    console.log("   notion-config.json을 열어서 API 키와 페이지 ID를 입력하세요.");
  }
  process.exit(0);
}

const DRY_RUN = process.argv.includes("--dry");
const config = loadConfig();
const NOTION_KEY = config.notionApiKey;
const PARENT_PAGE_ID = config.parentPageId;

if (NOTION_KEY.includes("여기에") || PARENT_PAGE_ID.includes("여기에")) {
  console.error("❌ notion-config.json에 API 키와 페이지 ID를 입력하세요.");
  process.exit(1);
}

// ============ Notion API 호출 ============
const NOTION_VERSION = "2022-06-28";

async function notionFetch(endpoint, method = "GET", body = null) {
  const opts = {
    method,
    headers: {
      "Authorization": `Bearer ${NOTION_KEY}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`https://api.notion.com/v1${endpoint}`, opts);
  const data = await res.json();

  if (!res.ok) {
    console.error(`API 에러 (${res.status}):`, data.message || data);
    return null;
  }
  return data;
}

// ============ 마크다운 → Notion 블록 변환 ============

// 인라인 서식 파싱 (bold, italic, code, link)
function parseRichText(text) {
  const result = [];
  // 패턴: **bold**, *italic*, `code`, [text](url)
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|(\[(.+?)\]\((.+?)\))|([^*`\[]+)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match[2]) {
      // **bold**
      result.push({ type: "text", text: { content: match[2] }, annotations: { bold: true } });
    } else if (match[4]) {
      // *italic*
      result.push({ type: "text", text: { content: match[4] }, annotations: { italic: true } });
    } else if (match[6]) {
      // `code`
      result.push({ type: "text", text: { content: match[6] }, annotations: { code: true } });
    } else if (match[8] && match[9]) {
      // [text](url)
      result.push({ type: "text", text: { content: match[8], link: { url: match[9] } } });
    } else if (match[10]) {
      // plain text
      result.push({ type: "text", text: { content: match[10] } });
    }
  }

  return result.length ? result : [{ type: "text", text: { content: text } }];
}

// Notion이 지원하는 코드 언어 목록
const NOTION_LANGUAGES = new Set([
  "abap","abc","agda","arduino","ascii art","assembly","bash","basic","bnf",
  "c","c#","c++","clojure","coffeescript","coq","css","dart","dhall","diff",
  "docker","ebnf","elixir","elm","erlang","f#","flow","fortran","gherkin",
  "glsl","go","graphql","groovy","haskell","hcl","html","idris","java",
  "javascript","json","julia","kotlin","latex","less","lisp","livescript",
  "llvm ir","lua","makefile","markdown","markup","matlab","mathematica",
  "mermaid","nix","notion formula","objective-c","ocaml","pascal","perl",
  "php","plain text","powershell","prolog","protobuf","purescript","python",
  "r","racket","reason","ruby","rust","sass","scala","scheme","scss","shell",
  "smalltalk","solidity","sql","swift","toml","typescript","vb.net","verilog",
  "vhdl","visual basic","webassembly","xml","yaml","java/c/c++/c#"
]);

function sanitizeCodeLang(lang) {
  const l = lang.toLowerCase();
  if (NOTION_LANGUAGES.has(l)) return l;
  // 흔한 매핑
  const map = { "js": "javascript", "ts": "typescript", "py": "python",
    "rb": "ruby", "sh": "shell", "yml": "yaml", "md": "markdown",
    "txt": "plain text", "text": "plain text", "gitattributes": "plain text",
    "gitignore": "plain text", "env": "plain text", "csv": "plain text",
    "tsx": "typescript", "jsx": "javascript" };
  return map[l] || "plain text";
}

// 코드 블록을 2000자 제한에 맞게 분할
function makeCodeBlocks(content, lang) {
  const MAX = 2000;
  const safeLang = sanitizeCodeLang(lang);
  const text = content.replace(/\n$/, "");

  if (text.length <= MAX) {
    return [{
      object: "block", type: "code",
      code: { rich_text: [{ type: "text", text: { content: text } }], language: safeLang },
    }];
  }

  // 줄 단위로 분할
  const lines = text.split("\n");
  const result = [];
  let chunk = "";
  for (const line of lines) {
    if (chunk.length + line.length + 1 > MAX && chunk.length > 0) {
      result.push({
        object: "block", type: "code",
        code: { rich_text: [{ type: "text", text: { content: chunk } }], language: safeLang },
      });
      chunk = line;
    } else {
      chunk += (chunk ? "\n" : "") + line;
    }
  }
  if (chunk) {
    result.push({
      object: "block", type: "code",
      code: { rich_text: [{ type: "text", text: { content: chunk } }], language: safeLang },
    });
  }
  return result;
}

function markdownToBlocks(md) {
  const lines = md.split("\n");
  const blocks = [];
  let i = 0;
  let inCodeBlock = false;
  let codeContent = "";
  let codeLang = "";

  while (i < lines.length) {
    const line = lines[i];

    // --- 코드 블록 ---
    if (line.startsWith("```")) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLang = line.slice(3).trim() || "plain text";
        codeContent = "";
      } else {
        inCodeBlock = false;
        blocks.push(...makeCodeBlocks(codeContent, codeLang));
      }
      i++;
      continue;
    }

    if (inCodeBlock) {
      codeContent += line + "\n";
      i++;
      continue;
    }

    // --- 빈 줄 ---
    if (line.trim() === "") {
      i++;
      continue;
    }

    // --- 제목 ---
    const h3 = line.match(/^### (.+)/);
    if (h3) {
      blocks.push({
        object: "block", type: "heading_3",
        heading_3: { rich_text: parseRichText(h3[1]) },
      });
      i++; continue;
    }
    const h2 = line.match(/^## (.+)/);
    if (h2) {
      blocks.push({
        object: "block", type: "heading_2",
        heading_2: { rich_text: parseRichText(h2[1]) },
      });
      i++; continue;
    }
    const h1 = line.match(/^# (.+)/);
    if (h1) {
      blocks.push({
        object: "block", type: "heading_1",
        heading_1: { rich_text: parseRichText(h1[1]) },
      });
      i++; continue;
    }

    // --- 구분선 ---
    if (/^(-{3,}|_{3,}|\*{3,})$/.test(line.trim())) {
      blocks.push({ object: "block", type: "divider", divider: {} });
      i++; continue;
    }

    // --- 리스트 (불릿) ---
    const bullet = line.match(/^[-*+] (.+)/);
    if (bullet) {
      blocks.push({
        object: "block", type: "bulleted_list_item",
        bulleted_list_item: { rich_text: parseRichText(bullet[1]) },
      });
      i++; continue;
    }

    // --- 리스트 (번호) ---
    const numbered = line.match(/^\d+\. (.+)/);
    if (numbered) {
      blocks.push({
        object: "block", type: "numbered_list_item",
        numbered_list_item: { rich_text: parseRichText(numbered[1]) },
      });
      i++; continue;
    }

    // --- 인용 ---
    const quote = line.match(/^> (.+)/);
    if (quote) {
      blocks.push({
        object: "block", type: "quote",
        quote: { rich_text: parseRichText(quote[1]) },
      });
      i++; continue;
    }

    // --- 테이블 (| a | b |) --- 간단 처리: 코드 블록으로 변환
    if (line.trim().startsWith("|")) {
      let tableText = "";
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableText += lines[i] + "\n";
        i++;
      }
      blocks.push(...makeCodeBlocks(tableText.trim(), "plain text"));
      continue;
    }

    // --- 일반 문단 ---
    blocks.push({
      object: "block", type: "paragraph",
      paragraph: { rich_text: parseRichText(line) },
    });
    i++;
  }

  return blocks;
}

// ============ docs/ 파일 수집 ============
function collectMarkdownFiles(dir, baseDir = dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // .으로 시작하는 폴더 스킵
      if (entry.name.startsWith(".")) continue;
      files.push(...collectMarkdownFiles(fullPath, baseDir));
    } else if (entry.name.endsWith(".md")) {
      const relPath = path.relative(baseDir, fullPath);
      files.push({ fullPath, relPath, name: entry.name });
    }
  }
  return files;
}

// ============ 폴더 구조 → Notion 하위 페이지 생성 ============

// 폴더별 페이지 관리
async function getOrCreateFolderPage(folderName, parentId, pageMap) {
  const folderKey = `_folder_${folderName}`;
  if (pageMap[folderKey]) {
    return pageMap[folderKey];
  }

  // 폴더용 페이지 생성
  const folderTitle = {
    handoff: "📋 핸드오프",
    reference: "📚 레퍼런스",
    research: "🔬 리서치",
  }[folderName] || `📁 ${folderName}`;

  console.log(`  📁 폴더 페이지 생성: ${folderTitle}`);

  if (DRY_RUN) {
    pageMap[folderKey] = "dry-run-folder-id";
    return pageMap[folderKey];
  }

  const res = await notionFetch("/pages", "POST", {
    parent: { page_id: parentId },
    properties: {
      title: { title: [{ text: { content: folderTitle } }] },
    },
    children: [],
  });

  if (res) {
    pageMap[folderKey] = res.id;
    savePageMap(pageMap);
    return res.id;
  }
  return parentId; // 실패시 부모에 직접 생성
}

// ============ 페이지 생성/업데이트 ============

// Notion API는 한 번에 100블록까지만 허용
async function appendBlocksInChunks(pageId, blocks) {
  const CHUNK = 100;
  for (let i = 0; i < blocks.length; i += CHUNK) {
    const chunk = blocks.slice(i, i + CHUNK);
    await notionFetch(`/blocks/${pageId}/children`, "PATCH", { children: chunk });
  }
}

// 기존 블록 전부 삭제 (업데이트용)
async function deleteAllBlocks(pageId) {
  const res = await notionFetch(`/blocks/${pageId}/children?page_size=100`);
  if (!res || !res.results) return;

  for (const block of res.results) {
    await notionFetch(`/blocks/${block.id}`, "DELETE");
  }
}

async function syncFile(file, parentId, pageMap) {
  const md = fs.readFileSync(file.fullPath, "utf-8");
  const hash = fileHash(md);

  // 파일명에서 제목 추출 (.md 제거)
  const title = file.name.replace(/\.md$/, "");
  const hashKey = `_hash_${file.relPath}`;
  const existingPageId = pageMap[file.relPath];

  // 변경 안 됐으면 스킵
  if (existingPageId && pageMap[hashKey] === hash) {
    console.log(`  ⏭️  변경없음: ${file.relPath}`);
    return;
  }

  const blocks = markdownToBlocks(md);

  if (DRY_RUN) {
    console.log(`  ${existingPageId ? "🔄" : "🆕"} ${file.relPath} (${blocks.length}블록)`);
    return;
  }

  if (existingPageId) {
    // 기존 페이지 업데이트 — 블록 전부 삭제 후 다시 생성
    console.log(`  🔄 업데이트: ${file.relPath}`);
    await deleteAllBlocks(existingPageId);
    await appendBlocksInChunks(existingPageId, blocks);
  } else {
    // 새 페이지 생성
    console.log(`  🆕 생성: ${file.relPath}`);
    const firstChunk = blocks.slice(0, 100);
    const res = await notionFetch("/pages", "POST", {
      parent: { page_id: parentId },
      properties: {
        title: { title: [{ text: { content: title } }] },
      },
      children: firstChunk,
    });

    if (res) {
      pageMap[file.relPath] = res.id;
      savePageMap(pageMap);

      // 100블록 넘으면 나머지 추가
      if (blocks.length > 100) {
        await appendBlocksInChunks(res.id, blocks.slice(100));
      }
    }
  }

  // 해시 저장 (다음에 변경 감지용)
  pageMap[hashKey] = hash;
  savePageMap(pageMap);
}

// ============ 메인 ============
async function main() {
  console.log("🔄 tangshi docs → Notion 동기화 시작");
  if (DRY_RUN) console.log("   (--dry 모드: 실제 업로드 없음)\n");

  const pageMap = loadPageMap();
  const files = collectMarkdownFiles(DOCS_DIR);

  console.log(`📂 docs/에서 ${files.length}개 마크다운 파일 발견\n`);

  // 폴더별로 분류
  const rootFiles = [];
  const folderFiles = {}; // { folderName: [files] }

  for (const file of files) {
    const parts = file.relPath.split(path.sep);
    if (parts.length === 1) {
      rootFiles.push(file);
    } else {
      const folder = parts[0];
      if (!folderFiles[folder]) folderFiles[folder] = [];
      folderFiles[folder].push(file);
    }
  }

  // 루트 파일 동기화
  if (rootFiles.length) {
    console.log("📄 루트 문서:");
    for (const file of rootFiles) {
      await syncFile(file, PARENT_PAGE_ID, pageMap);
    }
    console.log();
  }

  // 폴더별 동기화
  for (const [folder, fFiles] of Object.entries(folderFiles)) {
    const folderId = await getOrCreateFolderPage(folder, PARENT_PAGE_ID, pageMap);
    console.log(`📁 ${folder}/ (${fFiles.length}개):`);
    for (const file of fFiles) {
      await syncFile(file, folderId, pageMap);
    }
    console.log();
  }

  console.log("✅ 동기화 완료!");
}

main().catch((err) => {
  console.error("❌ 에러:", err.message);
  process.exit(1);
});
