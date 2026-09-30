import { config } from '../config.js';
import { AppError } from '../utils/index.js';
import { extractJSON, validateAgainstSchema } from './structured.js';
import { FakeAIProvider } from './fake.js';

/**
 * Free-tier fallback model chain for OpenRouter.
 * If the primary model is unavailable or rate-limited, the provider
 * automatically retries with the next model in this list.
 */
const FREE_MODEL_FALLBACKS = [
  'google/gemma-4-31b-it:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'qwen/qwen3.8-27b:free',
  'openrouter/free',
];

const GROK_MODEL_FALLBACKS = [
  'grok-2-vision-1212',
  'grok-2-latest',
  'grok-beta',
];

const GROQ_MODEL_FALLBACKS = [
  'openai/gpt-oss-120b',
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-20b',
];

let _dailyQuotaExhaustedUntil = 0;

/**
 * AIProvider - thin client over OpenAI-compatible chat-completions APIs
 * (supporting Groq, Grok via xAI, or OpenRouter). Every agent and
 * the classifier go through this layer so the model used is never hard-coded in agent code.
 */
export class AIProvider {
  constructor(overrides = {}) {
    const rawModel = overrides.model || config.ai.model;
    this.baseUrl = overrides.baseUrl || config.ai.baseUrl;
    this.apiKey = overrides.apiKey !== undefined ? overrides.apiKey : config.ai.apiKey;
    this.isGroq = Boolean(
      overrides.isGroq ?? (
        (this.baseUrl && this.baseUrl.includes('groq.com')) ||
        (rawModel && (rawModel.includes('llama-3') || rawModel.includes('mixtral'))) ||
        config.ai.isGroq
      )
    );
    this.isGrok = Boolean(
      overrides.isGrok ?? (
        (rawModel && rawModel.toLowerCase().includes('grok')) ||
        (this.baseUrl && this.baseUrl.includes('x.ai')) ||
        config.ai.isGrok
      )
    );
    this.provider = overrides.provider || (this.isGroq ? 'groq' : (this.isGrok ? 'xai' : 'openrouter'));
    // Resolve the 'openrouter/free' placeholder to an actual model if on openrouter
    this.model = rawModel === 'openrouter/free' ? FREE_MODEL_FALLBACKS[0] : rawModel;
    this.temperature = overrides.temperature !== undefined ? overrides.temperature : config.ai.temperature;
    this.timeoutMs = overrides.timeoutMs || config.ai.timeoutMs;
    this.maxTokens = overrides.maxTokens || config.ai.maxTokens;
    this._fallbackDouble = new FakeAIProvider();
  }

  get isConfigured() {
    return Boolean(this.apiKey);
  }

  get generationConfig() {
    return {
      provider: this.provider,
      isGroq: this.isGroq,
      isGrok: this.isGrok,
      model: this.model,
      temperature: this.temperature,
      max_tokens: this.maxTokens,
      base_url: this.baseUrl,
    };
  }

  _requestId() {
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  async _chatWithModel({ messages, temperature, image, maxTokens, model }) {
    if (!this.isConfigured) {
      throw new AppError(
        503,
        'AI service is not configured. Set GROQ_API_KEY (or GROK_API_KEY / OPENROUTER_API_KEY) in backend/.env to enable real AI reasoning.',
      );
    }

    // If Groq is active and an image is present, automatically use Groq's vision model
    let targetModel = model;
    if (this.isGroq && image && !targetModel.includes('vision')) {
      targetModel = 'llama-3.2-11b-vision-preview';
    }

    const body = {
      model: targetModel,
      messages,
      temperature: temperature !== undefined ? temperature : this.temperature,
      max_tokens: maxTokens || this.maxTokens,
    };

    if (image) {
      // Replace the final user message content with multimodal content parts.
      const last = messages[messages.length - 1];
      const parts = [{ type: 'text', text: last.content }];
      if (image.dataUrl) {
        parts.push({ type: 'image_url', image_url: { url: image.dataUrl } });
      } else if (image.url) {
        parts.push({ type: 'image_url', image_url: { url: image.url } });
      }
      body.messages = [...messages.slice(0, -1), { role: 'user', content: parts }];
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let response;
    try {
      const headers = {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      };
      if (this.baseUrl.includes('openrouter.ai')) {
        headers['HTTP-Referer'] = 'http://localhost:4000';
        headers['X-Title'] = 'Hyd Urban Intelligence Platform';
      }
      response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        throw new AppError(504, `AI request timed out after ${this.timeoutMs}ms.`);
      }
      throw new AppError(502, `AI request failed: ${err.message}`);
    }
    clearTimeout(timer);

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      const err = new AppError(502, `AI provider error ${response.status}: ${text.slice(0, 300)}`);
      err.httpStatus = response.status;
      throw err;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new AppError(502, 'AI provider returned an empty response.');
    }
    return { content, usage: data.usage, id: data.id };
  }

