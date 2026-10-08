import assert from "node:assert/strict";
import test from "node:test";

import { authLogger } from "@/lib/server/auth-logger";

test("authentication failures never print token-bearing error metadata", () => {
  const output: string[] = [];
  const originalError = console.error;
  const originalWarn = console.warn;
  console.error = (...parts: unknown[]) => { output.push(parts.map(String).join(" ")); };
  console.warn = (...parts: unknown[]) => { output.push(parts.map(String).join(" ")); };
  try {
    const failure = new Error("database rejected ACCESS_TOKEN_DO_NOT_LOG");
    authLogger.error?.("adapter_error_linkAccount", {
      error: failure,
      client_secret: "CLIENT_SECRET_DO_NOT_LOG",
      response: { access_token: "FULL_RESPONSE_DO_NOT_LOG" },
    });
    authLogger.error?.("OAUTH_CALLBACK_ERROR", {
      error: new Error("outgoing request timed out after 15000ms"),
      response: { refresh_token: "REFRESH_TOKEN_DO_NOT_LOG" },
    });
    authLogger.warn?.("NEXTAUTH_URL");
    authLogger.debug?.("PROVIDER_RESPONSE", { token: "DEBUG_TOKEN_DO_NOT_LOG" });
  } finally {
    console.error = originalError;
    console.warn = originalWarn;
  }
  const text = output.join("\n");
  assert.match(text, /\[auth\]\[error\]\[UNKNOWN\] unspecified/);
  assert.match(text, /\[auth\]\[error\]\[OAUTH_CALLBACK_ERROR\] timeout/);
  assert.match(text, /\[auth\]\[warn\]\[NEXTAUTH_URL\]/);
  for (const sentinel of ["ACCESS_TOKEN_DO_NOT_LOG", "CLIENT_SECRET_DO_NOT_LOG",
    "FULL_RESPONSE_DO_NOT_LOG", "REFRESH_TOKEN_DO_NOT_LOG", "DEBUG_TOKEN_DO_NOT_LOG"]) {
    assert.equal(text.includes(sentinel), false);
  }
});
