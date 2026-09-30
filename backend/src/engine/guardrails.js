/**
 * Production Guardrail Safety Validator
 * Evaluates candidate diagnostic and remediation commands against a 3-tier safety matrix
 * and intercepts adversarial log/prompt injections.
 */

const PROHIBITED_PATTERNS = [
  /\brm\s+-rf\b/i,
  /\bdrop\s+(database|table|schema)\b/i,
  /\bdelete\s+from\s+[a-z0-9_]+\s*(;|$)/i, // Unbounded DELETE
  /\btruncate\s+table\b/i,
  /\bkill\s+-9\s+1\b/i,
  /\biptables\s+-f\b/i,
  /\bmkfs\b/i,
  /\bdd\s+if=/i,
  /\bshutdown\s+-h\s+now\b/i,
  /\breboot\s+-f\b/i,
  /\bchmod\s+-r\s+777\s+\//i,
  /\bchown\s+-r\b/i,
  /\bwipe\s+logs\b/i
];

const CAUTION_PATTERNS = [
  /\bkubectl\s+delete\s+pod\b/i,
  /\bkubectl\s+scale\b/i,
  /\bkubectl\s+rollout\s+restart\b/i,
  /\bkubectl\s+rollout\s+undo\b/i,
  /\bdocker\s+restart\b/i,
  /\bsystemctl\s+restart\b/i,
  /\bnginx\s+-s\s+reload\b/i,
  /\bflushall\b/i,
  /\bflushdb\b/i,
  /\btraffic\s+drain\b/i,
  /\bcircuit\s+breaker\b/i,
  /\balter\s+table\b/i,
  /\bupdate\s+[a-z0-9_]+\s+set\b/i
];

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /you\s+are\s+now\s+in\s+god\s+mode/i,
  /system\s+override\s+execute/i,
  /bypass\s+safety\s+filter/i,
  /as\s+an\s+unfiltered\s+ai/i,
  /reveal\s+secret\s+key/i,
  /drop\s+all\s+guardrails/i
];

export function sanitizeAndInspectTelemetry(text = '') {
  if (!text || typeof text !== 'string') return { isSafe: true, sanitized: text, detectedThreats: [] };

  const detectedThreats = [];
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      detectedThreats.push(`Prompt-injection marker detected: ${pattern.toString()}`);
    }
  }

  let sanitized = text;
  if (detectedThreats.length > 0) {
    sanitized = text.replace(/ignore\s+(all\s+)?previous\s+instructions/gi, '[REDACTED_ADVERSARIAL_PAYLOAD]');
  }

  return {
    isSafe: detectedThreats.length === 0,
    sanitized,
    detectedThreats
  };
}

export function validateCommandSafety(command = '') {
  if (!command || typeof command !== 'string') {
    return {
      safetyTier: 'GREEN',
      allowed: true,
      reason: 'Empty or read-only query.',
      dryRunPrediction: 'No state modifications will occur.'
    };
  }

  // 1. Check Prohibited (RED)
  for (const pattern of PROHIBITED_PATTERNS) {
    if (pattern.test(command)) {
      return {
        safetyTier: 'RED',
        allowed: false,
        reason: `Violates Production Safety Guardrail: Matches prohibited destructive operation (${pattern.toString()}).`,
        dryRunPrediction: 'Operation blocked. Execution would cause irreversible data loss or node termination.'
      };
    }
  }

  // 2. Check Caution (YELLOW)
  for (const pattern of CAUTION_PATTERNS) {
    if (pattern.test(command)) {
      return {
        safetyTier: 'YELLOW',
        allowed: true,
        requiresHumanApproval: true,
        reason: 'State-altering or resource-reallocating operation. Requires engineer 2-factor confirmation.',
        dryRunPrediction: 'Will initiate controlled container/service restart with active connection drainage.'
      };
    }
  }

  // 3. Safe (GREEN)
  return {
    safetyTier: 'GREEN',
    allowed: true,
    requiresHumanApproval: false,
    reason: 'Non-destructive, read-only diagnostic telemetry probe.',
    dryRunPrediction: 'Safe execution. Query returns diagnostic metrics without modifying infrastructure state.'
  };
}
