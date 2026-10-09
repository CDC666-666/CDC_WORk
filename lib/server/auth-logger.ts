import type { NextAuthOptions } from "next-auth";

function safeCode(code: string): string {
  return /^[A-Z][A-Z0-9_]{0,79}$/.test(code) ? code : "UNKNOWN";
}

function errorCategory(metadata: unknown): string {
  const error = metadata instanceof Error ? metadata
    : metadata && typeof metadata === "object" && "error" in metadata ? metadata.error : null;
  const message = error instanceof Error ? error.message : "";
  if (message.includes("ECONNRESET")) return "connection_reset";
  if (message.includes("timed out")) return "timeout";
  return "unspecified";
}

/** OAuth errors may contain token-bearing provider responses or Prisma inputs. */
export const authLogger: NonNullable<NextAuthOptions["logger"]> = {
  error(code, metadata) {
    console.error(`[auth][error][${safeCode(code)}] ${errorCategory(metadata)}`);
  },
  warn(code) {
    console.warn(`[auth][warn][${safeCode(code)}]`);
  },
  debug() {
    // Never emit provider debug metadata; it may contain credentials or tokens.
  },
};
