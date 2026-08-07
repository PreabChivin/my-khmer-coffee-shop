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

// 📐 Item anchor offsets, per base-character shape — this is what makes
// fitting real rather than one universal offset that clips on a
// differently-proportioned character. Every shape defines all 4 anchors.
const HUMANOID_ANCHORS: { head: Vec3; face: Vec3; body: Vec3; hand: Vec3 } = {
  head: [0, 1.66, 0],
  face: [0, 1.46, 0.24],
  body: [0, 0.95, 0.26],
  hand: [0.34, 0.62, 0.12],
};

const ANCHORS: Record<string, { head: Vec3; face: Vec3; body: Vec3; hand: Vec3 }> = {
  "humanoid-male": HUMANOID_ANCHORS,
  "humanoid-female": HUMANOID_ANCHORS,
  "capsule-figure": HUMANOID_ANCHORS, // legacy alias — same rig as humanoid-male
  "panda-round": {
    head: [0, 1.62, 0],
    face: [0, 1.25, 0.32],
    body: [0, 0.75, 0.48],
    hand: [0.52, 0.55, 0.15],
  },
  "dino-blocky": {
    head: [0, 1.55, 0],
    face: [0, 1.2, 0.3],
    body: [0, 0.7, 0.34],
    hand: [0.45, 0.55, 0.15],
  },
  "cyber-angular": {
    head: [0, 1.6, 0],
    face: [0, 1.38, 0.26],
    body: [0, 0.75, 0.3],
    hand: [0.4, 0.55, 0.15],
  },
};

type Vec3 = [number, number, number];

const CATEGORY_ANCHOR: Partial<Record<ShopItemCategory, keyof (typeof ANCHORS)["capsule-figure"]>> = {
  HAT: "head",
  EYEWEAR: "face",
  OUTFIT: "body",
  HANDHELD: "hand",
};

/** One small primitive standing in for a real 3D asset — see
 *  ShopItem.model3d's doc comment in schema.prisma. `accentColor`, when
 *  present, adds a thin trim ring so the descriptor isn't wasted. */
function Item3D({ model3d }: { model3d: Model3DDescriptor }) {
  const { shape, color, accentColor, scale } = model3d;
  const material = <meshStandardMaterial color={color} />;
  const trim = accentColor && (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.24, 0.02, 8, 20]} />
      <meshStandardMaterial color={accentColor} />
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

/** A standing procedural humanoid — legs, torso, neck, head, arms, and
 *  simple cartoonish facial features (matching this app's existing
 *  cute/illustrated visual identity, e.g. BongBear — not attempted
 *  photorealism, which flat-shaded primitive geometry can't deliver
 *  honestly). `shoulderWidth`/`torsoRadius` distinguish the male/female
 *  silhouettes; `hasHair` adds a simple rounded hair-cap mesh. */
function HumanoidFigure({
  color,
  accentColor,
  shoulderWidth,
  torsoRadius,
  hasHair,
}: {
  color: string;
  accentColor: string;
  shoulderWidth: number;
  torsoRadius: number;
  hasHair: boolean;
}) {
  const skin = <meshStandardMaterial color={color} />;
  const trim = <meshStandardMaterial color={accentColor} />;
  const eye = <meshStandardMaterial color="#2a180b" />;

  return (
    <>
      {/* Legs */}
      <mesh position={[-0.13, 0.31, 0]}>
        <capsuleGeometry args={[0.11, 0.5, 4, 8]} />
        {trim}
      </mesh>
      <mesh position={[0.13, 0.31, 0]}>
        <capsuleGeometry args={[0.11, 0.5, 4, 8]} />
        {trim}
      </mesh>
      {/* Torso */}
      <mesh position={[0, 0.92, 0]}>
        <capsuleGeometry args={[torsoRadius, 0.42, 6, 12]} />
        {skin}
      </mesh>
      {/* Neck */}
      <mesh position={[0, 1.28, 0]}>
        <cylinderGeometry args={[0.09, 0.1, 0.1, 12]} />
        {skin}
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.46, 0]}>
        <sphereGeometry args={[0.24, 22, 22]} />
        {skin}
      </mesh>
      {hasHair && (
        <mesh position={[0, 1.53, -0.02]} scale={[1.08, 0.75, 1.08]}>
          <sphereGeometry args={[0.25, 18, 18]} />
          {trim}
        </mesh>
      )}
      {/* Simple face — two eyes + a mouth, cartoonish on purpose */}
      <mesh position={[-0.08, 1.48, 0.21]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        {eye}
      </mesh>
      <mesh position={[0.08, 1.48, 0.21]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        {eye}
      </mesh>
      <mesh position={[0, 1.4, 0.22]} rotation={[0, 0, 0]}>
        <capsuleGeometry args={[0.012, 0.08, 3, 6]} />
        {eye}
      </mesh>
      {/* Arms */}
      <mesh position={[-shoulderWidth, 0.95, 0]} rotation={[0, 0, Math.PI / 14]}>
        <capsuleGeometry args={[0.075, 0.46, 4, 8]} />
        {skin}
      </mesh>
      <mesh position={[shoulderWidth, 0.95, 0]} rotation={[0, 0, -Math.PI / 14]}>
        <capsuleGeometry args={[0.075, 0.46, 4, 8]} />
        {skin}
      </mesh>
    </>
  );
}

