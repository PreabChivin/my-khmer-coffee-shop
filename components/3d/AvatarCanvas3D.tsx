"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { Model3DDescriptor, ShopItemCategory } from "@/lib/types";

export interface AvatarCanvas3DProps {
  /** The equipped BASE_CHARACTER's descriptor — falls back to a default
   *  barista shape if the user hasn't equipped/bought one yet, same
   *  fallback-when-nothing-equipped idea the old 2D AvatarStage used. */
  baseCharacter?: Model3DDescriptor | null;
  /** HAT/EYEWEAR/OUTFIT/HANDHELD items to snap onto the character. */
  equipped: { category: ShopItemCategory; model3d: Model3DDescriptor | null }[];
  /** Enables drag-to-rotate + zoom (OrbitControls). Default true. */
  interactive?: boolean;
  height?: number;
}

const DEFAULT_BASE: Model3DDescriptor = {
  shape: "humanoid-male",
  color: "#bd8360",
  accentColor: "#4a2c11",
};

type Vec3 = [number, number, number];

// 📐 Item anchor offsets, per base-character shape — this is what makes
// fitting real rather than one universal offset that clips on a
// differently-proportioned character. Every shape defines all 4 anchors,
// matched to the shared chibi rig's proportions (see ChibiBody).
const CHIBI_ANCHORS: { head: Vec3; face: Vec3; body: Vec3; hand: Vec3 } = {
  head: [0, 1.66, 0],
  face: [0, 1.24, 0.34],
  body: [0, 0.62, 0.3],
  hand: [0.4, 0.42, 0.12],
};

const ANCHORS: Record<string, { head: Vec3; face: Vec3; body: Vec3; hand: Vec3 }> = {
  "humanoid-male": CHIBI_ANCHORS,
  "humanoid-female": CHIBI_ANCHORS,
  "capsule-figure": CHIBI_ANCHORS, // legacy alias — same rig as humanoid-male
  "panda-round": CHIBI_ANCHORS,
  "dino-blocky": CHIBI_ANCHORS,
  "cyber-angular": CHIBI_ANCHORS,
};

const CATEGORY_ANCHOR: Partial<Record<ShopItemCategory, keyof typeof CHIBI_ANCHORS>> = {
  HAT: "head",
  EYEWEAR: "face",
  OUTFIT: "body",
  HANDHELD: "hand",
};

/** Glossy "toy plastic" finish — a bit of sheen instead of flat matte, the
 *  single biggest lever for reading as a doll rather than raw geometry. */
function toyMaterial(color: string) {
  return <meshStandardMaterial color={color} roughness={0.35} metalness={0.06} />;
}

/** One small primitive standing in for a real 3D asset — see
 *  ShopItem.model3d's doc comment in schema.prisma. `accentColor`, when
 *  present, adds a thin trim ring so the descriptor isn't wasted. */
function Item3D({ model3d }: { model3d: Model3DDescriptor }) {
  const { shape, color, accentColor, scale } = model3d;
  const material = toyMaterial(color);
  const trim = accentColor && (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.24, 0.02, 8, 20]} />
      {toyMaterial(accentColor)}
    </mesh>
  );

  switch (shape) {
    case "cone":
      return (
        <group scale={scale}>
          <mesh>
            <coneGeometry args={[0.26, 0.32, 16]} />
            {material}
          </mesh>
          {trim}
        </group>
      );
    case "cylinder":
      return (
        <group scale={scale}>
          <mesh>
            <cylinderGeometry args={[0.2, 0.2, 0.36, 16]} />
            {material}
          </mesh>
          {trim}
        </group>
      );
    case "torus":
      return (
        <group scale={scale} rotation={[Math.PI / 2, 0, 0]}>
          <mesh>
            <torusGeometry args={[0.2, 0.055, 12, 24]} />
            {material}
          </mesh>
        </group>
      );
    case "sphere":
      return (
        <group scale={scale}>
          <mesh>
            <sphereGeometry args={[0.22, 16, 16]} />
            {material}
          </mesh>
          {trim}
        </group>
      );
    case "box":
    default:
      return (
        <group scale={scale}>
          <mesh>
            <boxGeometry args={[0.46, 0.34, 0.42]} />
            {material}
          </mesh>
          {trim}
        </group>
      );
  }
}

