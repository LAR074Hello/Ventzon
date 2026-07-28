# Production runbook — visual deploy + places migration

Regenerated 2026-07-25 from what is on disk. Written to be **executed, not
improvised**. If a step's actual output does not match its "You should see"
box, stop and go to the rollback trigger for that phase. Do not proceed on a
partial match, and do not "just re-run it" unless the step says it is
idempotent.

**Repo location is now `~/ventzon`** (moved off iCloud). Every command below
assumes you are in it.

## Facts this runbook is built on

| Thing | Value |
|---|---|
| Production Supabase ref | `pxdnwpqnmuzpdtjvbawa` |
| Dev Supabase ref | `ziowgeluoertdxslehbl` |
| What `.env.local` points at right now | **dev** (`ziowgeluoertdxslehbl`) |
| Vercel project | `ventzon` (`prj_BCRAEtCz9fpqwFLCWG48msXCZV7r`) |
| Phase A commit | `af8d550` — "Phase C complete: last four screens, chrome, and deferred decisions" |
| Local `master` tip | moves as work lands — **not** a fixed value, see A1 |
| `origin/master` | `346299d` until A7 pushes it to `af8d550` |
| Vercel production branch | `master` — pushing to it deploys production |
| What Preview points at | **dev** (`ziowgeluoertdxslehbl`) since 2026-07-27 |
| Backup destination | `~/ventzon-backups/` (NOT `~/Documents/` — that is iCloud-synced) |

### Two phases, and the third act this runbook does NOT cover

- **Phase A** — deploy `af8d550`. Visual redesign. **Touches no database.**
- **Phase B** — run the three `20260726_places_*` migrations. **Expand-only.
  No deployed code reads the new columns.**
- **Phase C (NOT IN THIS RUNBOOK)** — deploying the Slice 1.3 places code
  (the tip of local `master`). This is a separate, later, deliberate act. It is the
  deploy that makes `/p/[id]` and `/place/[slug]` publicly reachable. **Do not
  run it in the same sitting.** See the note at the bottom.

The gap between B and C is the safety margin: while it is open, the rollback
is lossless.

---

# PHASE A — deploy the visual redesign

No database involvement whatsoever. If something goes wrong here, nothing is
at risk except what the site looks like.

> **Before you start:** the iOS app is a remote wrapper on
> `https://www.ventzon.com/customer`. This deployment ships to every installed
> user immediately, with no review and no update prompt. Rollback is equally
> immediate. Do this when you can watch it for 20 minutes, not at midnight.

> ### 🚨 CORRECTED 2026-07-27 — do NOT promote the preview
>
> The original A7 said "⋯ → Promote to Production" on the `deploy-visual`
> preview. **That is now unsafe and must not be used.**
>
> Vercel's Promote reuses the existing **build artifact** rather than
> rebuilding, and Next.js inlines `NEXT_PUBLIC_*` values into the client
> bundle **at build time**. Preview is now deliberately pointed at the dev
> Supabase project, so the preview bundle has the *dev* database URL baked in.
> Promoting it would hand every production user a client that talks to dev.
>
> This is not theoretical — it is measured. The current `deploy-visual`
> preview bundle contains `ziowgeluoertdxslehbl` (dev) and zero occurrences of
> `pxdnwpqnmuzpdtjvbawa` (production).
>
> The failure is quiet, because it is asymmetric: `SUPABASE_URL` and
> `SUPABASE_SERVICE_ROLE_KEY` are read on the **server at runtime** and would
> resolve to production correctly. Only the browser half would be wrong. The
> API would look healthy while the client wrote to the wrong database.
>
> **A7 is now a git push to `master`**, which makes Vercel build a fresh
> production deployment against the Production environment. A8 verifies the
> bundle rather than assuming it.
>
> Rollback is unaffected: promoting a previous **production** deployment is
> still safe, because it was built with production env. The rule is narrow —
> never promote a *preview* build to production.

### A1. Get into the repo and confirm you are where you think you are

```bash
cd ~/ventzon && /usr/bin/git fetch origin -q && /usr/bin/git rev-parse --abbrev-ref HEAD && /usr/bin/git merge-base --is-ancestor af8d550 HEAD && echo "af8d550 IS an ancestor of HEAD — ok" && /usr/bin/git rev-parse --short origin/master
```

**You should see:** `master`, then `af8d550 IS an ancestor of HEAD — ok`, then
`346299d`.

