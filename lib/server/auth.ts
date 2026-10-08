import "server-only";

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import type { AdapterAccount } from "next-auth/adapters";
import { getServerSession } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

import { authLogger } from "@/lib/server/auth-logger";
import { prisma } from "@/lib/server/prisma";
import { isAllowedGithubId } from "@/services/server/github-allowlist";

const prismaAdapter = PrismaAdapter(prisma);

export const authOptions: NextAuthOptions = {
  logger: authLogger,
  adapter: {
    ...prismaAdapter,
    // Project provider data explicitly so unexpected OAuth fields cannot reach Prisma.
    linkAccount: (account: AdapterAccount) => {
      const oauthAccount = account as typeof account & { refresh_token_expires_in?: number };
      return prisma.account.create({
        data: {
          userId: account.userId,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          refresh_token: account.refresh_token,
          refresh_token_expires_in: oauthAccount.refresh_token_expires_in,
          access_token: account.access_token,
          expires_at: account.expires_at,
          token_type: account.token_type,
          scope: account.scope,
          id_token: account.id_token,
          session_state: account.session_state,
        },
      });
    },
  },
  session: { strategy: "database" },
  providers: [GitHubProvider({
    clientId: process.env.GITHUB_CLIENT_ID ?? "",
    clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
    httpOptions: { timeout: 15000 },
  })],
  callbacks: {
    async signIn({ account }) {
      return account?.provider === "github" && isAllowedGithubId(account.providerAccountId);
    },
    async session({ session, user }) {
      if (session.user) session.user.id = user.id;
      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      if (account?.provider === "github" && isAllowedGithubId(account.providerAccountId)) {
        await prisma.user.update({ where: { id: user.id }, data: { githubId: account.providerAccountId } });
        await prisma.workspace.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {} });
      }
    },
  },
  pages: { signIn: "/login", error: "/login" },
};

export interface PrivateWorkspace {
  userId: string;
  workspaceId: string;
}

export async function getPrivateWorkspace(): Promise<PrivateWorkspace | null> {
  if (!process.env.NEXTAUTH_SECRET || !process.env.ALLOWED_GITHUB_USER_ID) return null;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return null;
  const account = await prisma.account.findFirst({
    where: { userId, provider: "github" },
    select: { providerAccountId: true },
  });
  if (!isAllowedGithubId(account?.providerAccountId)) return null;
  const workspace = await prisma.workspace.findUnique({ where: { userId }, select: { id: true } });
  if (!workspace) return null;
  return { userId, workspaceId: workspace.id };
}
