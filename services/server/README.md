# Server reflection service

The HTTP route parses input, `review-domain.ts` composes validated changes, and the
Prisma repository performs transactions. No HTTP request sends an `updateDomain`
callback or a full Workspace snapshot. The API is intentionally not connected to
the current `/reflections` UI yet; that is part of Sprint 5.2.
