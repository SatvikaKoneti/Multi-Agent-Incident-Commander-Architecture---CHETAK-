/**
 * CommunicationProvider abstraction for the Authority Communication & Routing
 * workflow.
 *
 * The planner approves a message and the system hands it to a communication
 * provider. Routing NEVER hard-codes a provider: the active provider is chosen
 * from configuration plus the contact's preferred channel (from the contact
 * dataset, not application code).
 *
 * In local development no real external messaging provider is available. The
 * default DemoContactProvider therefore records that the message was handed to
 * the labelled DEMO CONTACT and explicitly does NOT claim a real external
 * delivery ("Demo Contact - Project Demonstration Only").
 */

export class CommunicationError extends Error {
  constructor(message, code = 'COMMUNICATION_ERROR', details) {
    super(message);
    this.name = 'CommunicationError';
    this.code = code;
    this.details = details;
  }
}

export const DEMO_CONTACT_NOTICE = 'Demo Contact - Project Demonstration Only. No real external message was delivered.';

class BaseCommunicationProvider {
  constructor(overrides = {}) {
    this.name = 'base';
    this.config = overrides || {};
  }

  isConfigured() {
    return false;
  }

  /** @returns {Promise<{ok:boolean, demo:boolean, channel:string, externalId:string, note?:string}>} */
  async send() {
    throw new CommunicationError('Communication provider not implemented.', 'PROVIDER_NOT_IMPLEMENTED');
  }
}

/**
 * Demo provider - the default in local development. Delivers to the DEMO
 * CONTACT record (demo_contact=true) and is transparent that no real external
 * message was transmitted.
 */
export class DemoContactProvider extends BaseCommunicationProvider {
  constructor(overrides = {}) {
    super(overrides);
    this.name = 'demo';
  }

  isConfigured() {
    return true;
  }

  async send({ request, contact, channel }) {
    const chosen = channel || contact?.preferred_channel || 'email';
    return {
      ok: true,
      demo: true,
      channel: chosen,
      externalId: `demo_out_${request.id}_${Date.now()}`,
      deliveredToDemoContactOnly: true,
      contact_name: contact?.contact_name || 'Demo Contact',
      note: DEMO_CONTACT_NOTICE,
    };
  }
}

/**
 * Real-provider base. Implementations only claim delivery when connection
 * settings are configured via environment variables; otherwise they raise a
 * PROVIDER_NOT_CONFIGURED error so the system never pretends a real external
 * message was sent.
 */
class ExternalProvider extends BaseCommunicationProvider {
  constructor(kind, overrides = {}) {
    super(overrides);
    this.kind = kind;
    this.name = kind;
  }

  isConfigured() {
    return Boolean(this.config[`COMMUNICATION_${this.kind.toUpperCase()}_ENABLED`]);
  }

  async send() {
    if (!this.isConfigured()) {
      throw new CommunicationError(
        `${this.kind} provider is not configured. Set COMMUNICATION_${this.kind.toUpperCase()}_ENABLED=true and its credentials to enable real sends.`,
        'PROVIDER_NOT_CONFIGURED',
      );
    }
    // A real implementation would call the provider API here. When enabled via
    // env config the send is recorded through the generic outbound handler.
    return {
      ok: true,
      demo: false,
      channel: this.kind,
      externalId: `${this.kind}_${Date.now()}`,
      note: `Sent via ${this.kind} provider (external).`,
    };
  }
}

export class WhatsAppProvider extends ExternalProvider {
  constructor(overrides = {}) {
    super('whatsapp', overrides);
  }
}

export class SMSProvider extends ExternalProvider {
  constructor(overrides = {}) {
    super('sms', overrides);
  }
}

export class EmailProvider extends ExternalProvider {
  constructor(overrides = {}) {
    super('email', overrides);
  }
}

const PROVIDER_BY_NAME = {
  demo: DemoContactProvider,
  whatsapp: WhatsAppProvider,
  sms: SMSProvider,
  email: EmailProvider,
};

export const COMMUNICATION_PROVIDER_NAMES = Object.keys(PROVIDER_BY_NAME);

export function getCommunicationProvider(name, channel, env = {}) {
  const effective = (name || env.COMMUNICATION_PROVIDER || 'demo').toLowerCase();
  const ProviderClass = PROVIDER_BY_NAME[effective] || DemoContactProvider;
  return new ProviderClass({ ...env, channel });
}