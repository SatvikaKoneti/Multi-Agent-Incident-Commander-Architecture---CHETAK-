import { Router } from 'express';
import { asyncHandler, AppError } from '../utils/index.js';
import { get, run } from '../db/index.js';
import { providerRegistry, providerStatus } from '../providers/index.js';
import { getAI } from '../di.js';

const router = Router();

/**
 * Simulated communication endpoints referenced by the stakeholder registry.
 * The real simulation loop uses the authority portal; these endpoints exist to
 * demonstrate the "simulated_endpoint" field of each authority and to record
 * outbound clarifications to the audit trail.
 */
router.post(
  '/sim/authority/:code',
  asyncHandler(async (req, res) => {
    const authority = providerRegistry.authority.byCode(String(req.params.code || '').toUpperCase());
    if (!authority) throw new AppError(404, 'Unknown authority code.');
    run(
      "INSERT INTO audit_logs (user_role, action, entity_type, entity_id, details) VALUES ('system', 'sim.inbound', 'authority', $code, $details)",
      {
        $code: authority.code,
        $details: JSON.stringify({ endpoint: authority.simulated_endpoint, received: new Date().toISOString(), body: req.body || {} }),
      },
    );
    res.json({
      ok: true,
      authority: authority.name,
      received_at: new Date().toISOString(),
      message: 'Simulated inbound message recorded. Continue the loop via the authority portal respond endpoint.',
    });
  }),
);

router.get(
  '/meta',
  asyncHandler((req, res) => {
    const ai = getAI();
    res.json({
      name: 'Hyd Urban Intelligence Platform',
      version: '1.0.0',
      ai: {
        configured: ai.isConfigured,
        model: ai.model,
        generation_config: ai.generationConfig,
      },
      providers: providerStatus(),
    });
  }),
);

router.get(
  '/ai/health',
  asyncHandler(async (req, res) => {
    const ai = getAI();
    if (!ai.isConfigured) {
      return res.status(503).json({
        ok: false,
        configured: false,
        message: 'AI API key not set. Set GROK_API_KEY (or OPENROUTER_API_KEY) in backend/.env to enable AI.',
      });
    }
    res.json({
      ok: true,
      configured: true,
      model: ai.model,
      provider: ai.provider || (ai.isGrok ? 'xai' : 'openrouter'),
      isGrok: Boolean(ai.isGrok),
    });
  }),
);

export default router;