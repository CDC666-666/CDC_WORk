# Server repositories

`review-repository.ts` is the Prisma implementation for server reflections. It
filters every query by Workspace, checks project ownership, commits writes before
returning data, and uses atomic version predicates for update/delete. The existing
localStorage repository remains the daily workspace adapter in Sprint 5.1.
