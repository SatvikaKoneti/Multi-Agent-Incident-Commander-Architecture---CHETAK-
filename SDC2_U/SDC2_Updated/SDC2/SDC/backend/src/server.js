import { config } from './config.js';
import { initDatabase } from './db/index.js';
import { initRagIfNeeded } from './rag/init.js';
import { seedDatabase } from './seed/index.js';
import { createApp } from './app.js';

async function boot() {
  await initDatabase();
  await seedDatabase({ force: false });
  await initRagIfNeeded();

  const app = createApp();
  const server = app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`\n=== Agentic AI Urban Planning Decision Support System - Hyderabad ===`);
    console.log(`Backend API   : http://localhost:${config.port}/api`);
    console.log(`AI provider   : ${config.ai.provider.toUpperCase()} [${config.ai.model}] (${config.ai.apiKey ? 'configured' : 'NOT configured - set GROQ_API_KEY, GROK_API_KEY or OPENROUTER_API_KEY'})`);
    console.log(`DB engine     : ${config.db.engine} -> ${config.db.path}`);
    console.log(`Providers     : demo mode (all datasets synthetic-labelled)\n`);
  });

  const shutdown = () => {
    server.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

boot().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to boot backend:', err);
  process.exit(1);
});