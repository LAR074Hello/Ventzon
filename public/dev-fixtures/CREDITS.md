# Dev-fixture photo provenance

These images are seeded feed/post media on the dev server (`/dev-fixtures/*.jpg`).
They also appear inside the marketing-site app screenshots, so the source of
each file is recorded here for licensing review.

All photos were sourced from **Unsplash** and are covered by the
[Unsplash License](https://unsplash.com/license) — free for commercial and
non-commercial use, no permission or attribution required. Each was **verified
NOT Unsplash+**: the `plus` flag is `false` in the Unsplash search API response
and the bytes were downloaded from `images.unsplash.com` (Unsplash+ assets live
on `plus.unsplash.com` and the free CDN refuses them).

Files were downloaded via Unsplash's image CDN with an explicit 4:5 crop
(`?w=1100&h=1375&fit=crop`), so they are self-hosted derivatives of the listed
originals.

| Fixture | Unsplash photo | Photographer | Subject (original alt text) |
|---|---|---|---|
| `grid-1.jpg` | [j4T5z94b8ns](https://unsplash.com/photos/j4T5z94b8ns) (`photo-1784798228092-659924b1a15b`) | Mirko Meister ([@stillsbymirko](https://unsplash.com/@stillsbymirko)) | Empty gym with power rack, barbells, and weights. |
| `grid-2.jpg` | [gbXxRgv-jFQ](https://unsplash.com/photos/gbXxRgv-jFQ) (`photo-1781972542254-e60cd45a88cc`) | Phil Hearing ([@philhearing](https://unsplash.com/@philhearing)) | Sandwiches with meat and cheese in a glass display case. |
| `grid-3.jpg` | [pVY9k8pzTzM](https://unsplash.com/photos/pVY9k8pzTzM) (`photo-1643944471768-2d2eac3afb6d`) | Peace Creative ([@peacecreativestudio](https://unsplash.com/@peacecreativestudio)) | A display case filled with lots of different types of pastries. |
| `grid-4.jpg` | [iW79tgCbiMs](https://unsplash.com/photos/iW79tgCbiMs) (`photo-1778828494354-9b717d36dc99`) | Salman Sidheek ([@salman_sidheek](https://unsplash.com/@salman_sidheek)) | Dark gym interior with exercise equipment and weight machines. |
| `grid-5.jpg` | [2zimLZ7aDOM](https://unsplash.com/photos/2zimLZ7aDOM) (`photo-1612325508365-22caba7bb69e`) | zero take ([@zerotake](https://unsplash.com/@zerotake)) | Brown wooden shelf with bottles. |
| `feed-cafe.jpg` | [UPTYzwX3QME](https://unsplash.com/photos/UPTYzwX3QME) (`photo-1645677020082-721a854c24f2`) | Roman Denisenko ([@romandempire](https://unsplash.com/@romandempire)) | A coffee shop with a coffee machine and lights. |
| `feed-bakery.jpg` | [gKWvWZVRwZQ](https://unsplash.com/photos/gKWvWZVRwZQ) (`photo-1705972018470-a89eda1c6ce4`) | Sitraka ([@srakotoarivelo7](https://unsplash.com/@srakotoarivelo7)) | A bakery filled with lots of different types of pastries. |

Sourced 2026-08-12. Photographer names/usernames and alt text are taken from the
Unsplash search API response for each photo; the CDN `photo-*` id is the stable
key on `images.unsplash.com`.