interface ChibiProps {
  color: string;
  accentColor: string;
  shoulderWidth: number;
  torsoRadius: number;
}

/** 🧸 Shared "doll" anatomy — every character shape renders THIS as its
 *  base (legs, torso, neck, arms with mitten hands, an oversized head with
 *  big sparkly eyes + blush) so nothing is ever a disconnected floating
 *  box. Chibi proportions (big head, short body) deliberately: it reads as
 *  an intentional cute-toy design on flat-shaded primitive geometry, where
 *  realistic human proportions would just look unfinished. Per-character
 *  decorations (ears, spikes, a visor, hair) render on top of this in
 *  BaseCharacterMesh, so each character keeps a distinct silhouette. */
function ChibiBody({ color, accentColor, shoulderWidth, torsoRadius }: ChibiProps) {
  const skin = toyMaterial(color);
  const trim = toyMaterial(accentColor);
  const eyeMat = <meshStandardMaterial color="#2a180b" roughness={0.15} />;
  const sparkleMat = <meshStandardMaterial color="#ffffff" roughness={0.1} />;
  const blushMat = (
    <meshStandardMaterial color="#ff9fb8" roughness={0.6} transparent opacity={0.55} />
  );

  return (
    <>
      {/* Legs — short and chunky */}
      <mesh position={[-0.15, 0.19, 0]}>
        <capsuleGeometry args={[0.12, 0.24, 4, 10]} />
        {trim}
      </mesh>
      <mesh position={[0.15, 0.19, 0]}>
        <capsuleGeometry args={[0.12, 0.24, 4, 10]} />
        {trim}
      </mesh>

      {/* Torso */}
      <mesh position={[0, 0.62, 0]}>
        <capsuleGeometry args={[torsoRadius, 0.26, 6, 14]} />
        {skin}
      </mesh>

      {/* Neck stub */}
      <mesh position={[0, 0.92, 0]}>
        <cylinderGeometry args={[0.11, 0.13, 0.08, 12]} />
        {skin}
      </mesh>

      {/* Head — big, chibi-proportioned */}
      <mesh position={[0, 1.28, 0]}>
        <sphereGeometry args={[0.38, 28, 28]} />
        {skin}
      </mesh>

      {/* Big sparkly eyes */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 0.15, 1.29, 0.33]} scale={[0.62, 0.8, 0.5]}>
            <sphereGeometry args={[0.075, 16, 16]} />
            {eyeMat}
          </mesh>
          <mesh position={[side * 0.15 + side * 0.02, 1.33, 0.375]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            {sparkleMat}
          </mesh>
          {/* Blush */}
          <mesh position={[side * 0.24, 1.19, 0.3]} scale={[1, 0.7, 0.4]}>
            <sphereGeometry args={[0.06, 10, 10]} />
            {blushMat}
          </mesh>
        </group>
      ))}
      {/* Smile */}
      <mesh position={[0, 1.14, 0.365]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.05, 0.012, 8, 12, Math.PI]} />
        {eyeMat}
      </mesh>

      {/* Arms — mitten-hand tipped so nothing ends in a bare stump */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh
            position={[side * shoulderWidth, 0.66, 0]}
            rotation={[0, 0, side * (Math.PI / 9)]}
          >
            <capsuleGeometry args={[0.08, 0.3, 4, 10]} />
            {skin}
          </mesh>
          <mesh position={[side * (shoulderWidth + 0.08), 0.42, 0]}>
            <sphereGeometry args={[0.1, 14, 14]} />
            {trim}
          </mesh>
        </group>
      ))}
    </>
  );
}

/** Procedural stand-in body for a base character — every branch shares
 *  ChibiBody's anatomy and layers distinct decorations on top, so items
 *  parented to the 4 named anchors always land correctly (see ANCHORS)
 *  while each character keeps its own silhouette. */