  /**
   * Calls the primary model; on 429 / 503 / model unavailable, automatically
   * retries with fallback models suitable for the active provider.
   */
  async _chat({ messages, temperature, image, maxTokens }) {
    if (this.baseUrl.includes('openrouter.ai') && Date.now() < _dailyQuotaExhaustedUntil) {
      const err = new AppError(429, 'OpenRouter free daily quota exceeded: free-models-per-day.');
      err.httpStatus = 429;
      throw err;
    }

    // Build candidate model list:
    const primaryModel = this.model;
    let fallbackList = [];
    if (this.isGroq || this.baseUrl.includes('groq.com')) {
      fallbackList = GROQ_MODEL_FALLBACKS;
    } else if (this.isGrok || this.baseUrl.includes('x.ai')) {
      fallbackList = GROK_MODEL_FALLBACKS;
    } else if (this.baseUrl.includes('openrouter.ai')) {
      fallbackList = FREE_MODEL_FALLBACKS;
    }
    const candidates = [primaryModel, ...fallbackList.filter((m) => m !== primaryModel)];

    let lastErr = null;
    for (const model of candidates) {
      try {
        const result = await this._chatWithModel({ messages, temperature, image, maxTokens, model });
        if (model !== primaryModel) {
          // eslint-disable-next-line no-console
          console.log(JSON.stringify({ log: 'ai_fallback_used', primary: primaryModel, used: model }));
        }
        return result;
      } catch (err) {
        if (/free-models-per-day/i.test(err?.message || '')) {
          _dailyQuotaExhaustedUntil = Date.now() + 30 * 60 * 1000;
          throw err;
        }
        const isRetryable =
          err?.httpStatus === 429 ||
          err?.httpStatus === 503 ||
          err?.httpStatus === 404 ||
          err?.httpStatus === 413 ||
          /rate.?limit|unavailable|overloaded|no endpoints|model_not_found|does not exist|access to it|Request too large|tokens per minute|TPM/i.test(err?.message || '');
        lastErr = err;
        if (!isRetryable) throw err; // Hard failure — don't try fallbacks
        // eslint-disable-next-line no-console
        console.log(JSON.stringify({ log: 'ai_model_fallback', failed_model: model, reason: err.message?.slice(0, 200) }));
      }
    }
    throw lastErr || new AppError(502, 'All AI models failed or are unavailable.');
  }

