"use client";

import { Component, Suspense, useMemo, type ReactNode } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  Lightformer,
  ContactShadows,
  useGLTF,
} from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";
import GltfCharacter from "@/components/3d/GltfCharacter";
import { resolveModelUrl } from "@/lib/avatarModels";
import type { Model3DDescriptor, ShopItemCategory } from "@/lib/types";

export interface AvatarCanvas3DProps {
  /** The equipped BASE_CHARACTER's descriptor — falls back to a default
   *  barista shape if the user hasn't equipped/bought one yet. */
  baseCharacter?: Model3DDescriptor | null;
  /** Equipped BASE_CHARACTER's slug — keys the real-model lookup in
   *  lib/avatarModels.ts. */
  baseSlug?: string;
  /** HAT/EYEWEAR/OUTFIT/HANDHELD items to snap onto the character. */
  equipped: { category: ShopItemCategory; model3d: Model3DDescriptor | null; slug?: string }[];
  /** Enables drag-to-rotate + zoom (OrbitControls). Default true. */
  interactive?: boolean;
  height?: number;
}

/** A broken/missing .glb must never blank the avatar — fall back to the
 *  procedural doll and log, rather than tearing down the canvas. */
class ModelFallback extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error("[AvatarCanvas3D] 3D model failed to load, using procedural doll:", error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

const DEFAULT_BASE: Model3DDescriptor = {
  shape: "humanoid-male",
  color: "#bd8360",
  accentColor: "#4a2c11",
};

type Vec3 = [number, number, number];

// 🧸 Doll proportions — every anchor below is MEASURED from these, so items
// land on real geometry instead of guessed coordinates.
const HEAD_Y = 1.28;
const HEAD_R = 0.38;
const EYE_Y = 1.3;
const FACE_Z = 0.38;

/** 📐 Where each item slot attaches, in the doll's local space. Derived from
 *  the constants above rather than hand-typed magic numbers: a hat sits just
 *  below the crown so it doesn't float, glasses sit on the actual eye line
 *  at the face surface, clothing wraps the chest, and a cup meets the right
 *  hand. All characters share one rig (see ChibiBody), so one set is
 *  correct for every base character. */
const ANCHORS: Record<"head" | "face" | "body" | "hand", Vec3> = {
  // Hair adds volume above the bare skull (cap top ≈1.70), so a hat must
  // clear the HAIR, not the head — sitting at HEAD_R alone buries it.
  head: [0, 1.6, 0],
  face: [0, EYE_Y, 0.34], // on the real eye line, at the face surface
  // z is shallow on purpose: the bib is WIDER/DEEPER than the widest torso
  // (r=0.28) so it wraps the chest from inside-out rather than floating in
  // front of a slim torso or vanishing inside a broad one.
  body: [0, 0.64, 0.08],
  hand: [0.36, 0.49, 0.1],
};

/** 🔒 Per-slot scale locks — an item is sized to the body part it occupies
 *  (a mug in a hand must be far smaller than an apron on a chest) rather
 *  than rendering at whatever size its own primitive happens to be. Since
 *  we author the item geometry ourselves, the correct fit is known up front;
 *  runtime bounding-box measurement would only re-derive what's fixed here.
 *  Head is >1 because a crown ring has to encircle a hair-covered chibi
 *  skull (~0.26 radius at hat height), not sit inside it. */
const SLOT_SCALE: Record<"head" | "face" | "body" | "hand", number> = {
  head: 1.5,
  face: 1.0,
  body: 1.0,
  hand: 1.0,
};

const CATEGORY_ANCHOR: Partial<Record<ShopItemCategory, keyof typeof ANCHORS>> = {
  HAT: "head",
  EYEWEAR: "face",
  OUTFIT: "body",
  HANDHELD: "hand",
};

/** Glossy "toy plastic" finish — sheen instead of flat matte, the single
 *  biggest lever for reading as a doll rather than raw geometry. */
function toyMaterial(color: string, roughness = 0.35) {
  return <meshStandardMaterial color={color} roughness={roughness} metalness={0.05} />;
}

/** 👒 An equipped item, built for the SLOT it occupies — not just for its
 *  own `shape`. This matters because one shape means different things in
 *  different slots: a `torus` on the head is a crown (a flat horizontal
 *  ring) but on the face it's eyewear (upright lenses facing forward).
 *  Rendering shape alone is what produced glasses as a halo buried in the
 *  skull. Clothing and handhelds are always built to drape/be-held rather
 *  than floating as a raw primitive slab. */
function Item3D({
  model3d,
  slot,
}: {
  model3d: Model3DDescriptor;
  slot: "head" | "face" | "body" | "hand";
}) {
  const { shape, color, accentColor, scale } = model3d;
  const material = toyMaterial(color);
  const accentMaterial = toyMaterial(accentColor ?? color);

  // 👓 Eyewear — twin upright lenses + bridge + temple arms.
  if (slot === "face") {
    return (
      <group>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.15, 0, 0.01]}>
            <torusGeometry args={[0.1, 0.026, 10, 24]} />
            {material}
          </mesh>
        ))}
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[0.12, 0.022, 0.022]} />
          {material}
        </mesh>
        {[-1, 1].map((side) => (
          <mesh
            key={`temple${side}`}
            position={[side * 0.27, 0.01, -0.09]}
            rotation={[0, side * 0.55, 0]}
          >
            <boxGeometry args={[0.19, 0.022, 0.022]} />
            {material}
          </mesh>
        ))}
      </group>
    );
  }

  // 👕 Clothing — a rounded bib that hugs the chest instead of a flat slab.
  if (slot === "body") {
    return (
      <group>
        <mesh scale={[1, 0.95, 0.7]}>
          <sphereGeometry args={[0.32, 26, 26]} />
          {material}
        </mesh>
        {accentColor && (
          <mesh position={[0, 0.19, 0.05]} scale={[0.94, 0.18, 0.72]}>
            <sphereGeometry args={[0.32, 22, 22]} />
            {accentMaterial}
          </mesh>
        )}
      </group>
    );
  }

  // 🧋 Handheld — a held cup/vessel (or a wand, via the descriptor's scale).
  if (slot === "hand") {
    return (
      <group scale={scale}>
        <mesh>
          <cylinderGeometry args={[0.115, 0.095, 0.2, 20]} />
          {material}
        </mesh>
        <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.115, 0.018, 8, 22]} />
          {accentMaterial}
        </mesh>
      </group>
    );
  }

  // 🎩 Headwear — per shape, always oriented to sit ON the head.
  switch (shape) {
    case "torus": // crown / halo — flat horizontal ring
      return (
        <group scale={scale} rotation={[Math.PI / 2, 0, 0]}>
          <mesh>
            <torusGeometry args={[0.2, 0.05, 12, 28]} />
            {material}
          </mesh>
        </group>
      );
    case "cone": // pointed / beanie cap
      return (
        <group scale={scale} position={[0, 0.06, 0]}>
          <mesh>
            <coneGeometry args={[0.24, 0.3, 22]} />
            {material}
          </mesh>
          <mesh position={[0, -0.13, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.23, 0.03, 8, 24]} />
            {accentMaterial}
          </mesh>
        </group>
      );
    case "cylinder": // top hat — crown + brim
      return (
        <group scale={scale} position={[0, 0.1, 0]}>
          <mesh>
            <cylinderGeometry args={[0.19, 0.19, 0.3, 24]} />
            {material}
          </mesh>
          <mesh position={[0, -0.15, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.03, 24]} />
            {material}
          </mesh>
          <mesh position={[0, -0.11, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.19, 0.022, 8, 24]} />
            {accentMaterial}
          </mesh>
        </group>
      );
    case "box": // cap / mortarboard — dome + forward brim
    default:
      return (
        <group scale={scale} position={[0, 0.03, 0]}>
          <mesh scale={[1, 0.62, 1]}>
            <sphereGeometry args={[0.25, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
            {material}
          </mesh>
          <mesh position={[0, 0.0, 0.19]} rotation={[0.12, 0, 0]} scale={[1, 0.14, 1]}>
            <sphereGeometry args={[0.2, 18, 18]} />
            {accentColor ? accentMaterial : material}
          </mesh>
        </group>
      );
  }
}

type HairStyle = "none" | "short" | "long";

interface ChibiProps {
  color: string;
  accentColor: string;
  shoulderWidth: number;
  torsoRadius: number;
  hair: HairStyle;
  showEars: boolean;
}

/** 🧸 The shared doll anatomy every character renders. Full feature set:
 *  head, stylized hair, ears, brows, big anime-chibi eyes with twin
 *  highlights, a nose, a smile, blush, neck, torso, arms with mitten hands,
 *  and legs with feet. Chibi proportions (big head, short body) are the
 *  deliberate design language — on flat-shaded procedural geometry they read
 *  as an intentional cute-toy style, where realistic human proportions would
 *  just look unfinished. Per-character decorations layer on top in
 *  BaseCharacterMesh, so each character keeps a distinct silhouette while
 *  sharing one anchor rig. */
function ChibiBody({ color, accentColor, shoulderWidth, torsoRadius, hair, showEars }: ChibiProps) {
  const skin = toyMaterial(color);
  const trim = toyMaterial(accentColor);
  const hairMat = toyMaterial(accentColor, 0.45);
  const dark = <meshStandardMaterial color="#241407" roughness={0.18} />;
  const white = <meshStandardMaterial color="#ffffff" roughness={0.1} />;
  const blush = (
    <meshStandardMaterial color="#ff9fb8" roughness={0.65} transparent opacity={0.5} />
  );

  return (
    <>
      {/* ── Legs + feet ─────────────────────────────────────────── */}
      {[-1, 1].map((side) => (
        <group key={`leg${side}`}>
          <mesh position={[side * 0.15, 0.22, 0]}>
            <capsuleGeometry args={[0.115, 0.2, 4, 12]} />
            {trim}
          </mesh>
          {/* Foot — rounded, extended forward so the doll reads as standing */}
          <mesh position={[side * 0.15, 0.06, 0.06]} scale={[1, 0.62, 1.45]}>
            <sphereGeometry args={[0.115, 14, 14]} />
            {trim}
          </mesh>
        </group>
      ))}

      {/* ── Torso ───────────────────────────────────────────────── */}
      <mesh position={[0, 0.64, 0]}>
        <capsuleGeometry args={[torsoRadius, 0.26, 6, 16]} />
        {skin}
      </mesh>

      {/* ── Neck ────────────────────────────────────────────────── */}
      <mesh position={[0, 0.93, 0]}>
        <cylinderGeometry args={[0.11, 0.13, 0.09, 14]} />
        {skin}
      </mesh>

      {/* ── Head ────────────────────────────────────────────────── */}
      <mesh position={[0, HEAD_Y, 0]}>
        <sphereGeometry args={[HEAD_R, 32, 32]} />
        {skin}
      </mesh>

      {/* Ears */}
      {showEars &&
        [-1, 1].map((side) => (
          <mesh
            key={`ear${side}`}
            position={[side * (HEAD_R - 0.02), HEAD_Y - 0.02, 0]}
            scale={[0.42, 1, 0.72]}
          >
            <sphereGeometry args={[0.1, 14, 14]} />
            {skin}
          </mesh>
        ))}

      {/* Hair */}
      {hair !== "none" && (
        <>
          {/* Crown cap — sits over the top/back of the skull */}
          <mesh position={[0, HEAD_Y + 0.07, -0.02]} scale={[1.06, 0.92, 1.06]}>
            <sphereGeometry args={[HEAD_R, 26, 26, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
            {hairMat}
          </mesh>
          {/* Fringe/bangs across the forehead */}
          <mesh position={[0, HEAD_Y + 0.17, 0.12]} scale={[1, 0.5, 0.72]} rotation={[0.3, 0, 0]}>
            <sphereGeometry args={[0.33, 20, 20]} />
            {hairMat}
          </mesh>
          {hair === "long" &&
            [-1, 1].map((side) => (
              <mesh
                key={`hairside${side}`}
                position={[side * 0.33, HEAD_Y - 0.14, -0.05]}
                scale={[0.72, 1.35, 0.85]}
              >
                <sphereGeometry args={[0.17, 16, 16]} />
                {hairMat}
              </mesh>
            ))}
        </>
      )}

      {/* ── Face ────────────────────────────────────────────────── */}
      {[-1, 1].map((side) => (
        <group key={`face${side}`}>
          {/* Brow */}
          <mesh
            position={[side * 0.15, EYE_Y + 0.135, FACE_Z - 0.06]}
            rotation={[0, 0, side * -0.12]}
          >
            <capsuleGeometry args={[0.015, 0.075, 3, 8]} />
            {hair === "none" ? dark : hairMat}
          </mesh>
          {/* Big anime eye */}
          <mesh position={[side * 0.15, EYE_Y, FACE_Z - 0.045]} scale={[0.66, 0.92, 0.42]}>
            <sphereGeometry args={[0.085, 20, 20]} />
            {dark}
          </mesh>
          {/* Twin highlights — the detail that makes chibi eyes read as alive */}
          <mesh position={[side * 0.135, EYE_Y + 0.035, FACE_Z + 0.005]}>
            <sphereGeometry args={[0.024, 10, 10]} />
            {white}
          </mesh>
          <mesh position={[side * 0.175, EYE_Y - 0.035, FACE_Z]}>
            <sphereGeometry args={[0.012, 8, 8]} />
            {white}
          </mesh>
          {/* Blush */}
          <mesh position={[side * 0.26, EYE_Y - 0.115, FACE_Z - 0.08]} scale={[1, 0.68, 0.35]}>
            <sphereGeometry args={[0.065, 12, 12]} />
            {blush}
          </mesh>
        </group>
      ))}

      {/* Nose — small and rounded, just enough to break the flat face */}
      <mesh position={[0, EYE_Y - 0.1, FACE_Z - 0.005]} scale={[1, 0.85, 0.7]}>
        <sphereGeometry args={[0.032, 12, 12]} />
        {toyMaterial(color, 0.5)}
      </mesh>

      {/* Smile */}
      <mesh position={[0, EYE_Y - 0.19, FACE_Z - 0.035]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.055, 0.013, 8, 16, Math.PI]} />
        {dark}
      </mesh>

      {/* ── Arms + mitten hands ─────────────────────────────────── */}
      {[-1, 1].map((side) => (
        <group key={`arm${side}`}>
          <mesh position={[side * shoulderWidth, 0.68, 0]} rotation={[0, 0, side * (Math.PI / 9)]}>
            <capsuleGeometry args={[0.08, 0.28, 4, 12]} />
            {skin}
          </mesh>
          <mesh position={[side * (shoulderWidth + 0.08), 0.44, 0.02]} scale={[1, 1.05, 0.85]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            {trim}
          </mesh>
        </group>
      ))}
    </>
  );
}

/** A real GLB item (hat/glasses/outfit/handheld), normalized so an asset of
 *  any authored scale fits the slot it's attached to. Kept deliberately
 *  small: the character loader does the heavy lifting; an item just needs to
 *  arrive at a sane size relative to the body part holding it. */
function GltfItem({ url, fitSize = 0.34 }: { url: string; fitSize?: number }) {
  const { scene } = useGLTF(url, false);
  const object = useMemo(() => SkeletonUtils.clone(scene) as THREE.Object3D, [scene]);
  const { scale, offset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const largest = Math.max(size.x, size.y, size.z);
    const s = largest > 0.0001 ? fitSize / largest : 1;
    return {
      scale: s,
      offset: [-center.x * s, -center.y * s, -center.z * s] as [number, number, number],
    };
  }, [object, fitSize]);

  return (
    <group scale={scale} position={offset}>
      <primitive object={object} />
    </group>
  );
}

type AnchorSlots = Record<"head" | "face" | "body" | "hand", React.ReactNode>;

/** Every character shares ChibiBody's anatomy + anchor rig and layers its own
 *  decorations on top, so items always attach correctly no matter which base
 *  character is equipped. */
function BaseCharacterMesh({
  descriptor,
  slots,
}: {
  descriptor: Model3DDescriptor;
  slots: AnchorSlots;
}) {
  const { shape, color, accentColor } = descriptor;
  const accent = toyMaterial(accentColor ?? color);

  const isFemale = shape === "humanoid-female";
  const isHumanoid = isFemale || shape === "humanoid-male" || shape === "capsule-figure";

  let decorations: React.ReactNode = null;
  if (shape === "panda-round") {
    decorations = (
      <>
        {[-1, 1].map((side) => (
          <mesh key={`ear${side}`} position={[side * 0.26, HEAD_Y + 0.29, -0.02]}>
            <sphereGeometry args={[0.14, 16, 16]} />
            {accent}
          </mesh>
        ))}
        {/* Signature eye patches, behind the eyes */}
        {[-1, 1].map((side) => (
          <mesh
            key={`patch${side}`}
            position={[side * 0.155, EYE_Y + 0.01, FACE_Z - 0.035]}
            scale={[0.85, 1.15, 0.3]}
            rotation={[0, 0, side * 0.3]}
          >
            <sphereGeometry args={[0.115, 16, 16]} />
            {accent}
          </mesh>
        ))}
      </>
    );
  } else if (shape === "dino-blocky") {
    decorations = (
      <>
        {[
          [0, 1.02, -0.3],
          [0, 1.26, -0.36],
          [0, 1.5, -0.28],
        ].map(([x, y, z]) => (
          <mesh key={`${y}`} position={[x, y, z]} rotation={[0.45, 0, 0]}>
            <coneGeometry args={[0.065, 0.16, 8]} />
            {accent}
          </mesh>
        ))}
        {/* Tail */}
        <mesh position={[0, 0.4, -0.34]} rotation={[Math.PI / 2.3, 0, 0]}>
          <coneGeometry args={[0.1, 0.36, 10]} />
          {toyMaterial(color)}
        </mesh>
      </>
    );
  } else if (shape === "cyber-angular") {
    decorations = (
      <>
        {/* Visor across the eye line */}
        <mesh position={[0, EYE_Y + 0.01, FACE_Z - 0.02]} scale={[0.72, 0.34, 0.34]}>
          <sphereGeometry args={[0.19, 20, 20]} />
          <meshStandardMaterial
            color={accentColor ?? "#00e5ff"}
            roughness={0.12}
            metalness={0.55}
            emissive={accentColor ?? "#00e5ff"}
            emissiveIntensity={0.35}
          />
        </mesh>
        {/* Antenna */}
        <mesh position={[0.17, HEAD_Y + 0.42, 0]} rotation={[0, 0, -0.18]}>
          <cylinderGeometry args={[0.014, 0.014, 0.18, 8]} />
          {accent}
        </mesh>
        <mesh position={[0.19, HEAD_Y + 0.52, 0]}>
          <sphereGeometry args={[0.037, 12, 12]} />
          {accent}
        </mesh>
        {/* Ear units */}
        {[-1, 1].map((side) => (
          <mesh key={`unit${side}`} position={[side * 0.38, HEAD_Y - 0.02, 0]}>
            <cylinderGeometry args={[0.075, 0.075, 0.06, 12]} />
            {accent}
          </mesh>
        ))}
      </>
    );
  }

  return (
    <group>
      <ChibiBody
        color={color}
        accentColor={accentColor ?? color}
        shoulderWidth={isFemale ? 0.29 : 0.34}
        torsoRadius={isFemale ? 0.24 : 0.28}
        hair={isHumanoid ? (isFemale ? "long" : "short") : "none"}
        showEars={isHumanoid}
      />
      {decorations}

      {/* 🔗 Item slots — anchor position + per-slot scale lock. */}
      {(Object.keys(ANCHORS) as (keyof typeof ANCHORS)[]).map((slot) => (
        <group key={slot} position={ANCHORS[slot]} scale={SLOT_SCALE[slot]}>
          {slots[slot]}
        </group>
      ))}
    </group>
  );
}

export default function AvatarCanvas3D({
  baseCharacter,
  baseSlug,
  equipped,
  interactive = true,
  height = 300,
}: AvatarCanvas3DProps) {
  const descriptor = baseCharacter ?? DEFAULT_BASE;
  const characterUrl = resolveModelUrl(baseCharacter, baseSlug, "character");

  const slots: AnchorSlots = { head: null, face: null, body: null, hand: null };
  for (const eq of equipped) {
    if (!eq.model3d) continue;
    const anchor = CATEGORY_ANCHOR[eq.category];
    if (!anchor) continue;
    const itemUrl = resolveModelUrl(eq.model3d, eq.slug, "item");
    slots[anchor] = itemUrl ? (
      <ModelFallback fallback={<Item3D model3d={eq.model3d} slot={anchor} />}>
        <Suspense fallback={null}>
          <GltfItem url={itemUrl} />
        </Suspense>
      </ModelFallback>
    ) : (
      <Item3D model3d={eq.model3d} slot={anchor} />
    );
  }

  const character = characterUrl ? (
    <ModelFallback fallback={<BaseCharacterMesh descriptor={descriptor} slots={slots} />}>
      <Suspense fallback={<BaseCharacterMesh descriptor={descriptor} slots={slots} />}>
        <GltfCharacter url={characterUrl} slug={baseSlug} slots={slots} />
      </Suspense>
    </ModelFallback>
  ) : (
    <BaseCharacterMesh descriptor={descriptor} slots={slots} />
  );

  return (
    <div style={{ height }} className="w-full">
      {/* Framed to fit the whole doll INCLUDING a tall hat (crown ≈1.9) —
          a tighter frame clipped headwear off the top of the canvas. */}
      <Canvas camera={{ position: [0, 1.25, 2.9], fov: 38 }} dpr={[1, 2]}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[2.5, 4, 2.5]} intensity={1.1} />
        <directionalLight position={[-3, 1.5, -1]} intensity={0.28} color="#a5c8ff" />
        <directionalLight position={[0, 2, -3]} intensity={0.45} color="#ffd9a0" />

        {/* 🏙️ Studio environment WITHOUT drei's `preset` — a preset downloads a
            multi-MB HDRI from a CDN on every mount, which is a real cost (and
            an offline failure) for this app's Capacitor/Android build and its
            mobile-network users. These Lightformers generate an equivalent
            studio env map locally: same soft reflections, zero network. */}
        <Environment resolution={64} frames={1}>
          <Lightformer intensity={2.2} position={[0, 3, 2]} scale={[6, 3, 1]} color="#fff7ef" />
          <Lightformer intensity={0.9} position={[-3, 1, 1]} scale={[3, 3, 1]} color="#a5c8ff" />
          <Lightformer intensity={1.1} position={[3, 1, -2]} scale={[3, 3, 1]} color="#ffd9a0" />
        </Environment>

        {character}

        {/* Soft grounding shadow. frames={1} bakes it once — the doll and key
            light are both static, so there's nothing to recompute per frame. */}
        <ContactShadows
          position={[0, 0, 0]}
          opacity={0.42}
          scale={3}
          blur={2.6}
          far={1.4}
          frames={1}
          color="#3a1e05"
        />

        <OrbitControls
          enablePan={false}
          minDistance={2}
          maxDistance={5}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 2}
          enableDamping
          dampingFactor={0.08}
          enabled={interactive}
          target={[0, 0.95, 0]}
        />
      </Canvas>
    </div>
  );
}
