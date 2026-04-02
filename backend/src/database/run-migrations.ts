import { appDataSource } from './data-source';

async function run(): Promise<void> {
  await appDataSource.initialize();
  await appDataSource.runMigrations();
  await appDataSource.destroy();
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Migration failed:', error);
  process.exit(1);
});