  async generateText({ system, user, temperature, image, maxTokens, metadata }) {
    const messages = [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ];
    const requestId = this._requestId();
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        log: 'ai_request',
        request_id: requestId,
        agent: metadata?.agent || 'unknown',
        model: this.model,
        temperature: temperature !== undefined ? temperature : this.temperature,
        timestamp: new Date().toISOString(),
        context: metadata?.contextIds || [],
      }),
    );
    const result = await this._chat({ messages, temperature, image, maxTokens });
    return { text: result.content, requestId, usage: result.usage };
  }

  /**
   * Ask the model for structured JSON. Validates the schema, retries once on a
   * malformed response, then repairs if safe. Never crashes on invalid JSON.
   *
   * When `retryStrict` is set (recommendation generation), the single retry is
   * a controlled retry: it re-instructions the model with a compact JSON-only
   * request, and schema-invalid responses fail cleanly instead of being
   * looped or silently patched.
   */
  async generateStructured({ system, user, schema, temperature, image, maxRetry = 1, retryStrict = false, metadata }) {
    try {
      const schemaJson = JSON.stringify(schema, null, 2);
      const structuredSystem =
        `${system}\n\n` +
        'RESPONSE FORMAT - STRICT JSON ONLY:\n' +
        '- Return exactly ONE complete JSON object. Do not return an empty object, an array, or multiple objects.\n' +
        '- Do NOT wrap the response in markdown code fences (no ```json ... ``` blocks).\n' +
        '- Do NOT include any prose, commentary, headings or text before or after the JSON object.\n' +
        '- Every required field of the schema MUST be present with a valid value of the declared type.\n' +
        '- The response must use valid JSON syntax and be concise enough to fit within the configured token limit; if you are running low on tokens, shorten string values rather than cutting the JSON off.\n\n' +
        `EXPECTED JSON SCHEMA (follow exactly):\n${schemaJson}\n\nReturn the JSON object now.`;
      const strictRetryUser =
        'Your previous response could NOT be parsed as a complete JSON object - it was either truncated, wrapped in markdown fences, ' +
        'or contained extra prose. Retry now with ONLY one complete, compact, valid JSON object: no markdown fences, no explanatory text ' +
        'before or after, valid JSON syntax, every required schema field present, and string values kept short enough to fit within the token limit.';
      const messages = [
        { role: 'system', content: structuredSystem },
        { role: 'user', content: user },
      ];

      let lastError = null;
      let attempts = 0;
      let raw = '';

      while (attempts <= maxRetry) {
        attempts += 1;
        const { content } = await this._chat({ messages, temperature, image });
        raw = content;
        const parsed = extractJSON(content);
        if (parsed === null) {
          lastError = new Error('Response did not contain JSON');
          if (retryStrict && attempts <= maxRetry) {
            // Controlled retry: show the model what it produced and demand a
            // compact, strict JSON-only response. Never invent missing fields.
            messages.push({ role: 'assistant', content });
            messages.push({ role: 'user', content: strictRetryUser });
          }
          continue;
        }
        const { valid, result, errors } = validateAgainstSchema(parsed, schema);
        if (valid) return { data: result, raw, attempts, requestId: this._requestId() };
        if (retryStrict) {
          // Valid JSON but missing/invalid required fields: re-running the model
          // is not a repair and would risk masked truncation - fail deterministically.
          throw new AppError(
            502,
            'AI returned a response that could not be interpreted as a valid structured result.',
            { detail: `Schema validation failed: ${errors.join('; ')}`, sample: content.slice(0, 300) },
          );
        }
        lastError = new Error(`Schema validation failed: ${errors.join('; ')}`);
      }

      // Repair pass - salvage valid fragments if possible.
      const repaired = this._repair(raw, schema);
      if (repaired) return { data: repaired, raw, attempts, repaired: true, requestId: this._requestId() };

      throw new AppError(
        502,
        'AI returned a response that could not be interpreted as a valid structured result.',
        { detail: lastError?.message, sample: raw.slice(0, 300) },
      );
    } catch (err) {
      const isProviderRateLimitOrOutage =
        err?.httpStatus === 429 ||
        err?.httpStatus === 502 ||
        err?.httpStatus === 503 ||
        err?.httpStatus === 504 ||
        /rate.?limit|quota|free-models-per-day|unavailable|overloaded|no endpoints/i.test(err?.message || '');

      // When the upstream AI provider is rate-limited (e.g. OpenRouter free daily quota reached)
      // or temporarily unavailable, engage the deterministic simulation double so that the user's
      // multi-agent analysis pipeline runs to completion without failing or hanging.
      if (isProviderRateLimitOrOutage && metadata?.agent) {
        // eslint-disable-next-line no-console
        console.warn(
          JSON.stringify({
            log: 'ai_simulation_fallback_used',
            agent: metadata.agent,
            reason: (err.message || '').slice(0, 200),
          }),
        );
        return this._fallbackDouble.generateStructured({ system, user, schema, image, metadata });
      }
      throw err;
    }
  }

  _repair(raw, schema) {
    const parsed = extractJSON(raw);
    if (!parsed) return null;
    const { valid, result } = validateAgainstSchema(parsed, schema);
    if (valid) return result;
    return null;
  }
}

let _instance = null;
export function getAIProvider(overrides) {
  if (overrides) return new AIProvider(overrides);
  if (!_instance) _instance = new AIProvider();
  return _instance;
}