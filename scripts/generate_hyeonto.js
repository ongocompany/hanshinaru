#!/usr/bin/env node
/**
 * 현토(懸吐) AI 생성 스크립트
 *
 * 한문 시에 한국어 조사/어미(토, 吐)를 달아주는 AI 파이프라인
 * - 입력: poems.full.json의 poemZh + translationKo
 * - 출력: 현토 텍스트 + 독음 변환 텍스트
 *
 * 사용법:
 *   node scripts/generate_hyeonto.js --test          # 샘플 5편 테스트
 *   node scripts/generate_hyeonto.js --all            # 전체 생성
 *   node scripts/generate_hyeonto.js --poem 001       # 특정 시 1편
 *   node scripts/generate_hyeonto.js --category 절구  # 절구만
 *
 * 환경변수:
 *   AI_PROVIDER=gemini|anthropic|openai|qwen  (기본: gemini)
 *   AI_API_KEY=your_api_key  (Google AI Studio key)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// ─── 설정 ──────────────────────────────────────────────
const POEMS_PATH = path.join(__dirname, '..', 'public', 'index', 'poems.full.json');
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'index', 'hyeonto_data.json');

const AI_PROVIDER = process.env.AI_PROVIDER || 'gemini';
const AI_API_KEY = process.env.AI_API_KEY || '';

// ─── 현토 프롬프트 ─────────────────────────────────────
const SYSTEM_PROMPT = `너는 서당 훈장선생님이고, 한시(漢詩) 현토의 최고 전문가야.
당시(唐詩)에 전통 서당식 현토를 달아줘.

## 중요: 이것은 "한시 현토"이다

일반 한문(산문) 현토와 한시 현토는 다르다.
- 일반 한문 현토: 글자마다 풀어서 조사를 넣음 (예: "海上에 來하니")
- 한시 현토: 시의 운율과 구절을 살려 덩어리째 읽음 (예: "海上來하야")

한시는 5언/7언의 율격이 있으므로, 구절의 리듬을 살려 현토해야 한다.

## 현토 규칙

1. 한자를 의미 단위 덩어리째 이어 읽되, 구절 끝에만 최소한의 토를 붙인다.
2. 번역체를 쓰지 않는다. 한문 어순 그대로 읽는다.
3. 독음은 현토 결과를 그대로 한글로 옮긴 것이다.

## 예시 (이 스타일을 따를 것)

=== 感遇 (張九齡) ===
원문: 孤鴻海上來
현토: 孤鴻은 海上來하야
독음: 고홍은 해상래하야

원문: 池潢不敢顧
현토: 池潢을 不敢顧라
독음: 지황을 불감고라

원문: 側見雙翠鳥
현토: 側見하니 雙翠鳥는
독음: 측견하니 쌍취조는

원문: 矯矯珍木巓
현토: 矯矯히 珍木巓에
독음: 교교히 진목전에

원문: 美服患人指
현토: 美服은 患人指요
독음: 미복은 환인지요

원문: 高明逼神惡
현토: 高明은 逼神惡이라
독음: 고명은 핍신오이라

원문: 今我遊冥冥
현토: 今我는 遊冥冥하니
독음: 금아는 유명명하니

원문: 弋者何所慕
현토: 弋者는 何所慕리오
독음: 익자는 하소모리오

=== 登鸛雀樓 (王之渙) ===
원문: 白日依山盡
현토: 白日에 依山盡하니
독음: 백일에 의산진하니

원문: 黃河入海流
현토: 黃河가 入海流로다
독음: 황하가 입해류로다

원문: 欲窮千里目
현토: 欲窮千里目이어든
독음: 욕궁천리목이어든

원문: 更上一層樓
현토: 更上一層樓하라
독음: 갱상일층루하라

## 출력 형식 (반드시 이 형식으로)

각 행마다:
원문: [한자 원문 그대로]
현토: [현토 단 텍스트]
독음: [한글 독음으로 변환]`;

function buildUserPrompt(poem) {
  const lines = poem.poemZh.split('\n');
  const title = poem.title?.zh || '';
  const titleKo = poem.title?.ko || '';
  const poet = poem.poet?.zh || '';
  const poetKo = poem.poet?.ko || '';
  const translation = poem.translationKoOwned || poem.translationKo || '';
  const category = poem.category || '';
  const meter = poem.meter || 5;

  return `다음 한시에 현토를 달아주세요.

## 시 정보
- 제목: ${title} (${titleKo})
- 시인: ${poet} (${poetKo})
- 시체: ${category} (${meter}언)

## 원문
${lines.map((l, i) => `${i + 1}. ${l}`).join('\n')}

## 참고 한국어 번역 (현토의 맥락 참고용)
${translation}

## 요청
위 시의 각 행에 현토를 달아주세요. 반드시 아래 형식으로 출력하세요:

${lines.map((l, i) => `원문: ${l}\n현토: [현토 결과]\n독음: [한글 독음 변환]`).join('\n\n')}`;
}

// ─── AI API 호출 ───────────────────────────────────────

async function callAI(systemPrompt, userPrompt) {
  if (!AI_API_KEY) {
    throw new Error('AI_API_KEY 환경변수가 설정되지 않았습니다.');
  }

  switch (AI_PROVIDER) {
    case 'gemini':
      return callGemini(systemPrompt, userPrompt);
    case 'anthropic':
      return callAnthropic(systemPrompt, userPrompt);
    case 'openai':
      return callOpenAI(systemPrompt, userPrompt);
    case 'qwen':
      return callQwen(systemPrompt, userPrompt);
    default:
      throw new Error(`지원하지 않는 AI_PROVIDER: ${AI_PROVIDER}`);
  }
}

async function callGemini(systemPrompt, userPrompt) {
  const body = JSON.stringify({
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: { maxOutputTokens: 4000, temperature: 0.3 },
    tools: [{ google_search: {} }]
  });

  const model = 'gemini-2.5-pro';
  const apiPath = `/v1beta/models/${model}:generateContent?key=${AI_API_KEY}`;

  return httpPost('generativelanguage.googleapis.com', apiPath, {
    'Content-Type': 'application/json'
  }, body).then(res => {
    const data = JSON.parse(res);
    // grounding 사용 시 여러 parts가 올 수 있으므로 text만 추출
    const parts = data.candidates?.[0]?.content?.parts || [];
    const textParts = parts.filter(p => p.text).map(p => p.text);
    return textParts.join('') || '';
  });
}

async function callAnthropic(systemPrompt, userPrompt) {
  const body = JSON.stringify({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }]
  });

  return httpPost('api.anthropic.com', '/v1/messages', {
    'Content-Type': 'application/json',
    'x-api-key': AI_API_KEY,
    'anthropic-version': '2023-06-01'
  }, body).then(res => {
    const data = JSON.parse(res);
    return data.content?.[0]?.text || '';
  });
}

async function callOpenAI(systemPrompt, userPrompt) {
  const body = JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    max_tokens: 2000
  });

  return httpPost('api.openai.com', '/v1/chat/completions', {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AI_API_KEY}`
  }, body).then(res => {
    const data = JSON.parse(res);
    return data.choices?.[0]?.message?.content || '';
  });
}

async function callQwen(systemPrompt, userPrompt) {
  const body = JSON.stringify({
    model: 'qwen-plus',
    input: {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    },
    parameters: { max_tokens: 2000 }
  });

  return httpPost('dashscope.aliyuncs.com', '/api/v1/services/aigc/text-generation/generation', {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AI_API_KEY}`
  }, body).then(res => {
    const data = JSON.parse(res);
    return data.output?.text || data.output?.choices?.[0]?.message?.content || '';
  });
}

function httpPost(hostname, pathStr, headers, body) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname, path: pathStr, method: 'POST',
      headers: { ...headers, 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`API ${res.statusCode}: ${data.slice(0, 500)}`));
        } else {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── 응답 파싱 ─────────────────────────────────────────

function parseHyeontoResponse(responseText, lineCount) {
  const results = [];
  const blocks = responseText.split(/\n\n+/);

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    let original = '', hyeonto = '', reading = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('원문:')) {
        original = trimmed.replace('원문:', '').trim();
      } else if (trimmed.startsWith('현토:')) {
        hyeonto = trimmed.replace('현토:', '').trim();
      } else if (trimmed.startsWith('독음:')) {
        reading = trimmed.replace('독음:', '').trim();
      }
    }

    if (original && hyeonto) {
      results.push({ original, hyeonto, reading });
    }
  }

  // 행 수 검증
  if (results.length !== lineCount) {
    console.warn(`  ⚠ 행 수 불일치: 기대 ${lineCount}행, 실제 ${results.length}행`);
  }

  return results;
}

// ─── 한자→독음 변환 (보조) ─────────────────────────────
// TODO: hanja_to_reading.json 구축 후 로컬 변환 추가
// 현재는 AI가 직접 독음도 생성

// ─── 메인 로직 ─────────────────────────────────────────

async function processPoem(poem, index) {
  const title = poem.title?.ko || poem.title?.zh || `시 ${poem.poemNoStr}`;
  const lineCount = poem.poemZh.split('\n').length;

  console.log(`\n[${index + 1}] ${title} (${poem.category}, ${lineCount}행)`);

  const userPrompt = buildUserPrompt(poem);

  try {
    const response = await callAI(SYSTEM_PROMPT, userPrompt);
    const parsed = parseHyeontoResponse(response, lineCount);

    if (parsed.length === 0) {
      console.log('  ✗ 파싱 실패');
      return null;
    }

    console.log('  ✓ 현토 생성 완료');
    parsed.forEach((p, i) => {
      console.log(`    ${i + 1}. ${p.hyeonto}`);
      console.log(`       ${p.reading}`);
    });

    return {
      poemNoStr: poem.poemNoStr,
      poemNo: poem.poemNo,
      titleZh: poem.title?.zh,
      titleKo: poem.title?.ko,
      poetKo: poem.poet?.ko,
      category: poem.category,
      meter: poem.meter,
      lines: parsed,
      // 전체 텍스트 (TTS용)
      hyeontoFull: parsed.map(p => p.hyeonto).join('\n'),
      readingFull: parsed.map(p => p.reading).join('\n'),
      generatedAt: new Date().toISOString(),
      provider: AI_PROVIDER,
      status: 'auto' // auto | reviewed | approved
    };
  } catch (err) {
    console.log(`  ✗ 에러: ${err.message}`);
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);

  // JSON 데이터 로드
  const poems = JSON.parse(fs.readFileSync(POEMS_PATH, 'utf-8'));
  console.log(`총 ${poems.length}편 로드됨`);

  // 대상 필터링
  let targets = [];

  if (args.includes('--test')) {
    // 테스트 모드: 절구 2편 + 율시 2편 + 고시 1편
    const juelgu = poems.filter(p => p.category?.includes('絶'));
    const yulsi = poems.filter(p => p.category?.includes('律'));
    const gosi = poems.filter(p => p.category?.includes('古'));
    targets = [
      ...(juelgu.slice(0, 2)),
      ...(yulsi.slice(0, 2)),
      ...(gosi.slice(0, 1))
    ];
    console.log(`테스트 모드: ${targets.length}편 선택`);

  } else if (args.includes('--poem')) {
    const poemNo = args[args.indexOf('--poem') + 1];
    targets = poems.filter(p => p.poemNoStr === poemNo);
    if (targets.length === 0) {
      console.error(`시 번호 ${poemNo}을 찾을 수 없습니다.`);
      process.exit(1);
    }

  } else if (args.includes('--category')) {
    const cat = args[args.indexOf('--category') + 1];
    targets = poems.filter(p => {
      const lines = p.poemZh.split('\n').length;
      if (cat === '절구') return lines === 4;
      if (cat === '율시') return lines === 8;
      if (cat === '단시') return lines <= 8; // 절구 + 율시
      return p.category?.includes(cat);
    });
    console.log(`카테고리 '${cat}': ${targets.length}편`);

  } else if (args.includes('--all')) {
    // 전체 (단시 우선 정렬)
    targets = [...poems].sort((a, b) => {
      const la = a.poemZh.split('\n').length;
      const lb = b.poemZh.split('\n').length;
      return la - lb;
    });
    console.log(`전체 모드: ${targets.length}편`);

  } else {
    console.log(`
사용법:
  node scripts/generate_hyeonto.js --test          # 샘플 5편 테스트
  node scripts/generate_hyeonto.js --all            # 전체 생성
  node scripts/generate_hyeonto.js --poem 001       # 특정 시 1편
  node scripts/generate_hyeonto.js --category 절구  # 절구만
  node scripts/generate_hyeonto.js --category 단시  # 절구+율시 (222편)

환경변수:
  AI_PROVIDER=gemini|anthropic|openai|qwen  (기본: gemini)
  AI_API_KEY=your_api_key  (Google AI Studio API key)
`);
    process.exit(0);
  }

  // 기존 결과 로드 (이어서 작업)
  let existing = {};
  if (fs.existsSync(OUTPUT_PATH)) {
    const data = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'));
    if (data.poems) {
      data.poems.forEach(p => { existing[p.poemNoStr] = p; });
      console.log(`기존 결과 ${Object.keys(existing).length}편 로드됨`);
    }
  }

  // 이미 처리된 시 건너뛰기 (--force가 없으면)
  const force = args.includes('--force');
  if (!force) {
    const before = targets.length;
    targets = targets.filter(p => !existing[p.poemNoStr]);
    if (before !== targets.length) {
      console.log(`이미 처리된 ${before - targets.length}편 건너뜀 (--force로 재생성 가능)`);
    }
  }

  if (targets.length === 0) {
    console.log('처리할 시가 없습니다.');
    process.exit(0);
  }

  console.log(`\n===== 현토 생성 시작 (${AI_PROVIDER}) =====`);
  console.log(`대상: ${targets.length}편\n`);

  // 순차 처리 (API 레이트 리밋 고려)
  const results = [];
  let success = 0, fail = 0;

  for (let i = 0; i < targets.length; i++) {
    const result = await processPoem(targets[i], i);
    if (result) {
      results.push(result);
      existing[result.poemNoStr] = result;
      success++;
    } else {
      fail++;
    }

    // API 레이트 리밋 대기 (1초)
    if (i < targets.length - 1) {
      await new Promise(r => setTimeout(r, 1000));
    }

    // 10편마다 중간 저장
    if ((i + 1) % 10 === 0) {
      saveResults(existing);
      console.log(`\n--- 중간 저장 (${i + 1}/${targets.length}) ---\n`);
    }
  }

  // 최종 저장
  saveResults(existing);

  console.log(`\n===== 완료 =====`);
  console.log(`성공: ${success}편, 실패: ${fail}편`);
  console.log(`총 저장: ${Object.keys(existing).length}편`);
  console.log(`출력: ${OUTPUT_PATH}`);
}

function saveResults(existingMap) {
  const allPoems = Object.values(existingMap)
    .sort((a, b) => (a.poemNo || 0) - (b.poemNo || 0));

  const output = {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    provider: AI_PROVIDER,
    totalCount: allPoems.length,
    stats: {
      절구: allPoems.filter(p => p.lines?.length === 4).length,
      율시: allPoems.filter(p => p.lines?.length === 8).length,
      기타: allPoems.filter(p => p.lines && p.lines.length !== 4 && p.lines.length !== 8).length
    },
    poems: allPoems
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8');
}

main().catch(err => {
  console.error('치명적 에러:', err);
  process.exit(1);
});
