/**
 * prompt.js — AI Writer Prompt Builder Module
 * Loaded after settings.js; exposes global `PromptBuilder` object.
 */
var PromptBuilder = (() => {
  'use strict';

  // ─── Style rules ──────────────────────────────────────────────────────────
  const BASE_STYLE_RULES = `
[문체 기본 규칙 — 반드시 지켜야 함]
- 평서문으로 쓴다. 경어체(~합니다, ~입니다, ~했습니다) 절대 금지.
- "~이다", "~것으로 알려져 있다", "~라고 전해진다" 같은 위키 백과 문체 금지.
- "물론~", "흥미롭게도~", "~라고 할 수 있다", "~라는 점에서 의미가 있다" 같은 AI 상투 표현 금지.
- 과도한 수사, 감탄조, "~하지 않을까?", "~라는 점이 놀랍다" 같은 서브컬쳐 문체 금지.
- 자연스럽고 밀도 있는 한국어로, 글을 아는 사람이 쓴 것처럼 서술한다.
`.trim();

  // ─── Article structures ───────────────────────────────────────────────────
  const STRUCTURES = {
    poem: [
      { id: 'standard', label: '서론 → 원문/번역 → 해설 → 감상' },
      { id: 'deep', label: '배경 → 원문/번역 → 구절별 분석 → 문학사적 의의' },
      { id: 'comparison', label: '시인 소개 → 원문/번역 → 비교 작품 → 종합 해설' },
    ],
    poet: [
      { id: 'standard', label: '생애 → 시대 배경 → 작품 세계 → 대표작 → 영향' },
      { id: 'thematic', label: '대표작 소개 → 생애 → 시적 특징 → 문학사적 위치' },
    ],
    history: [
      { id: 'standard', label: '사건 개요 → 배경 → 전개 → 영향' },
      { id: 'narrative', label: '상황 묘사 → 핵심 인물 → 사건 전개 → 이후' },
    ],
    article: [
      { id: 'standard', label: '서론 → 본론(3~5개 섹션) → 결론' },
      { id: 'chronological', label: '시대순 서술 → 종합 평가' },
      { id: 'thematic', label: '주제별 분류 → 각 주제 심화 → 종합' },
    ],
  };

  // ─── Section markers per mode ─────────────────────────────────────────────
  const SECTION_MARKERS = {
    poem: ['원문(body_zh)', '한국어 번역(translation_ko)', '해설(commentary_ko)', '주석(notes)'],
    poet: ['기본 정보', '약력(bio_ko)', '작품 세계', '대표작'],
    history: ['사건 개요(summary)', '상세 설명(detail)', '태그'],
    article: null, // free structure — AI chooses section names
  };

  // ─── Length map ───────────────────────────────────────────────────────────
  const LENGTH_MAP = {
    short: '약 1000자',
    medium: '약 3000자',
    long: '약 5000자',
  };

  // ─── Core functions ───────────────────────────────────────────────────────

  /**
   * Build system + user prompts.
   * @param {object} opts
   * @param {string} opts.mode          - 'poem' | 'poet' | 'history' | 'article'
   * @param {string} [opts.contentType] - content type label/id
   * @param {string} opts.topic         - main subject
   * @param {string} [opts.stylePreset] - preset id or 'custom'
   * @param {string} [opts.styleCustom] - custom style description
   * @param {string} [opts.length]      - 'short' | 'medium' | 'long'
   * @param {string} [opts.structure]   - structure id or 'custom'
   * @param {string} [opts.extra]       - additional instructions
   * @returns {{ system: string, user: string }}
   */
  function build({ mode, contentType, topic, stylePreset, styleCustom, structureCustom, length, structure, extra }) {
    const system = _buildSystem({ mode, stylePreset, styleCustom, structure, structureCustom, length });
    const user   = _buildUser({ mode, contentType, topic, extra });
    return { system, user };
  }

  function _buildSystem({ mode, stylePreset, styleCustom, length, structure, structureCustom }) {
    const parts = [];

    // 1. Role definition
    parts.push(
      '너는 한시(漢詩)와 한문, 동아시아 문학사를 전문으로 다루는 콘텐츠 작가다. ' +
      '한시나루(hanshinaru.kr) 웹사이트에 게시할 글을 작성한다.'
    );

    // 2. Style rules
    parts.push(BASE_STYLE_RULES);

    // 3. Style description
    const styleDesc = _resolveStyleDesc(stylePreset, styleCustom);
    if (styleDesc) {
      parts.push(`[문체 스타일]\n${styleDesc}`);
    }

    // 4. Structure
    const structureLabel = _resolveStructure(mode, structure, structureCustom);
    if (structureLabel) {
      parts.push(`[글 구조]\n${structureLabel}`);
    }

    // 5. Length
    const lengthLabel = LENGTH_MAP[length] || LENGTH_MAP.medium;
    parts.push(`[분량]\n${lengthLabel}`);

    // 6. Output format
    const outputFormat = _buildOutputFormat(mode);
    parts.push(outputFormat);

    return parts.join('\n\n');
  }

  function _resolveStyleDesc(stylePreset, styleCustom) {
    if (!stylePreset || stylePreset === 'custom') {
      return styleCustom || null;
    }
    try {
      const presets = Settings.getStylePresets();
      const found = presets.find(p => p.id === stylePreset);
      return found ? found.desc : null;
    } catch {
      return null;
    }
  }

  function _resolveStructure(mode, structure, structureCustom) {
    if (!structure) return null;
    if (structure === 'custom') return structureCustom || null;

    const list = STRUCTURES[mode] || STRUCTURES.article;
    const found = list.find(s => s.id === structure);
    return found ? found.label : null;
  }

  function _buildOutputFormat(mode) {
    if (mode === 'article') {
      return (
        '[출력 형식]\n' +
        '각 섹션을 아래 마커로 구분한다:\n' +
        '===SECTION:섹션 제목===\n' +
        '(내용)\n' +
        '섹션 제목은 내용에 맞게 AI가 직접 정한다.'
      );
    }

    const markers = SECTION_MARKERS[mode];
    if (!markers) return '';

    return (
      '[출력 형식]\n' +
      '다음 섹션 순서대로 작성한다:\n' +
      markers.map(m => `===SECTION:${m}===`).join('\n')
    );
  }

  function _buildUser({ mode, contentType, topic, extra }) {
    let prompt;

    switch (mode) {
      case 'poem':
        prompt = `다음 시에 대한 ${contentType || '해설'}을 작성해줘: ${topic}`;
        break;
      case 'poet':
        prompt = `다음 시인에 대한 소개글을 작성해줘: ${topic}`;
        break;
      case 'history':
        prompt = `다음 역사적 사건/시대에 대해 작성해줘: ${topic}`;
        break;
      case 'article':
      default:
        prompt = `다음 주제로 글을 작성해줘: ${topic}`;
        if (contentType) prompt += ` (유형: ${contentType})`;
        break;
    }

    if (extra) {
      prompt += `\n\n추가 지시: ${extra}`;
    }

    return prompt;
  }

  /**
   * Parse AI output with ===SECTION:name=== markers.
   * @param {string} text
   * @returns {{ name: string, content: string }[]}
   */
  function parseSections(text) {
    const sections = [];
    const parts = text.split(/===SECTION:(.+?)===/);

    // parts[0] is text before first marker (usually empty)
    if (parts[0].trim()) {
      sections.push({ name: '서문', content: parts[0].trim() });
    }

    for (let i = 1; i < parts.length; i += 2) {
      const name = parts[i].trim();
      const content = (parts[i + 1] || '').trim();
      sections.push({ name, content });
    }

    return sections;
  }

  /**
   * Get structure options for a given mode.
   * @param {string} mode
   * @returns {{ id: string, label: string }[]}
   */
  function getStructuresForMode(mode) {
    return STRUCTURES[mode] || STRUCTURES.article;
  }

  // ─── Public API ───────────────────────────────────────────────────────────
  return {
    build,
    parseSections,
    getStructuresForMode,
    BASE_STYLE_RULES,
  };
})();