This deliberately does **not** pin the local tip sha. `master` gains commits as
work lands, and an earlier version of this runbook pinned a tip that was stale
within the hour. What actually matters for Phase A is only three things: you
are on `master`, `af8d550` is an ancestor of it, and `origin/master` has not
moved yet.

**Wrong looks like:** not on `master`; the ancestor check failing (you are on a
tree that does not contain `af8d550` — **stop**); `origin/master` already at
`af8d550` (A7 has already run — skip to A8); or the word `rebase`/`merge` in
`git status`.

Use `/usr/bin/git` explicitly. The `git` on your PATH is a Rosetta relic.

### A2. Confirm af8d550 is the commit you think it is

```bash
cd ~/ventzon && /usr/bin/git log -1 --format='%H%n%ci%n%s' af8d550 && /usr/bin/git ls-tree -r --name-only af8d550 | grep -cE 'supabase/migrations/20260726'
```

**You should see:**
```
af8d550d752450c114c381df6b3f4574a6c41a92
2026-07-25 17:43:17 -0400
Phase C complete: last four screens, chrome, and deferred decisions
0
```

**The `0` is the important line.** It means af8d550 contains none of the
20260726 migrations. If it is anything other than `0`, you have the wrong
commit — **stop**, this whole phase-separation is void.

### A3. Confirm the deploy branch — ✅ ALREADY DONE 2026-07-27

```bash
cd ~/ventzon && GIT_TERMINAL_PROMPT=0 /usr/bin/git ls-remote --heads origin deploy-visual
```

**You should now see:** `af8d550d75...  refs/heads/deploy-visual`.

A3 originally expected *empty* output. The branch was pushed on 2026-07-27, so
a sha is now the **correct** result — as long as it is `af8d550`. Any other sha
means something else was pushed over it: stop and decide deliberately, and do
not force-push.

### A4. Push the commit to a deploy branch — ✅ ALREADY DONE 2026-07-27

```bash
cd ~/ventzon && /usr/bin/git push origin af8d550:refs/heads/deploy-visual
```

**You should see:** `* [new branch] af8d550 -> deploy-visual`, or
`Everything up-to-date` if you re-run it now.

**Wrong looks like:** `! [rejected]`, or an auth prompt that fails. Nothing has
happened yet if this fails — just resolve and retry.

Note this pushes **only** `af8d550` and its ancestors. Your **10** later commits
(Slice 1.3 places code, plus the 2026-07-27 fixes and docs) stay local.
`origin/master` is untouched and stays at `346299d` until A7.

### A5. Wait for the Vercel preview build

Open the Vercel dashboard → project `ventzon` → Deployments. Find the
deployment for branch `deploy-visual`.

**You should see:** status `Ready`, branch `deploy-visual`, commit `af8d550`.

**Wrong looks like:** `Error` or `Canceled`. Open the build log. **Do not
proceed on a failed build.** Nothing is live yet — a failed preview is a free
failure. Fix and push again.

### A6. Actually look at the preview before deploying

The preview reads the **dev** database and is safe to click through — nothing
you do here touches production data. Deployment protection is on, so browse it
signed in to Vercel, or use the automation bypass secret (Project Settings →
Deployment Protection → Protection Bypass for Automation).

Check, at minimum:

- `/customer` — the home feed renders, light theme, civic green accents
- `/customer/explore`
- One shop/business profile page — use a **dev** slug such as `bloom-co`.
  Production slugs like `bloom-florist` do not exist in dev and will correctly
  show "Shop not found".
- `/merchant/...` — should look **unchanged** (merchant surfaces were not
  retokenized; that is expected, not a bug)

**Wrong looks like:** a black splash, unstyled text, or a 500. The black
splash *specifically on the installed iOS app* is known and cosmetic (hardcoded
`#000000`, needs a native build) — that is not a reason to abort. An unstyled
or 500-ing web page is.

### A7. Deploy to production — by pushing `af8d550` to `master`

**Not by promoting the preview.** See the corrected note at the top of this
phase. Vercel's production branch for this project is `master`, so this push
makes Vercel build a *fresh* production deployment against the Production
environment.

First confirm it is a plain fast-forward — no force, ever:

```bash
cd ~/ventzon && /usr/bin/git fetch origin && /usr/bin/git merge-base --is-ancestor origin/master af8d550 && echo "fast-forward OK" || echo "NOT a fast-forward — STOP"
```

**You should see:** `fast-forward OK`.

Then push:

```bash
cd ~/ventzon && /usr/bin/git push origin af8d550:master
```

