/**
 * api.js — AI Writer API Client Module
 * Loaded after settings.js; exposes global `AIClient` object.
 * Supports OpenAI-compatible chat completions API (OpenRouter, DashScope, OpenAI, Google AI, Custom).
 */
const AIClient = (() => {
  'use strict';

  // ─── Private helpers ──────────────────────────────────────────────────────

  function getHeaders(config) {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    };
    // OpenRouter requires these additional headers
    if (config.provider === 'openrouter') {
      headers['HTTP-Referer'] = window.location.href;
      headers['X-Title'] = 'hanshinaru-ai-writer';
    }
    return headers;
  }

  function getBaseUrl(config) {
    if (config.baseUrl) return config.baseUrl;
    const provider = Settings.DEFAULT_PROVIDERS.find(p => p.id === config.provider);
    return provider ? provider.baseUrl : '';
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * testConnection — quick ping to verify API key and connectivity.
   * @param {object} config — { provider, apiKey, model, baseUrl }
   * @returns {Promise<true>} resolves true on success, throws on failure
   */
  async function testConnection(config) {
    const baseUrl = getBaseUrl(config);
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: getHeaders(config),
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`${res.status}: ${err}`);
    }
    return true;
  }

  /**
   * streamChat — streaming chat completions via SSE.
   * @param {object} config — { provider, apiKey, model, baseUrl }
   * @param {{ system: string, user: string }} messages
   * @param {function} onChunk — called with each text chunk as it arrives
   * @returns {Promise<void>}
   */
  async function streamChat(config, { system, user }, onChunk) {
    const baseUrl = getBaseUrl(config);
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: getHeaders(config),
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 8192,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`API 오류 ${res.status}: ${err}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep incomplete last line in buffer

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onChunk(content);
        } catch {
          // ignore incomplete JSON
        }
      }
    }
  }

  /**
   * chat — non-streaming chat completions (for section regeneration).
   * @param {object} config — { provider, apiKey, model, baseUrl }
   * @param {{ system: string, user: string }} messages
   * @returns {Promise<string>} full response text
   */
  async function chat(config, { system, user }) {
    const baseUrl = getBaseUrl(config);
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: getHeaders(config),
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`API 오류 ${res.status}: ${err}`);
    }

    const json = await res.json();
    return json.choices?.[0]?.message?.content || '';
  }

  return {
    testConnection,
    streamChat,
    chat,
  };
})();
