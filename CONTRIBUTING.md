# Contributing

MeCart is developed on Next.js 16 with a Supabase backend. Contributions should preserve the existing module boundaries, migrations workflow, and security model.

## Getting started

1. Fork and clone the repository.
2. Install dependencies with `npm install`.
3. Create `.env.local` and `.env` from the variable names in `INSTALL.md`; never commit either file.
4. Apply Supabase migrations and run `npm run seed:admin`.
5. Start development with `npm run dev`.

## Branches and commits

- Branch from the default branch using `feat/...`, `fix/...`, or `chore/...`.
- Use imperative, scoped commit messages (for example, `fix: guest cart merge on sign-in`).
- Keep commits focused and reviewable; separate database migrations from UI changes when practical.
- Do not amend published history on shared branches.
- Rebase feature branches before opening review when feasible.

## Code standards

- Run `npm run typecheck` and `npm run lint` before opening a PR.
- Format with `npm run format` (Prettier 3 with the Tailwind plugin).
- Prefer server components and server actions where sensible; keep client bundles small.
- Add zod validation for new input surfaces.
- Do not introduce placeholder or TODO code in production paths.
- Follow existing file layout (`app`, `components`, `lib`, `scripts`, `types`).
- Keep functions small and reuse repository helpers instead of duplicating SQL.

## Database changes

- Add a new ordered migration file under `supabase/migrations/`; never rewrite applied history.
- Include RLS policies for every new table.
- Document new tables/RPCs in `DATABASE_SCHEMA.md`.
- Regenerate `types/database.gen.ts` and update aliases in `types/database.ts`.
- Run `npm run verify:supabase` after migration changes when credentials are available.
- Verify foreign keys and constraints mirror app invariants.
- Keep migration filenames timestamped and descriptive.
- Backfill or seed reference data inside a dedicated migration when required.

## Admin and security

- Enforce role checks via `requireStaff`/`requireAdmin` on every admin server action.
- Record security-relevant admin mutations via `logAudit`.
- Keep service role key usage in server-only or script contexts.
- Preserve storage bucket policy boundaries (customer vs staff uploads).
- Do not widen RLS policies without documenting rationale.
- Avoid logging sensitive values in server code.

## Testing expectations

- Typecheck and lint must pass.
- Backend changes should be exercised through `verify:supabase` or targeted smoke checks.
- UI changes should include manual click-through notes in the PR.
- No secrets in logs, examples, or tests.
- Run the full verification script before release when credentials are available.

## Pull request process

- Explain the problem and the change.
- List manual test steps performed.
- Note any migration or environment implications.
- Attach screenshots for UI changes when useful.
- Keep PR scope limited; split large refactors.
- Request review for database and security-adjacent changes.

## Release discipline

- Update `CHANGELOG.md` for user-facing changes.
- Tag releases with a semantic version when publishing.
- Confirm deployment variables by name before promotion.
- Run a post-deploy verification pass.
- Verify recovery email flows in staging before production.

## Dependency management

- Pin dependencies through the lockfile.
- Prefer existing libraries over new ones.
- Document justification for new runtime dependencies.
- Keep dev-only tools in `devDependencies`.

## Style and naming

- Use TypeScript for new code and avoid `any` where practical.
- Use descriptive names for tables, functions, variables, and RPCs.
- Keep committed files formatted and sorted logically.

## Defect reports

Open an issue with reproduction steps, expected behavior, actual behavior, and environment details. Never include secrets, tokens, or private user data.