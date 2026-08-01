# Ventzon design pass — directions tried & rejected

Keep this updated so later passes don't recycle dead ends.

> **Status note (2026-07-24, Slice 1.1).** The palette sections below were
> written under the previous dark-primary/baby-blue direction and are kept as
> history, not as current guidance. The live system is **light-primary, civic
> green, dual theme**, defined in `src/app/globals.css` and rendered at
> `/dev/tokens`. Where an entry below is superseded it is marked inline.

---

## Type roles — the migration contract (Slice 1.8, Phase A)

The customer app carries 283 hardcoded `text-[Npx]` and 85 `tracking-[Nem]`
instances. **Do not migrate them by size.** A co-occurrence pass over all 283
showed the actual structure:

- everything **≤13px is letterspaced** (0.08–0.2em) and mostly `text-muted`
- everything **≥14px has zero tracking** and is mostly `text-ink`

11/12/13px are not three tiers of one hierarchy. They are three *different
roles* that happen to sit near each other in size — a tracked 11px label, an
untracked 12px metadata string, an untracked 13px body line. Mapping by size
flattens them precisely because it discards the signal that separates them.

**The migration key is `(tracked?, colour, weight) → role → scale step`.**

| Role | Today | Recipe |
|---|---|---|
| Section eyebrow | `text-[10px] tracking-[0.12em] font-semibold text-muted` | `text-xs font-semibold uppercase tracking-caps text-muted` |
| Tab / nav label | `text-[10px] tracking-[0.15em]` + `.toUpperCase()` | `text-2xs font-medium uppercase tracking-caps` |
| Badge / count chip | `text-[9px] font-semibold` | `text-2xs font-semibold` |
| Metadata (time, distance, counts) | `text-[11px]/[12px] font-light text-muted` | `text-xs text-muted` |
| Supporting copy | `text-[12px]/[13px] font-normal text-muted` | `text-sm text-secondary` |
| Body prose | `text-[13px]/[14px] text-ink` | `text-base` |
| Primary row text | `text-[14px] font-medium text-ink` | `text-base font-medium` |
| Card title | `text-[15px]–[18px] font-semibold` | `font-display text-lg font-semibold` |
| Screen title | `text-[20px]–[24px] font-semibold` | `font-display text-xl font-semibold` |
| Hero / big stat | `text-[26px]/[28px]` | `font-display text-2xl`, numerals `font-mono` |
| **Receipt line** | — | `font-mono text-xs text-muted` |

### `text-muted` splits in two

Today essentially everything non-primary is `text-muted`, which is the real
source of flatness: a supporting sentence and a timestamp render identically.
Supporting prose becomes **`text-secondary`**; only genuine metadata stays
**`text-muted`**. This adds a tier that does not currently exist.

### Mono discipline — mono means "receipt", not "small"

**Rejected: mono as the metadata voice.** An earlier draft of this plan sent
~70 metadata instances to DM Mono. Pervasive monospace reads as a *terminal*,
which is the developer-tool tell this whole replan exists to escape. At 70
instances it stops being an accent and becomes the app's texture.

**The rule: if it is proof that something happened, mono. If it is merely
small, not mono.**

- **Mono** — visit and stamp counts, check-in timestamps, reward progress,
  redemption and check-in codes, PIN entry, the Postmark's own date.
- **Not mono** — relative times ("3h ago"), distances ("0.4 mi"), like and
  comment counts, follower counts, category chips, addresses. These are
  ordinary UI copy: `text-xs text-muted` in Public Sans.

Target is **15–20 mono instances** in the customer app, not 70. Both variants
are rendered side by side under "Mono discipline" at `/dev/tokens`.

### Tracking — what replaces the wide micro-caps

Wide letterspacing reads as luxury-retail signage. It belonged to the
dark-neon identity and fights warm paper and civic green.

1. **Section eyebrows** keep uppercase; tracking cut ~60% to `tracking-caps`
   (0.06em). The one sanctioned survivor.
2. **Where the eyebrow did real hierarchy work**, drop uppercase entirely and
   separate with **weight and colour at sentence case** — `text-sm
   font-semibold text-primary` over `text-sm text-secondary`.
3. **Buttons: tracking to zero, sentence case.** `tracking-[0.1em]` on a
   button is the loudest single holdover from the old identity.
4. **Data strings: tracking zero.** Mono is already wide; tracking it
   double-counts.
5. **The `0.5em` cases** are PIN entry and logo lockups. PIN keeps wide
   spacing as a documented functional exception (it separates digits) —
   better still, mono with per-digit boxes.

### No step between `text-base` and `text-lg`

A 17px `text-md` was defined and then removed: nobody remembers whether `md`
outranks `base`, and 16→17px is a 6% delta, below where size does reliable
hierarchy work. A row's primary line out-ranks body with **weight**
(`text-base font-medium`). The strongest counter-case is iOS list metrics —
Apple's `.body` is 17px and this ships to iOS via Capacitor — but we are not
cloning UIKit, and our display face carries titles. If a real case survives
Phase C it returns as `text-row`, not `text-md`.

---

