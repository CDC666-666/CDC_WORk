import "server-only";

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

import { prisma } from "@/lib/server/prisma";
import { isAllowedGithubId } from "@/services/server/github-allowlist";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: [GitHubProvider({
    clientId: process.env.GITHUB_CLIENT_ID ?? "",
    clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
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
