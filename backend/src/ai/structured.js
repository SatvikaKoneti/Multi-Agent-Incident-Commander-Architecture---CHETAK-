export function extractJSON(text) {
  if (text === null || text === undefined) return null;
  let t = String(text).trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  const candidate = t.slice(start, end + 1);
  try {
    return JSON.parse(candidate);
  } catch {
    // Fall back to a lenient parse below.
  }
  return null;
}

function typeName(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}

/**
 * Validates a parsed object against a JSON-schema-like descriptor.
 * Supported constructors: { type: 'object', required: [], properties: {...} },
 * { type: 'array', items: schema }, { type: 'string'|'number'|'integer'|'boolean' },
 * { enum: [] }. Undefined properties are allowed.
 */
export function validateAgainstSchema(value, schema, path = '$') {
  const errors = [];
  const result = coerce(value, schema, path, errors);
  return { valid: errors.length === 0, result, errors };
}

function coerce(value, schema, path, errors) {
  if (schema === true) return value;
  if (schema === false) {
    errors.push(`${path}: value not allowed`);
    return null;
  }
  const type = schema.type;

  if (type === 'object') {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      errors.push(`${path}: expected object, got ${typeName(value)}`);
      return {};
    }
    const out = {};
    for (const key of schema.required || []) {
      if (!(key in value)) {
        errors.push(`${path}.${key}: missing required field`);
      }
    }
    for (const [key, subSchema] of Object.entries(schema.properties || {})) {
      if (key in value && value[key] !== undefined && value[key] !== null) {
        out[key] = coerce(value[key], subSchema, `${path}.${key}`, errors);
      }
    }
    if (schema.additionalProperties === false) {
      // keep only known keys
      const known = new Set(Object.keys(schema.properties || {}));
      for (const key of Object.keys(out)) {
        if (!known.has(key)) delete out[key];
      }
    }
    return out;
  }

  if (type === 'array') {
    if (!Array.isArray(value)) {
      errors.push(`${path}: expected array, got ${typeName(value)}`);
      return [];
    }
    return value.map((item, i) => coerce(item, schema.items || true, `${path}[${i}]`, errors));
  }

  if (type === 'string') {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    errors.push(`${path}: expected string, got ${typeName(value)}`);
    return '';
  }

  if (type === 'number' || type === 'integer') {
    const n = Number(value);
    if (Number.isFinite(n)) {
      return type === 'integer' ? Math.round(n) : n;
    }
    errors.push(`${path}: expected number, got ${typeName(value)}`);
    return type === 'integer' ? 0 : 0;
  }

  if (type === 'boolean') {
    if (typeof value === 'boolean') return value;
    if (value === 'true' || value === 'false' || value === 1 || value === 0) {
      return value === 'true' || value === 1;
    }
    errors.push(`${path}: expected boolean, got ${typeName(value)}`);
    return false;
  }

  if (type === 'null') {
    return null;
  }

  if (schema.enum) {
    if (schema.enum.includes(value)) return value;
    errors.push(`${path}: value ${JSON.stringify(value)} not in enum`);
    return schema.enum[0];
  }

  if (type === 'any' || !type) return value;
  return value;
}

export function clampConfidence(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0.5;
  return Math.min(1, Math.max(0, n));
}