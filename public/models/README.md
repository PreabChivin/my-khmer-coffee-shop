# 3D Model Drop-In Guide (Avatar Studio)

The Avatar Studio renders a procedural chibi doll by default. To replace it
with a real sculpted character (the "3D doll" look), drop a `.glb` file in
here and register it — no code changes to the engine needed.

## Where to get models

- **Sketchfab** (sketchfab.com) — filter by *Downloadable* + license
  (CC0/CC-BY). Search "chibi girl", "chibi character", "cute barista".
- **VRoid Hub / VRoid Studio** (vroid.com) — free anime-style character
  maker; export as VRM, then convert VRM → GLB (VRM *is* glTF, most tools
  open it directly; the loader here reads its `J_Bip_*` bones).
- **Ready Player Me** (readyplayer.me) — free stylized avatars, direct
  `.glb` download, standard bone names.
- **Mixamo** (mixamo.com) — free characters (FBX → convert to GLB with
  Blender: File → Import FBX, File → Export glTF 2.0).
- **CGTrader / TurboSquid** — paid, highest quality. Buy in `.glb`/`.gltf`
  format, or convert in Blender.

**License note:** only use models whose license allows commercial use, and
keep a copy of the license text alongside the file.

## How to install a character

1. Put the file at e.g. `public/models/characters/barista-girl.glb`.
2. Register it in `lib/avatarModels.ts`:

   ```ts
   export const CHARACTER_MODEL_FILES: Record<string, string> = {
     "default-barista-girl": "/models/characters/barista-girl.glb",
   };
   ```

   (The key is the ShopItem `slug` — see the seeded catalog in
   `prisma/seed.ts`. Alternatively set `model3d.glbUrl` on the ShopItem row
   in the database; the DB value wins over this map.)

3. Done. The engine automatically:
   - rescales the model to standard height with feet on the ground,
     whatever units it was authored in;
   - finds its head/chest/right-hand bones (Mixamo, VRM/VRoid, Rigify and
     plain-glTF naming all recognized) and attaches equipped hats, glasses,
     outfits and cups to the real bones;
   - falls back to bounding-box anchors if the mesh has no rig;
   - falls back to the procedural doll (with a console error) if the file
     is missing or corrupt — a bad model never blanks the avatar.

4. If an item sits slightly off (rigs differ), nudge it once in
   `SLOT_ADJUST` in `lib/avatarModels.ts` — per-model, per-slot
   position/rotation/scale tweaks, documented there.

## How to install an item (hat/glasses/outfit/handheld)

Same idea: put the file under `public/models/items/` and register the slug
in `ITEM_MODEL_FILES`. Items are auto-scaled to fit the slot.

## Practical limits

- Keep characters under ~5 MB (this ships in the Capacitor Android APK and
  over Cambodian mobile networks). In Blender: decimate heavy meshes,
  resize textures to ≤1024px.
- **Do not use Draco-compressed GLBs** — the decoder would be fetched from
  a Google CDN at runtime, which this app deliberately avoids. Export
  uncompressed (glTF 2.0 default).
- One canvas is mounted at a time, so one loaded character is the steady
  state; `useGLTF` caches by URL so re-mounts don't re-download.
