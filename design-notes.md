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
