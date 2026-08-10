import type { Model3DDescriptor } from "@/lib/types";

/**
 * 🎨 Real 3D model wiring for the Avatar Studio.
 *
 * The procedural chibi in components/3d/AvatarCanvas3D.tsx is a stand-in
 * built from primitives; it cannot reach sculpted-character quality no
 * matter how much geometry is added. This file is the bridge to real
 * assets: drop a .glb into /public/models and name it here (or set
 * `model3d.glbUrl` on the ShopItem row) and the engine loads it instead.
 *
 * See public/models/README.md for the full drop-in guide.
 */

/** Every model is normalized to this height (world units) on load, so an
 *  asset authored in cm, m, or "whatever Blender had" all frame identically
 *  and share one camera. Matches the procedural doll's height so equipped
 *  item sizes carry over unchanged. */
export const TARGET_HEIGHT = 1.9;

export type SlotKey = "head" | "face" | "body" | "hand";

/**
 * 🦴 Bone/node names to look for, in priority order, when attaching items.
 * Covers the common rig conventions: plain glTF, Mixamo (`mixamorig*`),
 * VRM/VRoid (`J_Bip_*`), Blender Rigify, and Ready Player Me. The first
 * match wins; if none match (an unrigged/static mesh) the engine falls back
 * to bounding-box-derived anchors so items still land sensibly.
 */
export const BONE_CANDIDATES: Record<SlotKey, string[]> = {
  head: [
    "Head",
    "head",
    "mixamorigHead",
    "J_Bip_C_Head",
    "Bip01_Head",
    "DEF-spine006",
    "HeadTop_End",
  ],
  // Eyewear rides the head too — there is rarely a dedicated "face" bone,
  // and a per-model offset (see SLOT_ADJUST) positions it on the eye line.
  face: ["Head", "head", "mixamorigHead", "J_Bip_C_Head", "Bip01_Head"],
  body: [
    "Spine2",
    "Chest",
    "chest",
    "mixamorigSpine2",
    "J_Bip_C_UpperChest",
    "J_Bip_C_Chest",
    "Spine",
    "spine",
    "mixamorigSpine",
  ],
  hand: [
    "RightHand",
    "Right_Hand",
    "hand.R",
    "mixamorigRightHand",
    "J_Bip_R_Hand",
    "Bip01_R_Hand",
  ],
};

export interface SlotAdjust {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

/**
 * 🔧 Per-model fine-tuning, applied on top of the bone transform.
 *
 * Rigs differ: some head bones sit at the neck rather than the skull centre,
 * and bone axes are not consistently oriented between exporters. Rather than
 * pretend one set of offsets fits every asset, this is the documented place
 * to nudge a specific model once we can actually see it rendered. Keyed by
 * ShopItem slug. Anything omitted uses the bone transform unmodified.
 */
export const SLOT_ADJUST: Record<string, Partial<Record<SlotKey, SlotAdjust>>> = {
  // "default-barista-girl": {
  //   head: { position: [0, 0.12, 0] },
  //   face: { position: [0, 0.02, 0.11] },
  // },
};

/**
 * 📁 Convention map: ShopItem slug → file under /public.
 *
 * Add a line here after dropping the file in. Kept in code (rather than
 * requiring a DB migration for every asset) so swapping a model is a
 * one-line change. A `model3d.glbUrl` value in the database takes priority
 * over this map, so either route works.
 */
export const CHARACTER_MODEL_FILES: Record<string, string> = {
  // "default-barista-girl": "/models/characters/barista-girl.glb",
  // "default-barista-boy": "/models/characters/barista-boy.glb",
};

/** Same idea for equipped items (hats, glasses, outfits, handhelds). */
export const ITEM_MODEL_FILES: Record<string, string> = {
  // "golden-crown": "/models/items/golden-crown.glb",
};

/** Resolves which model file (if any) to load for a shop entry. DB value
 *  wins so a model can be swapped without a deploy; the code map is the
 *  convenient default. Returns null → render the procedural stand-in. */
export function resolveModelUrl(
  descriptor: Model3DDescriptor | null | undefined,
  slug: string | undefined,
  kind: "character" | "item"
): string | null {
  if (descriptor?.glbUrl) return descriptor.glbUrl;
  if (!slug) return null;
  const map = kind === "character" ? CHARACTER_MODEL_FILES : ITEM_MODEL_FILES;
  return map[slug] ?? null;
}
