const { PrismaClient } = require('@prisma/client');

async function main() {
  const database = process.argv[2];
  if (!/^cdc_restore_verify_\d{8}T\d{6}Z$/.test(database)) throw new Error('Invalid drill database name');
  const url = new URL(process.env.DATABASE_URL);
  url.pathname = `/${database}`;
  const prisma = new PrismaClient({ datasources: { db: { url: url.toString() } } });
  try {
    const [users, accounts, workspaces, knowledge] = await Promise.all([
      prisma.user.count(), prisma.account.count(), prisma.workspace.count(), prisma.knowledge.count(),
    ]);
    if (users < 1 || accounts < 1 || workspaces < 1 || knowledge !== 1) {
      throw new Error('Restored application data did not match expected counts');
    }
    console.log(JSON.stringify({ prismaRead: 'PASS', users, accounts, workspaces, knowledge }));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(() => { console.error('Restored Prisma read failed'); process.exitCode = 1; });