type AnchorSlots = Record<"head" | "face" | "body" | "hand", React.ReactNode>;

/** Procedural stand-in body for a base character — every branch returns
 *  the same 4 named anchor groups (positioned at ITS OWN proportions) so
 *  equipped items always land in the right spot regardless of which
 *  character is equipped. */
function BaseCharacterMesh({ descriptor, slots }: { descriptor: Model3DDescriptor; slots: AnchorSlots }) {
  const { shape, color, accentColor } = descriptor;
  const anchors = ANCHORS[shape] ?? ANCHORS["capsule-figure"];
  const body = <meshStandardMaterial color={color} />;
  const accent = <meshStandardMaterial color={accentColor ?? color} />;

  let figure: React.ReactNode;
  if (shape === "panda-round") {
    figure = (
      <>
        <mesh position={[0, 0.75, 0]}>
          <sphereGeometry args={[0.55, 24, 24]} />
          {body}
        </mesh>
        <mesh position={[0, 1.35, 0.05]}>
          <sphereGeometry args={[0.34, 20, 20]} />
          {body}
        </mesh>
        <mesh position={[-0.24, 1.62, 0.05]}>
          <sphereGeometry args={[0.12, 12, 12]} />
          {accent}
        </mesh>
        <mesh position={[0.24, 1.62, 0.05]}>
          <sphereGeometry args={[0.12, 12, 12]} />
          {accent}
        </mesh>
      </>
    );
  } else if (shape === "dino-blocky") {
    figure = (
      <>
        <mesh position={[0, 0.65, 0]}>
          <boxGeometry args={[0.62, 0.7, 0.42]} />
          {body}
        </mesh>
        <mesh position={[0, 1.28, 0.04]}>
          <boxGeometry args={[0.4, 0.34, 0.4]} />
          {body}
        </mesh>
        <mesh position={[0, 0.55, -0.42]} rotation={[Math.PI / 2.4, 0, 0]}>
          <coneGeometry args={[0.16, 0.55, 8]} />
          {accent}
        </mesh>
      </>
    );
  } else if (shape === "cyber-angular") {
    figure = (
      <>
        <mesh position={[0, 0.7, 0]}>
          <boxGeometry args={[0.5, 0.75, 0.32]} />
          {body}
        </mesh>
        <mesh position={[0, 1.4, 0.03]}>
          <boxGeometry args={[0.34, 0.32, 0.32]} />
          {body}
        </mesh>
        {/* Neon accent trim */}
        <mesh position={[0, 1.02, 0.17]}>
          <boxGeometry args={[0.52, 0.03, 0.03]} />
          {accent}
        </mesh>
        <mesh position={[-0.26, 0.5, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.6, 8]} />
          {body}
        </mesh>
        <mesh position={[0.26, 0.5, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.6, 8]} />
          {body}
        </mesh>
      </>
    );
  } else if (shape === "humanoid-female") {
    figure = (
      <HumanoidFigure
        color={color}
        accentColor={accentColor ?? color}
        shoulderWidth={0.28}
        torsoRadius={0.22}
        hasHair
      />
    );
  } else {
    // "humanoid-male" and the legacy "capsule-figure" alias.
    figure = (
      <HumanoidFigure
        color={color}
        accentColor={accentColor ?? color}
        shoulderWidth={0.34}
        torsoRadius={0.27}
        hasHair={false}
      />
    );
  }

  return (
    <group>
      {figure}
      <group position={anchors.head}>{slots.head}</group>
      <group position={anchors.face}>{slots.face}</group>
      <group position={anchors.body}>{slots.body}</group>
      <group position={anchors.hand}>{slots.hand}</group>
    </group>
  );
}

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
      <Canvas camera={{ position: [0, 1.4, 3.2], fov: 40 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 4, 2]} intensity={0.9} />
        <BaseCharacterMesh descriptor={descriptor} slots={slots} />
        <OrbitControls enablePan={false} minDistance={2} maxDistance={5} enabled={interactive} target={[0, 1, 0]} />
      </Canvas>
    </div>
  );
}