**You should see:** `346299d..af8d550  af8d550 -> master`.

This moves `origin/master` from `346299d` to `af8d550` — 10 commits, all of
them the visual redesign. Your local `master` stays ahead and is
**not** pushed; the Slice 1.3 places code and tonight's three fixes remain
local until Phase C.

**Wrong looks like:** `! [rejected]` or `non-fast-forward`. Stop. Do not add
`--force`.

### A8. Verify production — including which database the bundle points at

First, is it up and serving the new build?

```bash
curl -sI https://www.ventzon.com/customer | head -1
```

**You should see:** `HTTP/2 200` (a `3xx` on `/customer` alone is fine — it
redirects; `/customer/explore` should be `200`).

Now the check that matters. **Prove the shipped client bundle points at the
production database and not dev.** This is the exact failure mode the corrected
A7 exists to prevent, and it is invisible from the API side.

```bash
cd /tmp && B=https://www.ventzon.com && curl -s "$B/customer/explore" | grep -oE '/_next/static/chunks/[a-zA-Z0-9_./-]+\.js' | sort -u | while read -r c; do curl -s "$B$c"; done > vz-bundle.txt && echo "prod ref pxdnwpqnmuzpdtjvbawa: $(grep -c pxdnwpqnmuzpdtjvbawa vz-bundle.txt)" && echo "dev  ref ziowgeluoertdxslehbl: $(grep -c ziowgeluoertdxslehbl vz-bundle.txt)"
```

**You should see:**

```
prod ref pxdnwpqnmuzpdtjvbawa: 1
dev  ref ziowgeluoertdxslehbl: 0
```

**The `0` on the dev line is the important one.** Any non-zero value there
means a preview-built artifact reached production — **roll back immediately**
(see the trigger below) and redeploy via A7. A `0` on *both* lines means the
chunk scrape found nothing; re-run and check `wc -l vz-bundle.txt` is non-zero
before trusting the result.

Then open `https://www.ventzon.com/customer` in a browser **and** open the
installed iOS app. The iOS app should show the new design without any update.

**Wrong looks like:** 500, a blank screen, or the old design still showing
after 2 minutes.

### 🛑 PHASE A ROLLBACK TRIGGER

**Roll back if:** production returns 5xx, the customer app renders blank or
unstyled, the iOS app fails to load content, **or the A8 bundle check reports a
non-zero dev ref.**

**Rollback:** Vercel dashboard → Deployments → find the previously-production
deployment (`346299d`, `dpl_HrW6CCxYt8bJK7WKmvxQhx4iekV7`, marked as a rollback
candidate) → **⋯ → Promote to Production**. This reverts the web *and* the iOS
app instantly.

Promoting **that** deployment is safe: it is a previous *production* build, so
it was compiled against the Production environment. The prohibition is narrow
and specific — never promote a **preview** build.

Rolling back the deploy does not rewind git. `origin/master` stays at
`af8d550`; fix forward from there rather than force-pushing it back.

There is no database state to undo. That is the entire point of doing Phase A
alone first.

**Stop here.** Let Phase A sit in production for at least a day before you
start Phase B. If you are doing both in one sitting, you have not understood
why they are separate.

---

# PHASE B — the places migration

Three migrations, run against the **production** Supabase project. They are
**expand-only**: nothing is dropped, nothing is altered on an existing table,
and no code deployed in Phase A knows these columns exist. Production can sit
in this state indefinitely.

## B0. PREREQUISITE — you need production credentials in hand

Production credentials are **no longer in the repo** (removed 2026-07-25).
Before you start, have open in front of you, from the Supabase dashboard for
project `pxdnwpqnmuzpdtjvbawa`:

- the production `service_role` key (Project Settings → API keys)
- the SQL Editor for that project

> **Do NOT edit `.env.local` to point at production.** It currently points at
> dev and it should still point at dev when you finish. Every command below
> passes production credentials **inline**, for one command only, so there is
> no state left behind pointing local tooling at live data. `scripts/backup.mjs`
> merges `process.env` over `.env.local`, so inline vars win.

### B1. Create the backup destination — NOT in iCloud

```bash
mkdir -p ~/ventzon-backups && ls -d ~/ventzon-backups
```

**You should see:** `/Users/lukerichards/ventzon-backups`.

**Why this and not `~/Documents/`:** Desktop & Documents sync is iCloud. iCloud
is what put duplicate files inside `.git` and forced the repo move. A backup
that iCloud can evict, duplicate, or half-upload is not a backup. `~/ventzon-backups`
is outside every synced folder.

