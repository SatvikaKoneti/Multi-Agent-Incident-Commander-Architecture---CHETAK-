import { getCommunicationProvider } from './provider.js';

/**
 * Sends an approved authority communication through the configured provider.
 *
 * - The provider is selected from configuration (COMMUNICATION_PROVIDER env,
 *   default 'demo') plus the contact's preferred channel from the contact
 *   dataset. No provider is hard-coded in application logic.
 * - Returns a delivery record that is persisted with the request so the UI can
 *   truthfully show whether a real external message was sent or only handed to
 *   a demo contact.
 */
export async function sendAuthorityCommunication({ request, contact, channel, config = {} }) {
  const env = { ...config };
  const provider = getCommunicationProvider(env.COMMUNICATION_PROVIDER, channel, env);
  const chosenChannel = (channel || contact?.preferred_channel || 'email').toLowerCase();

  if (!provider.isConfigured()) {
    return {
      ok: false,
      demo: false,
      channel: chosenChannel,
      provider: provider.name,
      error: `No communication provider configured for channel "${chosenChannel}".`,
      note: 'No external message was sent.',
    };
  }

  const delivery = await provider.send({ request, contact, channel: chosenChannel });
  return { ...delivery, provider: provider.name };
}