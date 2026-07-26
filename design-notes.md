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