### B2. Confirm you are about to back up PRODUCTION and not dev

```bash
cd ~/ventzon && grep -E '^SUPABASE_URL=' .env.local
```

**You should see:** `SUPABASE_URL=https://ziowgeluoertdxslehbl.supabase.co`
(dev). Good — that is the safe resting state, and B3 overrides it inline.

### B3. Take the backup

Replace `<PROD_SERVICE_ROLE_KEY>` with the real key. This is the only command
in the runbook that reads production data.

```bash
cd ~/ventzon && SUPABASE_URL=https://pxdnwpqnmuzpdtjvbawa.supabase.co SUPABASE_SERVICE_ROLE_KEY='<PROD_SERVICE_ROLE_KEY>' npm run backup
```

**You should see:** a line `dumping pxdnwpqnmuzpdtjvbawa -> .backups/pxdnwpqnmuzpdtjvbawa-<timestamp>`,
then a row per table with counts, then `auth.users`, then a `storage objects`
line with an MB figure, then `dump complete.`

Sanity-check three numbers against what you know is live: **`posts` should be
3**, `shops` and `customers` should be in the tens (~90 accounts).

**Wrong looks like:**
- `dumping ziowgeluoertdxslehbl` → you backed up **dev**. Useless. Redo with
  the env vars actually set.
- `WARNING: N object(s) failed to download` → storage files are missing from
  the backup. **This is a stop.** Storage has no other backup at any Supabase
  tier. Do not migrate until this is clean.
- Any table erroring out → stop.
- `posts` count of 0 → you are looking at the wrong project.

Note: **do not** pass `--verify` here. It writes `bak_*` tables and the script
refuses to run it against production by design.

### B4. Move the backup out of the repo and report its size

```bash
cd ~/ventzon && mv .backups/pxdnwpqnmuzpdtjvbawa-* ~/ventzon-backups/ && du -sh ~/ventzon-backups/* && du -sh ~/ventzon-backups
```

**You should see:** a per-backup size and a total. **This total is the number
you need** — it is what you are manually copying to the USB drive.

**Copy it to the USB drive now, before running any SQL.** A backup that exists
in exactly one place on the same laptop is one spilled coffee from being no
backup. Two locations, or do not proceed.

Confirm the copy landed:

```bash
ls -R /Volumes/<YOUR_USB>/ventzon-backups | head -20
```

**You should see:** the same timestamped folder, with `manifest.json`,
per-table `.json` files, `auth_users.json`, and a `storage/` tree.

### B5. Record the pre-migration state

In the Supabase **SQL Editor for `pxdnwpqnmuzpdtjvbawa`**, run:

```sql
select
  (select count(*) from public.posts)    as posts,
  (select count(*) from public.checkins) as checkins,
  (select count(*) from public.shops)    as shops,
  to_regclass('public.places')           as places_table_exists;
```

**You should see:** your three counts, and `places_table_exists` = **`null`**.

**Wrong looks like:** `places_table_exists` returning `places`. The table
already exists — a previous attempt got partway. **Stop.** Do not re-run the
expand migration blind; work out what state you are in first.

**Write these three counts down.** Step B9 compares against them.

### B6. Migration A — expand

In the SQL Editor for `pxdnwpqnmuzpdtjvbawa`, paste the **entire** contents of:

```
~/ventzon/supabase/migrations/20260726_places_expand.sql
```

Run it.

**You should see:** `Success. No rows returned.`

**Wrong looks like:**
- `function public.set_updated_at() does not exist` → a prerequisite from the
  baseline migration is missing in production. **Stop, rollback trigger.**
- `relation "public.shops" does not exist` → wrong project. Stop.
- Any `permission denied` → you are not running as the service role / SQL
  Editor owner. Stop.

This creates `public.places` with RLS **enabled and no anon policy** — that is
deliberate, not an oversight. The anon key ships in the browser bundle, and
RLS cannot hide columns.

### B7. Migration B — backfill

Paste and run the entire contents of:

```
~/ventzon/supabase/migrations/20260726_places_backfill.sql
```

**You should see:** `Success` with a row count equal to your `shops` count
from B5 (one place per existing shop).

**Wrong looks like:** `0 rows` inserted on a first run → the insert matched
nothing; something is wrong with `shops`. Stop.

This one is idempotent (`on conflict (slug) do nothing`), so re-running it is
safe if you are unsure whether it completed.