## Rejected
- **Marquee gold as the signature hue** — approved initially, then pulled by
  the owner: the stamp-ledger SHAPE is the signature, not the hue. Brass
  light-mode derivation (#936509) died with it.
- ~~**Accent alternatives**: neon magenta, awning green, diner cyan, violet
  neon. Chosen: baby blue — #89CFF0 / #2C6C94.~~ **Superseded 2026-07-24.**
  Accent is now civic green (`#12513F` light / `#3FA88A` dark). Note the irony
  that "awning green" was passed over here for generic-success-state risk;
  that risk is handled instead by giving success/danger/proof three separated
  lanes — green, red, and indigo.
- ~~**Light/cream base palette** — flipping the base would be a redesign, not
  a design pass.~~ **Superseded 2026-07-24.** It *was* a redesign, and it was
  the right one; light is now the default for new accounts.
- **Per-shop hashed accent colors** (original app behavior) — 8 random hues
  made every screen a different color story. Shop identity carries through
  logos and photos instead.
- **Variant B "Counter" (dense receipt rows)** — great scanning, but thumbnails
  demote media; feed stopped feeling social. Density register lives on in
  follower lists / map sheet instead.
- **Variant C "Marquee" (full-bleed text-on-image)** — dramatic but fragile:
  light photos break legibility, captions must stay short, and gold-pill-on-
  every-card devalued the signature. Its earn-pill idea survives in the map pin.
- **Floating Visit & Earn chip detached below the caption** — read as an ad
  unit. Fused into the media card as a footer instead.
- **Emoji glyph action row (♥ 💬)** — cheapened the editorial register;
  replaced with a muted "12 likes · 3 comments" text line.
- ~~**Inter/Inter Tight for display** — default-looking; display moved to
  Bricolage Grotesque.~~ **Superseded 2026-07-24.** Display is now Archivo
  (variable, width axis); data/utility is DM Mono. Public Sans stays for body.
- **Mono as the metadata voice** — see "Mono discipline" above.
- **A 17px `text-md` step** — see above.

## Green is brand only — never a status (decided 2026-07-25)

> **Green is brand. It is never a success, completion, or confirmation state.**

The collision arrived earlier than expected and was visible in the component
gallery: a green `Visit` pill sitting inches from green reward dots reading
`REWARD READY`. Green was doing brand-action and completion-state
simultaneously, inside one 200px span — exactly the "generic success-state
risk" the original notes predicted when they passed over awning green.

The fix is not to abandon civic green. Spotify, Starbucks and Whole Foods all
hold green as identity; they manage it by never letting green mean *done*.
So:

- **Green keeps**: primary calls to action, brand marks, the accent chip.
  `Visit`, `Check in`, `Save` — things you press.
- **Green loses**: reward progress dots, `REWARD READY`, completion
  checkmarks, "verified" ticks, anything that reports state rather than
  invites action. Those become **ink with a mark** — a filled ink dot, a
  check glyph — which reads as a tally, not a traffic light.

Ink for completion also happens to suit the product: a stamp card is a
*record*, and records are printed in ink, not lit up in green.

If Phase C shows the collision surviving even under this rule, the accent
moves — it is one token. Try the cheaper fix first.

Related, already consistent with the rule: the filled `FollowButton` state
was kept ink rather than accent for the same reason.
## Card padding rule (decided, Slice 1.8)

**`p-4` on mobile, `sm:p-5` from 640px up**, for any card containing prose.

Measured at 375px with a 464-character sample in Public Sans 16/24:

| context | content width | chars/line |
|---|---|---|
| card `p-5` inside page `mx-5` | 295px | 36 |
| card `p-4` inside page `mx-5` | 303px | **39** |
| card `p-4` inside page `mx-4` | 311px | 39 |
| full-bleed card `p-4` | 343px | 42 |
| page level, no card | 335px | 42 |

Readable band is 35–45. **Correction to an earlier note in this file: the
"~30 chars/line" figure was wrong.** It was measured on `/dev/tokens`, which
uses `px-6` page padding inside a `max-w-6xl` wrapper — heavier chrome than
the app. Under real app conditions the current `p-5` gives 36, which is inside
the band at the low end, not below it. `p-4` moves it to 39, comfortably
mid-band, for a one-token change. Full-bleed would reach 42 but costs
structure and is not needed.

**The deeper rule: prose is never double-padded.** A page gutter plus a card
inset is 40px of chrome before the first character. Long-form copy — post
captions, place descriptions — sits at page level rather than nested in a
padded card. SocialFeed already does this correctly: its caption is a sibling
of the media envelope, not a child of it.

## Deferred to post-beta (decided 2026-07-25, with reasoning)

The beta target is 1,000 users in one metro. Everything below is real work
that is **not required to invite strangers safely**, so it waits. Recorded
with the reasoning because in October the list alone will not explain itself.

- **Claim flow and verification tiers (1.5).** A tier badge only matters once
  merchants are competing for credibility. At 1,000 users in one neighbourhood
  the map carries trust, and every place is either seeded or imported anyway.
  Architecture keeps room: `places.claimed_by` and `verification_tier` land
  with 1.3's schema so nothing has to be re-migrated later.
- **Merchant/rep retokenization (1.7).** 894 hex values, all mechanical, and
  no beta user ever opens those screens. Merchant chrome looking off-identity
  for a few weeks costs nothing; the profile merge and composer sliding costs
  the whole point of the replan.
- **Merchant analytics on the event log.** The *log* still ships in 1.4
  because it cannot be backfilled. Reading from it can wait — an analytics
  dashboard is a retention tool for paying merchants, and there are no paying
  merchants in a beta.
- **Feed slot system.** Promotion infrastructure. `promotable` and
  `promotion_id` ship nullable and unused in 1.4 so the columns exist; no UI.
- **Marketing site: public Explore, city pages, /business (2.5).** This is the
  SEO and cold-start surface for *organic* growth. A 1,000-person invited beta
  in one metro does not grow organically — it grows by invitation. Share pages
  for individual posts and places DO ship, because that is the loop that
  actually operates during a beta: someone posts, sends a link, the recipient
  lands on something real.
- **Saves and collections.** Retention mechanic. Nothing to retain yet.
- **D5 bottom half — haptics, spring-physics tuning.** The top half ships
  (grid-to-post transition, skeletons, image pipeline, recruiting empty
  states) because those are the difference between "loads" and "feels built".
  Physics tuning is polish on polish.

Explicitly NOT deferred, despite looking merchant-adjacent:
**places as first-class objects (1.3)** — it is the cold-start fix, not
merchant infrastructure; **minimal event logging (1.4)** — half a session and
it cannot be reconstructed after the fact; **the $0.85 fee removal** — it is
deletion, and leaving dead billing paths around real users is a liability.

## Safety slice — decided ahead of build (2026-07-25)

- **Age gate fires at first contribution, not at launch.** Apple requires UGC
  *creation* to be gated, not browsing. Prompting all 90 existing accounts on
  next launch would create churn from friction rather than from under-13
  answers. Gate on the first post or comment attempt instead: same compliance
  posture, near-zero friction for anyone who only reads, and existing users
  meet it exactly when it matters. Read access is never gated.
- **Gate on posting AND commenting.** A comment is user-generated content
  under the same guideline; a gate that lets an unverified account comment is
  not a gate.
- **Under-13 closes the account.** "Keep browsing" would leave an account with
  an email attached to a self-declared child, which is precisely the
  collection COPPA prohibits. Under-13 → delete everything, tell them plainly,
  set a local flag so the form cannot be casually retried with a new year.
- **Store `birth_year` on `customer_profiles`, never on `customers`.**
  `customers` is per-shop, so a person with nine memberships would carry nine
  copies of their age. `customer_profiles` is the one-row-per-person table.
- **`deleteAccount()` is a general feature, not a COPPA branch.** Apple
  Guideline 5.1.1(v) requires in-app account deletion for any app with account
  creation, and we are submitting for beta. One function removes posts,
  comments, likes, check-ins, memberships, follows, blocks, notifications,
  profile and the auth user; the under-13 branch and a Settings entry (with a
  confirmation step) both call it. This turns a rejection risk into something
  already 90% built.
- **Report queue is one route, not a console.** Protected route, single role
  check, open reports newest-first, reported content inline, three actions —
  dismiss / hide / ban — and an audit row per action. Filters, assignment,
  bulk actions, analytics, appeals UI, reporter reputation and auto-escalation
  are all `// POST-BETA:`. Build for the volume 1,000 users actually generate.
- **Share pages are a moderation surface.** They are logged out, so no viewer
  and no block filtering is possible. They must exclude hidden content on
  their own, and must exclude banned authors once that flag exists. A share
  link is a moderation bypass if this is forgotten.

## Every deploy is an App Store release (no review)

`ios/App/App/capacitor.config.json` sets
`server.url = "https://www.ventzon.com/customer"`. With `server.url` set,
Capacitor **ignores the bundled web assets and loads the live site**. The
installed iOS app is a thin remote wrapper.

Consequences worth holding onto:

- **Pushing to Vercel ships to every installed user immediately.** No review,
  no update prompt, no staged rollout. A bad deploy reaches all of them at
  once.
- **Rollback is equally instant** — promoting a previous Vercel deployment
  reverts the iOS app too. That is a real advantage and the reason the
  migration runbook can treat "promote previous build" as a first-class
  rollback step.
- **Moderation obligations bind at deploy time, not at submission.** The
  moment a feature that accepts user content is live on the web, it is live
  in the App Store app. The safety slice therefore cannot be "finished just
  before we resubmit" — it has to be finished before the deploy that exposes
  what it protects.
- The redesign only affects **consumers**. Merchant surfaces are still
  hardcoded hex and untouched, so merchants see essentially no change.

**Needs a native build (App Store review), so bundle into the beta
submission:** splash screen and status bar are hardcoded `#000000`, giving a
black splash into a light app. Cosmetic, not broken — do not hold the web
deploy for it.

## Share pages are a new public surface (logged 2026-07-25)

`/p/[id]` and `/place/[slug]` become **publicly reachable for the first time**
when the Slice 1.3 places code deploys. Logged now so the safety slice scopes
for it rather than discovering it.

**Timing correction worth holding onto:** this is *not* the visual-redesign
deploy. The share routes do not exist in `af8d550` — they were added in
`348fab4`, four commits later, as part of Slice 1.3. So the deploy sequence is:

1. `af8d550` — visual redesign. No database, **no new public surface.**
2. the three `20260726_places_*` migrations. Expand-only, no code reads them.
3. `master` (`a5515a3`) — the places code. **This is the one that opens the
   surface.**

Only step 3 carries the obligation, which means there is a deliberate gap to
finish the safety work in.

**Low risk today, but not zero and not permanent:** both routes are
`robots: { index: false, follow: false }`, and production holds 3 posts. So
today the exposure is three posts to anyone holding a link. The reason it still
matters:

- **Deploy-time is release-time.** `server.url` points the installed iOS app at
  the live site, so the moment these routes are live on the web they are live
  in the App Store app — no review, no staged rollout. There is no later
  moment at which this surface "goes live" and can be gated then.
- **Logged-out means no viewer**, so no block filtering is possible. These
  pages must exclude hidden content *on their own* — they do today, via
  `lib/public-visibility.ts`, and `verify:dev` fails if that filter is dropped.
  Banned authors must join that filter the moment banning lands.
- **noindex is a crawler instruction, not access control.** It keeps the pages
  out of search results; it does not stop anyone with a link.
- Three posts is a fact about today, not a property of the surface. The
  Pittsburgh import and beta invitations both change the number without
  changing anything about the routes.

The safety slice therefore has to cover share pages explicitly — they are the
one surface where a moderation decision made in-app has to be independently
re-enforced by a logged-out renderer.

## Launch-phase required costs (not optional at 1,000 users)

- **Supabase Pro — $25/mo per project, plus PITR add-on.** The production
  project is on the **free** plan, which per Supabase's own docs means: daily
  backups cover Pro/Team/Enterprise only, backups are **not downloadable** on
  free, and **PITR is a paid add-on** available only on Pro and above (and
  requires at least a Small compute add-on). Today the only recovery path is
  `npm run backup`, run manually.

  That is defensible at 90 users and untenable at 1,000. A manual dump is a
  dump someone forgets. What beta actually needs:

  | Item | Cost | Buys |
  |---|---|---|
  | Pro plan | ~$25/mo | daily automatic backups, 7-day retention, downloadable; no inactivity pausing; support access |
  | PITR add-on, 7-day | ~$100/mo | recovery to any point, ~2 min RPO |
  | Small compute (PITR prerequisite) | ~$15/mo | required for PITR |

  **Minimum: Pro alone (~$25/mo)** gets automatic daily backups and removes
  the free-tier pause risk — that is the floor for real users. PITR is the
  difference between losing a day and losing two minutes; worth it once
  check-in volume is real, not before.

  Free-plan projects can also be **paused for inactivity**, which for a live
  App Store app is its own argument for Pro.

- **Storage objects still have no automatic backup at any tier.** Supabase's
  database backups exclude Storage. `npm run backup` now pulls them down as
  files; that stays the only mechanism regardless of plan, so it needs to run
  on a schedule before beta.

## Beta submission checklist (needs a native iOS build)

Everything here requires an App Store build and review, so it ships in one
submission rather than trickling:

- **Age rating updated to 13+ with UGC declared**, matching the actual gate.
  A mismatch is a rejection risk.
- **Splash screen and status bar** off hardcoded `#000000` — currently a
  black splash into a light app.
- **In-app account deletion** reachable from Settings (Guideline 5.1.1(v)) —
  the same `deleteAccount()` the under-13 branch calls.
- **`support@ventzon.com` receiving mail** — the parental-contact route in the
  under-13 copy points at it, so it must exist before that ships.

## Open decisions (logged, not fixed)

- **`promotions` has diverged in both directions.** Production has
  `audience`, `name`, `sent_at`; `20260218_promotions.sql` creates
  `created_by`, `reject_reason`, `approved_at`, `rejected_at`, `updated_at`.
  Neither is a superset, so the migration no longer describes the live table
  and there is no single canonical shape. Production also lacks two indexes
  its own migration creates (`job_applications_role_idx`,
  `job_applications_submitted_at_idx`). Dev currently carries the union.
  Needs a decision about which shape wins before anything is built on it.
- **ODbL share-alike on imported OSM places.** OpenStreetMap is licensed
  ODbL. Displaying the data with attribution is uncontroversial; the open
  question is share-alike on *derived databases*. If imported places become
  a core asset — mixed with visits, posts and claims — it needs a clear read
  on whether the resulting database is "derived" and what that obliges.
  **Get the answer before imported places are load-bearing, not after.** A
  workable hedge is keeping OSM-sourced rows attributed and separable from
  user-generated data, which the content/insert split already makes cheap.

- **Pittsburgh import — decisions already made (2026-07-25):**
  unclaimed, photo-less places **do** get a map pin, muted, and the place page
  reads as an invitation — *no one's posted here yet — be the first*. Empty
  places are recruitment surfaces, not deficiencies to hide; a sparse map is
  worse than a full map of quiet places. Ships with a "permanently closed?"
  report affordance, and anything with no OSM edit in two years is
  deprioritized. Depends on 1.3; the importer becomes a third caller of the
  same insert layer the seed uses.

- **Production service_role key rotation** — the key was found inline in
  `scripts/generate_insights_report.py` and in two iCloud config duplicates.
  Those copies are gone, but the key itself is unchanged. Rotation has to be
  coordinated with Vercel's env vars or the live app breaks.

## Removed-one-thing log
- Explore feed: removed the share arrow from the action row (share lives on
  the post page), then folded like/comment counts into one muted text line.
- Post grid: removed the gray placeholder treatment for text posts — they
  are typographic tiles now.
- Business profile: removed the white/yellow stamp split — stamps are gold
  or empty, nothing else.
- Token layer: removed the vestigial `.dark` variant and the
  `[class*="bg-surface"]` global shadow hack; `--elevation-1` replaces the
  latter properly.

## Flagged: values with no clean token mapping (do not guess)
- ~~**Error/danger red**: the approved 6-color palette has no danger color.~~
  **Resolved 2026-07-24.** `--danger` / `--on-danger` are real semantic roles
  (`#C63122` light — darkened from `#D83A2E`, which failed AA on paper —
  `#FF6B5C` dark).
- **Map tiles**: CartoDB basemap colors are third-party and can't be
  tokenized; the attribution text color matches the tile art, not our ramp.
- **Scrim gradients over photos** (featured cards): rgba black overlays are
  photo-legibility scrims, not palette colors — kept as rgba.

## Theme flags
- Photo scrims stay dark in both themes (legibility overlays, not palette).
- Scan screen is theme-exempt: camera viewfinder chrome stays dark.
- Map basemap picks light_all/dark_all at init; a live theme toggle reaches
  the map on next visit to the tab.
- ~~Elevation flips via a centralized shadow rule on bg-surface blocks.~~
  **Superseded 2026-07-24.** Use `.elevation-1` / `.elevation-2`: one class,
  correct in both themes, no per-component shadows.
- **Merchant and rep surfaces are unconditionally dark** (Slice 1.7) — same
  tokens, same type scale, same accent, via `data-theme="dark"` on their
  layout wrapper. Same identity, different room. **Exception: the QR display
  screen** (`/merchant/[shop]/qr`, and the print-card view) is a
  customer-facing surface, propped on a counter in daylight — it stays
  **light** regardless of the merchant's theme, and must not be swept into
  the blanket dark wrapper.

## Promoting a preview bakes in the wrong database (logged 2026-07-27)

**Vercel "Promote to Production" reuses the existing build artifact — it does
not rebuild.** `NEXT_PUBLIC_*` values are inlined into the client bundle at
build time. So once Preview points at the dev Supabase project (which it now
does, deliberately), promoting a preview deployment ships **dev database URLs
to production users**.

This invalidates the original Phase A step A7. A production deploy must be
*built* against the Production environment (`vercel --prod`), never promoted
from a preview build. The runbook has been corrected.

The tell is in the bundle itself: the production JS must contain
`pxdnwpqnmuzpdtjvbawa` and must not contain `ziowgeluoertdxslehbl`. That check
is now a required step in Phase A rather than an assumption.

Server-side variables (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) are read at
runtime and would resolve correctly either way — it is specifically the
`NEXT_PUBLIC_` ones that are frozen at build time. That asymmetry is what makes
this failure quiet: the server half would look fine.

## Pre-beta cleanup: 11 junk merchant rows in production (logged 2026-07-27)

Not fixed, deliberately — recorded so it happens before invitations go out.

Production `shop_settings` holds 32 rows; **21 are real merchants and 11 are
test signups** left over from Feb–May 2026. They were created by the merchant
onboarding insert (`api/merchant/onboard`), not by the GET-that-writes — that
handler produced zero rows, because its upsert only fires for a slug present in
`shops` but missing from `shop_settings`, and onboarding always writes both.

The slugs:

| slug | shop_name | customers |
|---|---|---|
| `test-coffee-shop` | Test Coffee Shop | **1** |
| `test-coffee-co` | Test Coffee Co | 0 |
| `monkeycakeboyfriend` | monkeycakeboyfriend | 0 |
| `ftyu` | ftyu | 0 |
| `fdjs-uaos` | fdjs uaos | 0 |
| `hehehe` | hehehe | **1** |
| `como` | como | 0 |
| `poppi` | poppi | 0 |
| `popo` | Popo | 0 |
| `kumalala-2` | Kumalala | 0 |
| `kumalala` | Kumalala | 0 |

**They are not visible in explore.** All 11 have `deal_title IS NULL`, and the
explore query requires `deal_title` to be non-null and non-empty — the live API
returns 21 shops and none of these. The earlier worry that non-null shop names
made them browsable does not hold: the name is not what gates the listing.

**They are reachable by direct URL.** `/customer/shop/monkeycakeboyfriend`
returns 200 today. Low exposure while nothing links to them, but they are real
rows on a public route.

Two carry a customer row, so this is **not** a blind `DELETE` — deleting a shop
with a customer attached orphans or cascades that customer. Decide per row.

**Check after Phase B:** `shops-map` keys off `places`, not `shop_settings`, and
applies no `deal_title` filter. If the places migration mints a `places` row for
these slugs, they become visible on the map — a surface where the explore filter
does not protect them.

## GPS check-in — planned, deferred until after the friends test (logged 2026-07-28)

Approved in principle 2026-07-28. **Not built.** Build after the friends test.

### Why it exists

The differentiator is the verified visit — a post that proves someone walked
in. Verified visits come from QR check-ins, which need merchants. There are no
merchants. Without a second path, the first 1,000 users get a location-tagged
photo feed, which is Instagram with fewer friends on it.

GPS check-in verifies presence by phone location instead of a merchant's QR
code. It works with **zero merchant participation**, which is the actual
constraint.

### How it works

Client sends `{place_id, lat, lng, accuracy}`. The server recomputes haversine
distance **itself** — never trusting a client-supplied distance — and accepts
within roughly 150m, widened when reported accuracy is poor and rejected
outright when accuracy exceeds the radius. It writes the same `checkins` row
the QR path writes, through the existing `writeCheckin` in `lib/places.ts`,
plus a new `checkins.method` (`'qr' | 'gps'`) and the captured accuracy.

### Why it fits cleanly

- `writeCheckin` is already the single funnel for both `shop_slug` and
  `place_id`, so a second entry point does not fork the write path.
- `getVerifiedVisitSet` keys off "a check-in row exists", so a GPS check-in
  lights the badge with no change to the feed.
- What must be added is the **tier**: carry `method` through to the badge so
  `Postmark` can render "Verified by location" vs "Verified by the business".
  That is the two-tier story for when merchants arrive.

### The reward gate — the load-bearing decision

**GPS check-ins earn the social badge and nothing else. Reward accrual stays
QR-only.** An early return before `applyReward` when `method = 'gps'`.

A shop that never signed up cannot honour a free coffee. Letting a
phone-earned reward reach a real counter manufactures a problem for a business
that never agreed to anything. And the gate is not just a safety measure — it
is the *incentive*: QR is how a merchant turns loyalty on, so gating rewards
behind it is the reason a merchant claims their place.

### Spoofing, and why it does not matter yet

Defeatable by simulated location. Cheap mitigations worth doing: server-side
distance only, one check-in per place per day (the existing
`already_checked_in` guard already does this), implausible-velocity rejection
between consecutive check-ins, and rejecting low-accuracy fixes. Not worth it
now: device attestation, anomaly detection.

Nobody spoofs GPS to farm a badge on a network with no audience. Fraud
pressure arrives when rewards are worth money — which is exactly when
merchants exist and QR is available as the stronger tier. **The spoofing risk
and the merchant availability arrive together.** That is why tiering is the
right sequence rather than a compromise.

### The real cost is data, not code

Only **5 of 32** production shops have coordinates. GPS proximity is arithmetic
against a lat/lng that does not exist yet. The feature is a slice or two; the
**OSM import is the bigger half** and determines the timeline. `PlaceSource`
already anticipates this (`"seed" | "merchant" | "osm"`).

## Two security findings for the safety slice (logged 2026-07-28)

Both found while diagnosing the preview 500. Neither is fixed.

### 1. `/api/join/checkin` performs no token validation

The endpoint accepts `{shop_slug, phone, pin?}` and **never checks the join
token**. `generateJoinToken` is only called in `/api/join/settings`, and even
there only when a `t` param happens to be present.

So anyone who knows a slug can POST a check-in for any phone number. Visits
can be manufactured, which means the verified-visit badge — the whole
differentiator — is currently unauthenticated. Rewards accrue on this path,
so at scale it is also a route to free merchandise.

Worth stating plainly: **QR is not actually enforced today.** Any comparison
of "rigorous QR" against "spoofable GPS" is measuring GPS against something
that is not shipped.

### 2. `getVerifiedVisitSet` has no time window

`src/lib/social.ts:157` returns true when a `customers` row exists for
(email, shop) **and any check-in row exists at all** — unbounded in time and
unrelated to when the post was made. One check-in in February badges a post
made in July, forever.

The badge claims "this person was here", but means "this person was here once,
at some point". Fix is a window — the check-in should be near the post's
creation time, not merely somewhere in history.

## Pre-beta: `job_applications` needs a retention policy (logged 2026-07-28)

Noted, not acted on.

Production `job_applications` holds **12 real applicants** with real PII:
names, emails, phone numbers, city, LinkedIn URLs, work-authorization and
sponsorship answers, over-18 status, and **felony disclosure text**. These are
actual people who applied to work at Ventzon. They are unrelated to shops and
survived the 2026-07-28 cleanup untouched, correctly.

Before there are real users this needs:

- **A retention period.** Right now the answer to "how long do we keep a
  rejected applicant's felony disclosure" is "forever, by default." That is
  the wrong default and it is not one anybody chose.
- **An access review.** Who can read this table, through which key, and is it
  reachable from any anon-key path.
- **A deletion path**, so an applicant can ask for their record to be removed.

Felony disclosure and work-authorization status are sensitive categories. This
is a small table, which makes it easy to fix now and awkward to explain later.

## OSM place import — scope (logged 2026-07-28, not built)

Target for the friends test: **East Village / Lower East Side, Williamsburg,
Hoboken**. NYC metro only. Philadelphia and Baltimore are explicitly later.

Live Overpass counts taken 2026-07-28 (`amenity` in cafe/restaurant/bar/
fast_food/pub/ice_cream/bakery, plus all `shop=*`):

| Neighbourhood | Places |
|---|---|
| East Village + LES | 2,265 |
| Williamsburg | 1,306 |
| Hoboken | 536 |
| *(rejected)* Park Slope | 1,569 |
| *(rejected)* Astoria | 1,315 |
| *(rejected)* Bushwick | 1,217 |
| *(rejected)* New Haven CT | 513 |
| *(rejected)* Jersey City downtown | 370 |
| *(rejected)* Stamford CT | 118 |

**~4,100 raw features**, expected to land nearer 2,500–3,000 after filtering.

### The four problems, in order of how much they hurt

**1. Name quality is the gating issue, not volume.** OSM completeness is
uneven: a corner bodega may exist as an unnamed `shop=convenience` node. Any
feature without a `name` tag must be **dropped, not synthesised** — a place
called "Convenience Store" is indistinguishable from the fabricated businesses
we just deleted from production. Rule: `name` required, no fallback.

**2. Dedupe.** Three collisions to handle:
- *Within OSM* — the same business as both a node and a building way. Collapse
  on `name` + ~50m proximity, keep the node.
- *Against existing `places`* — the import must not create a second row for a
  place a merchant already claimed. Match on `osm_id` first, then name +
  proximity, and **never overwrite a row where `claimed_by` is not null**.
- *Chains* — 14 Dunkin' branches are 14 genuine places. Dedupe must be
  proximity-scoped, never name-only.

`places.osm_id` and the partial index on it already exist for this.

**3. Category mapping.** OSM `amenity`/`shop`/`cuisine` are a long tail of
hundreds of values; the app's vocabulary is Coffee / Food / Retail / Beauty /
Fitness. Needs an explicit mapping table with a default of Retail, plus a
review of what lands in the default bucket. `amenity=cafe` → Coffee is easy;
`shop=hairdresser` → Beauty is easy; `shop=car_repair` is a judgement call
about whether it belongs in a consumer discovery app at all.

Worth deciding deliberately: **not every OSM feature should be imported.**
Petrol stations, car washes and dentists are real businesses nobody posts a
photo of. A tighter filter produces a better feed than a complete one.

**4. A place page with no photos — the state that decides the test.** Every
imported place starts unclaimed, with no posts and no photos. That is the
*majority* state at launch, not an edge case, and it is the screen a friend
will actually land on. It must not read as broken or empty. It needs: the
name, category and neighbourhood carrying the page; a map/static-map block
standing in for the hero; and a genuine invitation — "no one's posted here
yet, be the first" — as the primary action rather than a grey placeholder.
The `photos` column defaults to `'[]'` precisely so this state is normal.

### Licensing

OSM is **ODbL**. Imported rows must stay separable from user-generated content
(`source = 'osm'` already does this) and attribution is required wherever
imported data is displayed. Attribution copy is a PRE-LAUNCH item.

## GPS check-in must be optional and non-blocking (logged 2026-07-28)

Design constraint for the post-Friday GPS build. **If the check-in fails —
permission denied, location unavailable, or the user is too far away — the
post still publishes. It just publishes without the badge.**

Failure costs a badge, not a post. The check-in is an enhancement applied to a
post, never a gate in front of one.

This removes most of the risk that justified deferring the feature: a
misfiring geofence degrades to "ordinary post" rather than blocking the one
action the product needs from a new user. It also means the radius can be
tuned conservatively — a false negative is cheap.

Sequencing consequence: the post must be publishable before the location fix
resolves. Do not await geolocation in the submit path.

## Safety: the feed is global (logged 2026-07-28)

`/api/customer/feed` filters on `post_kind`, `hidden`, and a place link. **It
does not filter by author, follow graph, geography, or audience.** Any signed-in
account sees every post from every user, ordered by recency and re-ranked by
follows and proximity — proximity is a *scoring* nudge, never a filter.

This is correct and desirable at eight friends: it is what lets the network
feel alive from minute one, and it is why Luke can seed the feed from Columbus
while testers are in NYC.

It is not acceptable at social-media scale. Before any open signup, the feed
needs a real audience model — at minimum follows-plus-nearby rather than
everything, and an answer for what a brand-new account with zero follows is
allowed to see. Bundle this with the safety slice; it is the same question as
"who can see what" that blocking and reporting already touch.

## App Store Connect metadata is stale — required before EXTERNAL TestFlight (logged 2026-07-30)

Deliberately deferred: the product is changing daily and the metadata should be
updated once, accurately, immediately before submission. Recorded so it is not
discovered at submission time.

**The timing point that is easy to get wrong: external TestFlight distribution
is itself a submission and goes through Apple beta review.** This is not "before
the next App Store update" — it is before friends outside the team can install
anything. Internal TestFlight (your own devices) needs no review and is not
blocked by any of it.

The app was originally submitted as a **loyalty app**. It has since gained
posts, photos, comments, and precise location. Three things are now wrong:

- **App Privacy declaration.** Almost certainly declares email and coarse usage
  only. The app now collects **precise location** and **photo library** access.
  An inaccurate privacy declaration is a rejection reason at review and a
  removal reason after it. This is the one to fix first — it is a compliance
  problem, not a polish problem.
- **Age rating questionnaire.** It asks specifically about user-generated
  content; a loyalty app would have answered "none." With posts, photos and
  comments that answer is now false, and it typically moves the rating to 12+.
- **Description and screenshots.** If they describe stamp cards and QR
  check-ins, they no longer describe the product.

Nothing here blocks internal TestFlight, which is the fastest path to verifying
the native shell fix on a real device.

## Rule: a public bucket needs a metadata gate on EVERY upload path (logged 2026-07-30)

Photos were stripped of EXIF before upload. Videos were not. Both land in the
same **public** `posts` bucket, so iOS videos reached production carrying
`com.apple.quicktime.location.ISO6709` — GPS to roughly metre precision —
along with device make, model, software and capture time. Anyone with the URL
could fetch the file and read the coordinates. Verified on a real production
video, not inferred.

**The rule is about the BUCKET, not the file type.** It slipped through because
the guard was attached to images rather than to the destination: someone added
a video path later and there was nothing to notice it was missing. Any new
upload path into a public bucket must strip metadata before the write, and the
review question is "what bucket does this write to", not "is this a photo".

### Why the strip rewrites the container instead of re-encoding

A canvas + MediaRecorder re-encode **cannot work on iOS Safari** — WebKit does
not implement `HTMLMediaElement.captureStream()`, which is the only way to feed
a decoded video into MediaRecorder. It would have failed silently on the exact
platform the beta runs on. Where it does work it is roughly real-time, lossy,
and usually drops audio.

`src/lib/strip-video-metadata.ts` instead walks the QuickTime box tree and
overwrites `moov/meta` and `moov/udta` **in place** with `free` boxes of
identical length and zeroed payloads. In place and identical length matters:
`moov` precedes `mdat` in iOS camera output, and `stco`/`co64` reference sample
data by ABSOLUTE FILE OFFSET, so removing bytes would shift `mdat` and corrupt
playback silently. Byte length is unchanged, every offset stays valid, no frame
is touched, and it runs in milliseconds.

It **fails closed**: any parse inconsistency rejects the upload rather than
letting it through unstripped, and the output is re-parsed and re-scanned for
the forbidden keys before it is allowed to upload. A leak that only occurs on
unusual files is worse than one that always occurs, because nobody sees it.

## `.mov` will not play outside Apple platforms (logged 2026-07-30)

iOS records `video/quicktime`. Safari plays it natively, so the all-iPhone beta
group is fine. **Chrome on Android and desktop Chrome will not play it** — the
tile renders blank or errors.

This becomes a real problem the moment the group widens beyond iPhone. The fix
is transcoding to H.264/MP4, which belongs with the compression work rather
than the metadata strip: the strip deliberately does not re-encode, so it
cannot change the container.

## Storage writes go live at origin instantly; the public URL does not (logged 2026-08-01)

Found while stripping GPS from a video already in the `posts` bucket.

The overwrite succeeded and the **origin** object was clean immediately —
verified by downloading through the service-role client. The **public CDN URL
kept serving the old bytes**, coordinates included, for several minutes
afterwards. A plain re-fetch of the canonical URL still returned the leaking
file well after the write returned success.

**Consequence for moderation:** overwriting or deleting an object is not the
same as it being gone. If something has to come down fast — a report, a
takedown, a privacy incident — the object must be removed **and the cache
purged**, or a copy stays publicly fetchable for the remainder of the TTL.
Anyone with the URL still has it in that window.

Practical notes:
- A cache-busting query string (`?v=<timestamp>`) fetches the fresh object and
  is the quickest way to confirm origin state without waiting.
- Always **re-fetch the canonical public URL** to confirm a removal, never
  trust the write result. The write is not the thing users see.
- `cf-cache-status` and `last-modified` on a `HEAD` request tell you whether
  the CDN has caught up.

This is the storage analogue of the deploy lesson already recorded here: what
is true at the origin and what is being served are two different facts, and
only the second one matters to the person looking at it.

## Check-ins at imported places — schema and read path (built 2026-08-01)

`customers.shop_slug` is FK-bound to `shops.slug`, so a membership cannot
exist for a place with no merchant account — and `checkins.customer_id`
requires a membership. The verified-visit badge was therefore **structurally
unreachable at all 3,281 imported places**, i.e. at everything a beta user can
actually see. The differentiator was unreachable everywhere it mattered.

`checkins.customer_email` is the second anchor: identity when there is no
membership to point at. `customer_id` stays and stays populated for QR.

### Four things the obvious version of this migration gets wrong

1. **Adding the column is not enough.** `shop_slug` and `customer_id` were both
   `NOT NULL`, and a place check-in has neither. Both dropped — safe, because
   all eight readers filter on `shop_slug = ...` or `customer_id in (...)`,
   which a NULL never matches. Audited call site by call site *before*
   shipping. A compensating CHECK (`checkins_subject_present_check`) re-asserts
   what the NOT NULLs were carrying: every row is either a membership check-in
   or a place check-in, never a row belonging to nobody.

2. **Postgres treats NULLs as distinct in a unique index.** The moment
   `customer_id` can be NULL, both existing uniques stop constraining place
   check-ins — unlimited rows per place per day, i.e. badge-by-refresh. The
   partial unique on `(customer_email, place_id, checkin_date)` restores the
   guard, and doubles as the read index since `customer_email` leads.

3. **Union the two lanes, deduplicate on the VISIT, never count rows.** After a
   merchant claims a place, one person legitimately holds both a membership
   check-in and an older place check-in for the same visit. Deduplicating on
   `(email, place_id, checkin_date)` makes double-counting impossible by
   construction rather than by everyone downstream remembering.

4. **Identity is not presence — so no write endpoint in this slice.** A
   session-derived email proves *who*, never *where*. An authenticated route
   that writes a check-in on request would let any account badge any of 3,281
   places by POSTing an id: same forgery as trusting the request body, one step
   removed. The write path belongs with the GPS slice and its server-recomputed
   haversine. **A badge nobody can earn yet beats one anyone can forge.**

### The time window, and the trap waiting in the GPS slice

The badge now requires a check-in **within 24 hours before the post's
`created_at`**, fixing the unbounded-window finding logged 2026-07-28 rather
than duplicating it into the lane that will carry all beta traffic. A verified
visit means "you were there when you posted", not "you went once in February".

Consequence: the result is keyed by **post id**, not `email|shop_slug`. With a
window, two posts by the same author at the same place can differ, so the
answer belongs to the post.

**The window is backward-only, and that collides with the GPS design.** GPS
check-in is specified to publish the post *before* the location fix resolves,
so a check-in landing seconds AFTER its own post is the normal case there —
and it will not badge. Resolve it in that slice with an explicit forward grace
value, not by quietly widening `VISIT_WINDOW_MS`.

### What the window costs in dev

Dev seed: **43 posts badged before, 1 after.** Not a bug — the seed writes
check-ins and posts at unrelated times, so almost none coincide. But it means
the dev feed now demonstrates ~zero verified visits, which is the one thing a
visual review of the feed is supposed to show. The seed needs to emit a
check-in inside the window for posts meant to read as verified. **Production
regression is zero** — 2 posts, both untagged, no check-ins, badged before and
after: false.

### Known gap, deliberately left

Place check-ins are invisible to `creatorStats`, the leaderboard, friend
activity, merchant analytics and history — all of which filter by
`customer_id` or `shop_slug`. So a user who only ever place-checks-in shows 0
visits and earns no milestone badges. Correct for merchant-facing surfaces
(no merchant should be metered for a place they never signed up for); wrong
for the consumer profile. Fix belongs with the GPS slice, once those rows
actually exist.

## A key-shape change is invisible to the type checker (logged 2026-08-01)

`getVerifiedVisitSet` used to return a `Set` of `"email|shop_slug"` keys. The
time window made that shape wrong — with a window, two posts by the same
author at the same place can differ, so the answer belongs to the post — and
it became a `Set` of post ids.

Both call sites were updated. One of them was updated **only at the call**:
the feed still asked `verified.has(`${p.author_email}|${p.shop_slug}`)`.

Nothing caught it:

- **`tsc` cannot.** `Set<string>.has(string)` accepts any string. Both the old
  key and the new one are strings, so the type checker sees a correct program.
- **The unit-level harness could not.** It called the function directly and
  asserted on the returned Set, which was right. The bug was in a *consumer*.
- The symptom was `verified_visit: false` everywhere — indistinguishable from
  "no check-ins match", which is also what correct behaviour looks like on a
  seed with no check-ins in the window.

It surfaced on the first end-to-end request, because the post detail route
returned `true` for a post the feed returned `false` for. **Two consumers
disagreeing is the signal; a single consumer would have looked fine.**

**The rule: when a value's KEY SHAPE changes — not its type, its shape —
every consumer needs an end-to-end check through the real route. A harness
proves the function; only a request proves the wiring.** Stringly-typed keys
are the specific hazard: the compiler is structurally unable to help, so the
test has to. Where it is cheap, prefer a key the compiler can check (a branded
type, or the id itself) over a composed string.

## `npm run backup` backs up whatever `.env.local` points at (logged 2026-08-01)

Which is **dev**. Run before a production migration, it produces a dev dump,
prints a healthy-looking table of counts, and satisfies "backup first" entirely
on paper. The tell is in the output: 15 auth users and 3 reports are the seed's
numbers, and the directory is named `.backups/ziowgeluoertdxslehbl-<stamp>/`.

Production credentials are deliberately **not** in `.env.local` — line 25 says
so in as many words — so backing up production requires passing them
explicitly for that one run:

```bash
SUPABASE_URL=https://pxdnwpqnmuzpdtjvbawa.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<production service_role> \
npm run backup
```

Check the printed ref and the output directory before trusting any dump. The
absence of the key is the guard working, not an obstacle to route around — the
same reasoning as `verify:dev`.

Note also that `--verify` (the restore rehearsal) **refuses to run against
production** by design, so the rehearsal is always performed on dev.

## Production is a clean slate for check-ins (state as of 2026-08-01)

Worth recording because it makes a whole class of migration risk evaluate to
zero, and it will not stay true:

| | production | dev |
|---|---|---|
| `checkins` | **0** | 421 |
| `customers` | 0 | 67 |
| `shops` | 1 | 30 |
| `posts` | 2 (both untagged) | 200 |
| `places` | 3,602 (3,601 osm) | 3,311 (3,281 osm) |

The 3,601 imported places are **production's** number. Dev carries 3,281 —
different imports, so a count that matches one will not match the other.

Because `checkins` is empty on production, the Slice 1.9 migration cannot lose
a check-in there: it adds a column, weakens two `NOT NULL`s, and adds a CHECK
and a partial unique index against zero rows. That is a fact about today, not a
property of the migration.

## Place identity resolved by slug — the fourth instance (logged 2026-08-01)

`posts.shop_slug` is FK-bound to `shops.slug`, so a post at an imported place
carries `place_id` and **no slug at all**. Any code that resolves place
identity from `shop_slug` alone therefore renders nothing there — and because
the fallback is "show less", it fails silently rather than loudly.

Audited every consumer surface. The full picture:

**Fixed here.** `/api/customer/posts/[id]` → `/customer/post/[id]` resolved
`shop` only inside `if (post.shop_slug)`, so the page dropped its entire place
block: a "Verified visit" badge with nothing naming what was visited, on the
screen you reach by tapping any feed tile.

**Logged, not fixed.** `/api/customer/saves` rolls up "the distinct places
these saves point to" from `shop_slug` only, so a post saved at an imported
place contributes nothing and that place never appears in the Saved list.
Saves is deferred post-beta — nobody sees it yet — so it waits, but it is the
same bug and will need the same fallback.

**Not affected, checked rather than assumed:**

- `/p/[id]` and `/place/[slug]` — already query `places` by `place_id` first.
  The *shareable* surface was never broken; the in-app page was.
- Own-posts grid and creator grid select `shop_slug`, but `PostGrid` renders
  thumbnails only and never shows a place name. The selected slug is vestigial.
- `shops-map` keys off `places`.
- `notifications` is slug-keyed with an `"a store"` fallback, but nothing
  generates a notification for an imported place yet. It becomes an instance
  the day something does.
- `friend-activity`, `history`, `leaderboard`, `passport`, `explore`,
  `memberships` are membership- or shop-scoped by design.
- The feed's place name is not a link, so there is no dead navigation into
  `/customer/shop/<imported-slug>`.

### The rendering rule this settles

An unclaimed place gets **name and neighbourhood, and no reward line**. The
claimed-shop block renders progress ("3 more visits to a free coffee"); an
imported place has no reward programme, and showing progress toward a reward
nobody offers would invent one. The tap goes to `/place/[slug]`, not
`/customer/shop/[slug]` — the latter is shop-settings-driven and would be an
empty shell for a place no merchant has claimed.

**The general rule: resolve place identity by `place_id` with a `shop_slug`
fallback, never the reverse, and never the slug alone.** Three routes already
did it correctly; the two that did not both failed by omission, which is why
neither was noticed.

## The 3,602nd place, and when the production import actually ran (2026-08-01)

Asked because production read 3,602 places when 3,601 were expected. Two
answers, and the second is the larger one.

**The extra row is not new.** `monkeycakeboyfriend` — `source = 'merchant'`,
`verification_tier = 'claimed'`, no coordinates, created **2026-07-28
19:48:59** by the places backfill, which derives a place from every shop. Its
`claimed_at` is 2026-03-20, the original shop's own creation date. It is one of
the 11 junk test-merchant rows logged for pre-beta cleanup on 2026-07-27, and
it is now the **only** shop left on production: 1 shop, 0 customers,
`deal_title` null.

**This closes an open worry from that entry.** The 2026-07-27 note asked to
check after Phase B whether minting `places` rows for the junk slugs would make
them visible on the map, since `shops-map` applies no `deal_title` filter. It
does not: `shops-map` requires non-null latitude and longitude, and this row
has neither. Junk merchant rows cannot reach the map through the places
backfill. The cleanup is still worth doing, but it is not a visibility bug.

**The OSM import ran against production today**, in three batches — 3,255 rows
at 19:48, then 117 at 19:57 and 229 at 19:58. All 3,601 imported places date
from 2026-08-01, none from before. The split matches the three Columbus-suburb
areas added in the uncommitted change to `scripts/import-osm.mjs` (North
Columbus, Westerville, Polaris), whose own comment predicts ~130 each.

Worth holding onto: **the importer writes to whatever the environment points
at, and it left no trace in git.** The script change that produced those 346
rows is still uncommitted, so the production database currently contains data
produced by a version of the importer that exists only on one laptop. Committing
the importer before it is run again is the cheap fix; the ODbL attribution
question logged earlier now applies to live production data, not a plan.

## Slice 1.9 migration applied to production (2026-08-01)

Backup `.backups/pxdnwpqnmuzpdtjvbawa-2026-08-01T20-41-07-747Z` taken first,
3,602 places, production ref confirmed.

| | before | after |
|---|---|---|
| `checkins` rows | 0 | 0 |
| `checkins` columns | 7 | 8 (`customer_email`) |
| `checkins` indexes | 4 | 5 (`checkins_email_place_date_unique`) |
| `shop_slug` / `customer_id` | NOT NULL | nullable, with the CHECK |
| posts / places / customers / shops | 2 / 3602 / 0 / 1 | unchanged |

Both existing posts verified identical afterwards: rows unchanged, `/p/[id]`
and `/api/customer/posts/[id]` both 200, `verified_visit: false` as before, and
`place` **absent** from the response because production still runs the previous
build. That absence is the expand-only contract working — the schema is ahead
of the code and the deployed app neither knows nor cares.

**Drift worth knowing:** production has 4 check-in indexes where dev has 6. It
lacks `idx_checkins_shop_slug` and `idx_checkins_customer_id`, which its own
baseline migration creates. Same class as the missing `job_applications`
indexes already logged. Not urgent at 0 rows; it will matter when check-ins are
real.

## ODbL: promoted from plan-stage to live obligation (2026-08-01)

3,601 OSM places are in production in front of real users, so this is no
longer a question about a plan. **Not legal advice** — a practical read of ODbL
1.0 and the OSMF attribution guidelines. The two flagged items at the end
deserve a real opinion if imported places become the core asset.

### The licence has two separate obligations, and they bite differently

**Attribution** applies to everything. **Share-alike** applies only to the
database, and only in one of three cases:

- **Produced Work** — rendered output: a place page, the map on screen, a
  screenshot. **Attribution only. No share-alike.**
- **Collective Database** — your own data sitting *alongside* OSM's, joined but
  not merged. The independent part is **not** subject to share-alike.
- **Derivative Database** — OSM records modified or extended. Share-alike
  applies, and §4.4 is the clause that matters: publicly using a Produced Work
  *made from* a Derivative Database obliges you to offer that database under
  ODbL to recipients.

### Where that leaves Ventzon

**Posts, photos, comments, check-ins and users are safe.** They live in
separate tables keyed by `place_id` and are joined at read time — the textbook
Collective Database shape. Nothing a user creates becomes ODbL. The
content/insert split that already exists is what protects this, which makes
`source = 'osm'` and `osm_id` a **constraint to preserve, not a convenience**.

**`places` is very likely a Derivative Database.** We do not merely store OSM
rows: we add `category` (mapped from `amenity`/`shop` tags), `neighborhood`,
`city` and `slug`, and we filter and dedupe. That is extension and
modification. Publishing place pages from it therefore triggers §4.4.

**What that actually costs is almost nothing:** an export of the OSM-derived
place rows offered under ODbL, in practice a link on the legal page. It does
**not** oblige opening the app, the schema, the posts, or anything a merchant
supplies about their own business.

### Attribution — what exists today, and the gap

Present: `© OpenStreetMap © CARTO` in the map's Leaflet attribution control
(`customer/map/page.tsx`) and in `PlaceMiniMap`, which the place page renders
when a place has coordinates. All 3,601 imported rows have coordinates, so
place pages are attributed in practice.

Missing, and all of it PRE-LAUNCH:

1. **Neither credit is a link.** OSMF asks for "© OpenStreetMap contributors"
   linking to `https://www.openstreetmap.org/copyright`. Both are plain text
   and neither says "contributors".
2. **No licence is named anywhere.** Nothing in the app mentions ODbL.
3. **No legal/about entry.** Settings has no "Data & licences" line, which is
   the anchor every other surface leans on under the reasonable-prominence
   standard.
4. Surfaces that show OSM-derived names with no credit nearby: the feed, the
   post page's place row, and the place picker in compose. **Per-item credit is
   not required** — a credit on the map and place page plus a reachable legal
   page satisfies "reasonable" — but that legal page has to exist first.
5. The attribution is `#888` on both surfaces. OSMF asks that attribution not
   be obscured; worth a contrast check rather than an assumption.

The fix is roughly an hour and clears the only clearly-required item.

### Two questions that deserve a real opinion

1. **The claim flow (Slice 1.5) will let merchants correct imported place
   data.** Those corrections flow into the derivative database, so §4.4 would
   oblige publishing merchant-supplied corrections under ODbL. Decide before
   that ships, not after — it is a product question (what do we promise a
   merchant about their own edits) as much as a licence one.
2. **Keep OSM-derived fields separable, permanently.** Denormalising a place
   name onto `posts` for convenience would blur the Collective/Derivative line
   and start pulling user content toward the share-alike side. The separation is
   load-bearing.
