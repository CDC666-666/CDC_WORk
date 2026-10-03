/** An empty or malformed allowlist locks access instead of allowing every account. */
export function isAllowedGithubId(id: string | undefined, allowed = process.env.ALLOWED_GITHUB_USER_ID): boolean {
  return Boolean(id && allowed && /^\d+$/.test(id) && /^\d+$/.test(allowed) && id === allowed);
}
