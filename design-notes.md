# Ventzon design pass — directions tried & rejected

Keep this updated so later passes don't recycle dead ends.

## Rejected
- **Light/cream base palette** — app is live and dark throughout; flipping the
  base would be a redesign, not a design pass. Dark stays; warmed slightly.
- **Per-shop hashed accent colors** (current app behavior) — 8 random hues make
  every screen a different color story. Replaced by one signature gold; shop
  identity carries through logos/photos instead.
- **Variant B "Counter" (dense receipt rows)** — great scanning, but thumbnails
  demote media; feed stopped feeling social. Density register lives on in
  follower lists / map sheet instead.
- **Variant C "Marquee" (full-bleed text-on-image)** — dramatic but fragile:
  light photos break legibility, captions must stay short, and gold-pill-on-
  every-card devalued the signature. Its earn-pill idea survives in the map pin.
- **Floating Visit & Earn chip detached below the caption** (A, first draft) —
  read as an ad unit. Fused into the media card as a footer instead.
- **Emoji glyph action row (♥ 💬)** — cheapened the editorial register;
  replaced with a muted "12 likes · 3 comments" text line.
- **Inter/Inter Tight for display** — current app font; default-looking. Kept
  legibility for body via Public Sans, display moved to Bricolage Grotesque.

## Removed-one-thing log
- Explore feed: removed the share arrow from the action row (share lives on
  the post page), then folded like/comment counts into one muted text line.
- Post grid: removed the gray placeholder treatment for text posts — they
  are typographic tiles now.
- Business profile: removed the white/yellow stamp split — stamps are gold
  or empty, nothing else.

## Flagged: values with no clean token mapping (do not guess)
- **Error/danger red** (shop page check-in error banner, settings delete
  row): the approved 6-color palette has no danger color. Left as Tailwind
  red-*, pending a decision on a semantic `--danger` token.
- **Map tiles**: CartoDB dark-matter basemap colors are third-party and
  can't be tokenized; the attribution text color (#333) matches the tile
  art, not our ramp.
- **Scrim gradients over photos** (featured cards): rgba black overlays are
  photo-legibility scrims, not palette colors — kept as rgba.
