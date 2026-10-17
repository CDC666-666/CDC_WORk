import { spawnSync } from 'node:child_process';

const database = process.argv[2];
if (!/^cdc_launchprep_test_\d{8}T\d{6}Z$/.test(database)) throw new Error('Invalid isolated test database name');
const url = new URL(process.env.DATABASE_URL);
url.pathname = `/${database}`;
const env = { ...process.env, DATABASE_URL: url.toString() };

for (const [command, args] of [
  ['npx', ['prisma', 'migrate', 'deploy']],
  ['npm', ['run', 'test:db']],
]) {
  const result = spawnSync(command, args, { env, stdio: 'inherit', shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
