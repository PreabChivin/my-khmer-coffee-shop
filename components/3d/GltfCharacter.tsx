"use client";

import { Fragment, useMemo } from "react";
import * as THREE from "three";
import { createPortal } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";
import {
  BONE_CANDIDATES,
  SLOT_ADJUST,
  TARGET_HEIGHT,
  type SlotAdjust,
  type SlotKey,
} from "@/lib/avatarModels";

export interface GltfCharacterProps {
  url: string;
  /** ShopItem slug — keys per-model tuning in SLOT_ADJUST. */
  slug?: string;
  slots: Record<SlotKey, React.ReactNode>;
}

/** Accumulated uniform scale from `node` up to (and including) `root`.
 *  Computed from the graph rather than read back via getWorldScale so it
 *  needs no effect, no state, and no rendered frame — matrices may not be
 *  updated yet on first render. */
function accumulatedScale(node: THREE.Object3D, root: THREE.Object3D): number {
  let s = 1;
  let cur: THREE.Object3D | null = node;
  while (cur) {
    s *= (cur.scale.x + cur.scale.y + cur.scale.z) / 3;
    if (cur === root) break;
    cur = cur.parent;
  }
  return s || 1;
}

/**
 * 🎨 Renders a real sculpted GLB/GLTF character and attaches equipped items
 * to its actual skeleton.
 *
 * Three things make an arbitrary downloaded asset usable here:
 *
 * 1. **Normalization.** A downloaded model has unknown authored scale,
 *    origin, and centring. Its bounding box is measured at load and it's
 *    rescaled to TARGET_HEIGHT with feet on y=0, centred on x/z — so any
 *    asset frames correctly under the existing camera. (This is the one
 *    place runtime bounding-box measurement genuinely earns its keep; for
 *    our own primitives the sizes are authored, so measuring would only
 *    re-derive known values.)
 * 2. **Bone attachment.** Items are portaled INTO the matching bone
 *    (see BONE_CANDIDATES), so they inherit its transform — real node
 *    attachment, not coordinates guessed in character space. Their local
 *    scale is compensated for the rig's accumulated scale so an item keeps
 *    the size it was authored at regardless of how the model was built.
 * 3. **Graceful degradation.** An unrigged/static mesh with no recognizable
 *    bones still gets sensible anchors derived from its bounding box.
 */
export default function GltfCharacter({ url, slug, slots }: GltfCharacterProps) {
  // `useDraco: false` on purpose — drei defaults to fetching a Draco decoder
  // from a Google CDN, which is a runtime network dependency this app avoids
  // (Capacitor/Android + mobile networks). Ship models uncompressed, or see
  // public/models/README.md for self-hosting the decoder.
  const { scene } = useGLTF(url, false);

  // Clone so the shop preview and the inspection modal can both mount the
  // same model — a three Object3D has exactly one parent, so sharing the
  // cached scene would let whichever mounts last steal it from the other.
  const model = useMemo(() => SkeletonUtils.clone(scene) as THREE.Object3D, [scene]);

  const { fit, bones, fallbackAnchors } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const s = size.y > 0.0001 ? TARGET_HEIGHT / size.y : 1;
    const fit = {
      scale: s,
      position: [-center.x * s, -box.min.y * s, -center.z * s] as [number, number, number],
    };

    const bones: Partial<Record<SlotKey, THREE.Object3D>> = {};
    (Object.keys(BONE_CANDIDATES) as SlotKey[]).forEach((slot) => {
      for (const name of BONE_CANDIDATES[slot]) {
        const found = model.getObjectByName(name);
        if (found) {
          bones[slot] = found;
          break;
        }
      }
    });

    // Used only when a model has no recognizable rig — proportional
    // positions along the normalized bounding box.
    const depth = size.z * s;
    const width = size.x * s;
    const fallbackAnchors: Record<SlotKey, [number, number, number]> = {
      head: [0, TARGET_HEIGHT * 0.95, 0],
      face: [0, TARGET_HEIGHT * 0.84, depth * 0.42],
      body: [0, TARGET_HEIGHT * 0.55, depth * 0.34],
      hand: [width * 0.44, TARGET_HEIGHT * 0.42, depth * 0.2],
    };

    return { fit, bones, fallbackAnchors };
  }, [model]);

  const adjust = (slug && SLOT_ADJUST[slug]) || {};

  return (
    <group>
      <group scale={fit.scale} position={fit.position}>
        <primitive object={model} />
      </group>

      {(Object.keys(fallbackAnchors) as SlotKey[]).map((slot) => {
        const content = slots[slot];
        if (!content) return null;

        const tweak: SlotAdjust = adjust[slot] ?? {};
        const bone = bones[slot];

        // 🦴 Rigged: portal into the real bone so the item inherits its
        // transform. Counter-scale so the item keeps its authored size.
        if (bone) {
          const comp = 1 / (fit.scale * accumulatedScale(bone, model));
          return (
            <Fragment key={slot}>
              {createPortal(
                <group
                  scale={comp * (tweak.scale ?? 1)}
                  position={tweak.position}
                  rotation={tweak.rotation}
                >
                  {content}
                </group>,
                bone
              )}
            </Fragment>
          );
        }

        // 📦 Unrigged: bounding-box anchor in normalized space.
        const base = fallbackAnchors[slot];
        const p = tweak.position;
        return (
          <group
            key={slot}
            position={p ? [base[0] + p[0], base[1] + p[1], base[2] + p[2]] : base}
            rotation={tweak.rotation}
            scale={tweak.scale ?? 1}
          >
            {content}
          </group>
        );
      })}
    </group>
  );
}
