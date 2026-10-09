import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import type { AdapterAccount } from "next-auth/adapters";

import { authLogger } from "@/lib/server/auth-logger";
import { authOptions } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

test("NextAuth uses the token-safe logger and projects OAuth account fields", {
  skip: !process.env.DATABASE_URL,
}, async () => {
  assert.equal(authOptions.logger?.error, authLogger.error);
  assert.equal(authOptions.logger?.warn, authLogger.warn);
  assert.equal(authOptions.logger?.debug, authLogger.debug);
  const linkAccount = authOptions.adapter?.linkAccount;
  assert.ok(linkAccount);
  const marker = randomUUID();
  const user = await prisma.user.create({ data: {} });
  try {
    const providerAccountId = `auth-projection-${marker}`;
    const account: AdapterAccount & { refresh_token_expires_in: number; provider_response: string } = {
      userId: user.id, type: "oauth", provider: "github", providerAccountId,
      access_token: "SYNTHETIC_ACCESS", refresh_token: "SYNTHETIC_REFRESH",
      refresh_token_expires_in: 3600, provider_response: "SHOULD_NOT_BE_PERSISTED",
    };
    await linkAccount(account);
    const row = await prisma.account.findUnique({
      where: { provider_providerAccountId: { provider: "github", providerAccountId } },
    });
    assert.equal(row?.refresh_token_expires_in, 3600);
    assert.equal(row?.access_token, "SYNTHETIC_ACCESS");
    assert.equal("provider_response" in (row ?? {}), false);
  } finally {
    await prisma.account.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }
});
