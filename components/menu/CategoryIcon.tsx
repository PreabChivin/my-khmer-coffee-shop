"use client";

import { resolveCategoryIcon, type CategoryIconInput } from "@/lib/iconResolver";

export default function CategoryIcon({
  category,
  size = 28,
  className,
}: {
  category: CategoryIconInput;
  size?: number;
  className?: string;
}) {
  const resolved = resolveCategoryIcon(category);

  if (resolved.kind === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolved.src}
        alt=""
        className={className}
        style={{ width: size, height: size, objectFit: "contain" }}
      />
    );
  }

  const { Icon } = resolved;
  return <Icon size={size} className={className} />;
}
