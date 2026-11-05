import { config } from './config.js';
import { store } from './store/index.js';
import { createApp } from './app.js';
import { seedStore, DEMO_ACCOUNTS } from './store/seed.js';

if (store.isEmpty()) {
  await seedStore(store);
  console.log('✓ Base de démonstration créée (data/db.json)');
}

createApp().listen(config.port, () => {
  console.log(`TRANSTU API  →  http://localhost:${config.port}/api`);
  console.log(`  client   : ${DEMO_ACCOUNTS.client.email} / ${DEMO_ACCOUNTS.client.password}`);
  console.log(`  chauffeur: ${DEMO_ACCOUNTS.driver1.email} / ${DEMO_ACCOUNTS.driver1.password}`);
});
