# 2D Avatar Art Drop-In Guide

The Avatar Shop renders `components/avatar/AvatarPortrait.tsx` — a base
character portrait with equipped items stacked on top. Right now every
`ShopItem` has `imageUrl = null`, so it falls back to a big centered emoji
(base character) or a small emoji badge (equipped items). Drop in real art
and it upgrades automatically — no component changes needed.

## What to source

A **2D character customization asset pack** — the same format Bitmoji,
Habbo, and most mobile "avatar maker" apps use: one base character portrait
plus a set of same-canvas item layers (hats, glasses, outfits, hand items),
each a transparent-background PNG pre-aligned to the same character pose.

Where to get one:

- **Freepik / PNGTree / Vecteezy** — search "avatar creator character pack"
  or "chibi character customization pack". These sites sell exactly this
  format (the reference image you shared came from PNGTree, which also
  sells layered packs, not just single renders).
- **itch.io** — search "character creator asset pack" or "avatar maker
  assets"; many free and cheap options, often already split into layers.
- **Kenney.nl** — free, simpler/flatter style, good starting point.
- **Commission** (Fiverr/ArtStation) — cheapest way to get an EXACT match
  to a specific reference image; ask for "a base pose plus N clothing/hat/
  accessory layers, transparent PNG, all aligned to the same canvas."

**License note:** confirm the license allows commercial use before using
any pack; keep a copy of the license text alongside the files.

## How to install

1. Save images under this folder, e.g.:
   ```
   public/images/avatars/characters/barista-girl.png
   public/images/avatars/items/golden-crown.png
   ```
2. Set the `imageUrl` on the matching `ShopItem` row (by `slug`) to that
   path, e.g. `/images/avatars/characters/barista-girl.png`. Either edit
   `prisma/seed.ts`'s `SHOP_ITEMS` (for a fresh seed) or update the live
   row directly — there's no code change needed, `AvatarPortrait` picks
   up any non-null `imageUrl` immediately.
3. Done, if the pack is pre-aligned (the normal case — see above). Every
   equipped item with an `imageUrl` renders full-bleed over the base
   portrait automatically, in the same position the artist drew it.

## If a layer isn't aligned to the same canvas

Some packs sell items as standalone stickers rather than same-canvas
layers. For those, set `imageOffset` on the `ShopItem` row:

```json
{ "xPercent": 0, "yPercent": -12, "scalePercent": 85 }
```

`xPercent`/`yPercent` nudge the layer (positive = right/down), and
`scalePercent` resizes it (100 = unchanged). Tune by eye once you can see
the actual mismatch — there's no way to get this right blind, the same way
the 3D system's `SLOT_ADJUST` needed a real render to tune against.

## Practical limits

- Keep images reasonably small (a few hundred KB each) — this ships in the
  Capacitor Android APK and over Cambodian mobile networks. Resize to
  roughly 800-1200px on the long edge; that's plenty for a shop-preview-
  sized portrait.
- PNG with transparency for item layers; the base character portrait can
  be PNG or JPEG (no transparency needed if it's the bottom layer).
