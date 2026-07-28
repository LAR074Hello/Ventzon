# CLAUDE.md — standing rules for Ventzon

Working rules, read every session. **`design-notes.md` is the decision record**
— the *why*, and the history. This file is the *how*. When they conflict,
design-notes.md wins on facts; this file wins on process.

---

## 1. Priority: beta first

The only thing that matters right now is the **consumer app** reaching a
private beta.

- **Build:** consumer surfaces (`src/app/customer/**`, share pages, auth,
  places, feed, profiles).
- **Defer:** merchant surfaces, monetization, billing, insights, sales tooling.
  Do not "improve while passing through." Merchant screens are deliberately
  un-retokenized — that is expected, not a bug.

If a task would be better done after beta, say so and leave it.

## 2. Quality bar

Ship at the level of **Instagram, Pinterest, Apple, TikTok, Airbnb, Arc**. That
is the standard for spacing, motion, empty states, loading, touch targets, and
the feel of a transition — not a mood board.

**Borrow interaction patterns. Never borrow visual identity.** Take the sheet
that snaps, the gesture that feels right, the way a list reveals itself. Do not
take a color, typeface, icon, logo, or layout that reads as another product's
brand. Ventzon looks like Ventzon.

## 3. The approval gate — one per slice

For any non-trivial change, in this order, and then **stop**:

1. **Audit** — read the actual code first. No assumptions about what exists.
2. **List affected files** — explicit paths.
3. **Plan** — what changes, in what order.
4. **Flag concerns** — risks, unknowns, things that look wrong.
5. **Wait for Luke's approval.**

One gate per slice, not per file. Once a slice is approved, execute the whole
slice without re-asking. Do not begin implementing during the audit.

## 4. Design-director scope

Design authority is **bounded to the screens in the current slice**. Full
license to get those right. No drive-by redesigns of screens outside the slice,
however tempting — inconsistencies outside scope get logged in
`design-notes.md`, not fixed.

## 5. $0 development mode

No paid service is added, upgraded, or enabled during development. When a
feature genuinely needs spend or needs to wait, stub it and mark it:

```ts
// PRE-LAUNCH: links to the claim flow in Slice 1.5
// POST-BETA: swap the stub for the real Stripe webhook
```

- `// PRE-LAUNCH:` — must be resolved before public launch.
- `// POST-BETA:` — deliberately deferred until after the beta.

These markers are the launch checklist. Use them instead of TODO.

## 6. Additive and non-destructive

- Add columns, routes, components. Do not drop, rename, or repurpose existing
  ones without an explicit decision.
- Migrations are **expand-only** — the contract is that already-deployed code
  keeps working against the new schema.
- Never delete user data, production rows, or files to make something pass.
- Never `git push --force`, never rewrite published history, never `reset --hard`
  over uncommitted work.

## 7. Pre-commit visual audit

Before committing any UI change, capture and actually look at:

**375 / 768 / 1440 px, in both light and dark.**

```bash
npm run shot -- /customer --width 375
```

`--theme` defaults to `light,dark`. Repeat per width; output lands in
`.screenshots/` (gitignored). Review the images before committing — the point
is to catch what a diff cannot.

## 8. Repo hazard: use `/usr/bin/git`

`/usr/local/bin/git` (2.15.0) is a Rosetta-era relic. Its system config sets
`core.excludesFile = ~/.gitignore`, and **that file contains `*`** (left by
virtualenv). It therefore reports a filthy tree as clean.

**Always `/usr/bin/git` (2.50.1) for anything where the answer matters.**

## 9. Commands

```bash
npm run dev           # next dev
npm run verify:dev    # proves the app is wired to DEV, not prod — run before seeding
npm run dev:seed      # seed dev data
npm run backup        # tables + auth.users + storage objects
npm run shot          # screenshots, see §7
npm run lint:changed
```

`.env.local` points at **dev** (`ziowgeluoertdxslehbl`). Production is
`pxdnwpqnmuzpdtjvbawa`. `verify:dev` fails loudly if that is ever confused —
do not work around it.