function BaseCharacterMesh({
  descriptor,
  slots,
}: {
  descriptor: Model3DDescriptor;
  slots: AnchorSlots;
}) {
  const { shape, color, accentColor } = descriptor;
  const anchors = ANCHORS[shape] ?? ANCHORS["capsule-figure"];
  const accent = toyMaterial(accentColor ?? color);

  const isFemale = shape === "humanoid-female";
  const shoulderWidth = isFemale ? 0.29 : 0.34;
  const torsoRadius = isFemale ? 0.24 : 0.28;

  let decorations: React.ReactNode = null;
  if (shape === "panda-round") {
    decorations = (
      <>
        <mesh position={[-0.24, 1.58, 0]}>
          <sphereGeometry args={[0.13, 14, 14]} />
          {accent}
        </mesh>
        <mesh position={[0.24, 1.58, 0]}>
          <sphereGeometry args={[0.13, 14, 14]} />
          {accent}
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.15, 1.3, 0.3]} rotation={[0, 0, side * 0.35]}>
            <sphereGeometry args={[0.11, 14, 14]} />
            {accent}
          </mesh>
        ))}
      </>
    );
  } else if (shape === "dino-blocky") {
    decorations = (
      <>
        {[0.98, 1.18, 1.36].map((y, i) => (
          <mesh key={y} position={[0, y, -0.28 + i * 0.02]} rotation={[0.3, 0, 0]}>
            <coneGeometry args={[0.06, 0.14, 6]} />
            {accent}
          </mesh>
        ))}
        <mesh position={[0, 0.42, -0.32]} rotation={[Math.PI / 2.3, 0, 0]}>
          <coneGeometry args={[0.1, 0.34, 8]} />
          {toyMaterial(color)}
        </mesh>
      </>
    );
  } else if (shape === "cyber-angular") {
    decorations = (
      <>
        {/* Visor instead of plain eyes */}
        <mesh position={[0, 1.29, 0.36]} scale={[0.62, 0.34, 0.3]}>
          <sphereGeometry args={[0.16, 16, 16]} />
          <meshStandardMaterial color={accentColor ?? "#00e5ff"} roughness={0.15} metalness={0.4} />
        </mesh>
        <mesh position={[0, 1.7, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.14, 6]} />
          {accent}
        </mesh>
        <mesh position={[0, 1.78, 0]}>
          <sphereGeometry args={[0.035, 10, 10]} />
          {accent}
        </mesh>
      </>
    );
  } else if (isFemale) {
    decorations = (
      <mesh position={[0, 1.36, -0.03]} scale={[1.12, 0.8, 1.12]}>
        <sphereGeometry args={[0.4, 20, 20]} />
        {accent}
      </mesh>
    );
  }

  return (
    <group>
      <ChibiBody
        color={color}
        accentColor={accentColor ?? color}
        shoulderWidth={shoulderWidth}
        torsoRadius={torsoRadius}
      />
      {decorations}
      <group position={anchors.head}>{slots.head}</group>
      <group position={anchors.face}>{slots.face}</group>
      <group position={anchors.body}>{slots.body}</group>
      <group position={anchors.hand}>{slots.hand}</group>
    </group>
  );
}

type AnchorSlots = Record<"head" | "face" | "body" | "hand", React.ReactNode>;

export default function AvatarCanvas3D({
  baseCharacter,
  equipped,
  interactive = true,
  height = 260,
}: AvatarCanvas3DProps) {
  const descriptor = baseCharacter ?? DEFAULT_BASE;

  const slots: AnchorSlots = { head: null, face: null, body: null, hand: null };
  for (const eq of equipped) {
    if (!eq.model3d) continue;
    const anchor = CATEGORY_ANCHOR[eq.category];
    if (!anchor) continue;
    slots[anchor] = <Item3D model3d={eq.model3d} />;
  }

  return (
    <div style={{ height }} className="w-full">
      <Canvas camera={{ position: [0, 1.15, 2.6], fov: 38 }}>
        {/* Soft sky/ground gradient instead of flat ambient — reads as a
            real render rather than a flatly-lit primitive. */}
        <hemisphereLight args={["#fff7ef", "#8a5636", 0.55]} />
        <directionalLight position={[2.5, 4, 2.5]} intensity={1} />
        {/* Cool fill + warm rim, classic 3-point toy-render lighting. */}
        <directionalLight position={[-3, 1.5, -1]} intensity={0.25} color="#a5c8ff" />
        <directionalLight position={[0, 2, -3]} intensity={0.4} color="#ffd9a0" />
        <BaseCharacterMesh descriptor={descriptor} slots={slots} />
        <OrbitControls
          enablePan={false}
          minDistance={1.6}
          maxDistance={4.5}
          enabled={interactive}
          target={[0, 0.9, 0]}
        />
      </Canvas>
    </div>
  );
}
