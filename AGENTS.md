# CDC AI Workspace Development Rules

## Product Scope

- This repository is a personal AI workspace for university study, engineering practice, knowledge management, projects, reports, and personal planning.
- RoboMaster is one first-level business module. The product must not be designed or described as a RoboMaster-only system.
- New features should support the broader needs of university students and engineering learners.

## Engineering Rules

- All application code must use TypeScript.
- The `any` type is prohibited. Define explicit domain types and component props.
- Components must have a single, clear responsibility.
- Mock data must live in the independent `data/` directory.
- Domain type definitions must live in the independent `types/` directory.
- Pages must depend on a service layer instead of importing mock data directly when future API integration is expected.
- Before building UI, define the data structure, user state, loading state, empty state, and error state.
- Every page must provide a reasonable loading, empty, or error experience as appropriate.
- Reuse existing components and patterns when they remain valid. Avoid unrelated refactors.

## Quality Gates

- Run `npm run lint` after changes.
- Run `npm run build` after changes.
- Fix errors introduced by the current change before delivery.
- Check desktop and narrow-screen layouts for overflow and overlapping content.
- Check all navigation routes for 404 responses.

## Security And Data Access

- Never store API keys, access tokens, passwords, or credentials in source code.
- Do not scrape platforms that require login, CAPTCHA, anti-bot bypass, or access-control circumvention.
- Do not add real platform crawlers or AI model calls without an explicit product and security review.
- Do not access files outside `CDC_WORK` unless the user explicitly requests it.
- Never modify `C:\Users\Lenovo\Desktop\StandardRobotpp`.
- Do not read or analyze `StandardRobotpp` without an explicit user request.

## Product States

- Features backed by mock data must be visibly marked as demo data.
- Placeholder routes must render a deliberate construction state instead of returning 404.
- AI interfaces must clearly state when no real model is connected.
- Financial features must remain simple personal records and must not provide investment advice.