### B8. Migration C — link posts and checkins

Paste and run the entire contents of:

```
~/ventzon/supabase/migrations/20260726_posts_place_link.sql
```

**You should see:** `Success`. This adds `place_id` to both `posts` and
`checkins` and backfills through the shared slug. `shop_slug` **stays** on both
tables — both columns coexist for the whole transition. That is what makes the
rollback lossless.

**Wrong looks like:** any error mentioning a foreign key violation → the
backfill in B7 did not produce the places it should have. Stop, rollback.

### B9. Verify — this is the step that decides everything

In the SQL Editor:

```sql
select
  (select count(*) from public.places)                                   as places,
  (select count(*) from public.shops)                                    as shops,
  (select count(*) from public.posts)                                    as posts,
  (select count(*) from public.posts    where place_id is not null)      as posts_linked,
  (select count(*) from public.posts    where shop_slug is not null)     as posts_with_slug,
  (select count(*) from public.checkins)                                 as checkins,
  (select count(*) from public.checkins where place_id is not null)      as checkins_linked;
```

**You should see:**
- `places` **=** `shops`
- `posts` **unchanged** from your B5 number (should still be 3)
- `checkins` **unchanged** from your B5 number
- `posts_linked` = `posts_with_slug` (every post that had a slug got a place)
- `checkins_linked` = `checkins`

**Wrong looks like:**
- `posts` or `checkins` changed from B5 → **something destroyed rows. Immediate
  rollback trigger.** This should be impossible — these migrations only ADD —
  but it is the one thing worth checking explicitly.
- `places` < `shops` → the backfill under-inserted. Re-run B7 (idempotent) and
  re-check. If still short, stop.
- `posts_linked` well below `posts_with_slug` → slug mismatch between `shops`
  and `posts`. Not data loss, but do not proceed to Phase C until understood.

Also confirm the slug freeze actually took:

```sql
update public.places set slug = slug || '-x' where slug = (select slug from public.places limit 1);
```

**You should see:** an **ERROR**: `places.slug is immutable (attempted ... -> ...)`.

**Wrong looks like:** `Success`. The trigger did not install. Not urgent, but
fix it before anything writes to `places`. (If it did succeed, immediately set
that one slug back.)

### B10. Confirm production is still serving the Phase A build

```bash
curl -sI https://www.ventzon.com/customer | head -1
```

**You should see:** `HTTP/2 200`. Nothing in Phase B should have touched the
running app — this is confirming exactly that.

### 🛑 PHASE B ROLLBACK TRIGGER

**Roll back if any of these:**
- any migration errored partway through
- `posts` or `checkins` row counts changed from B5
- `places` count does not reach `shops` count after re-running B7
- anything at all in production starts 5xx-ing

**Rollback procedure — while no deployed code reads `place_id` (i.e. before
Phase C), this is lossless:**

1. Confirm production is still on the Phase A build (`af8d550`). It should be —
   Phase B deployed nothing.
2. In the SQL Editor for `pxdnwpqnmuzpdtjvbawa`, paste and run the entire
   contents of `~/ventzon/supabase/migrations/20260726_places_ROLLBACK.sql`.
3. Re-run the B5 query. **You should see** `places_table_exists` back to `null`
   and your three counts unchanged.

Nothing is lost: every `places` row derived from `shops`, and every
`place_id` derived from `shop_slug` — which is still present and still
authoritative.

> **⚠️ Order matters after Phase C.** Once the places code is deployed,
> rolling back means **promoting the previous Vercel build FIRST, then** running
> the rollback SQL. Reversing that order takes the live app down.

---

# After Phase B: what is and is not done

Production now has the places schema and **no code reading it**. That is a
stable resting state — leave it there.

**Not covered by this runbook, on purpose:**

- **Phase C — deploying the Slice 1.3 places code** (the tip of local `master`,
  which also carries the three 2026-07-27 fixes: read-only settings GET,
  split error states, capped feed width).
  This is what makes `/p/[id]` and `/place/[slug]` publicly reachable for the
  first time. Those routes do **not** exist in `af8d550` — they were added in
  `348fab4`, four commits later. Phase A cannot expose them.
- The **safety slice** must be finished before Phase C, not before "resubmission".
  The iOS app is a remote wrapper; deploy-time *is* release-time.
- `origin/master` is still at `346299d`. Pushing master is its own decision.
- Production `service_role` key rotation is still outstanding and must be
  coordinated with Vercel env vars.
