import type { User } from "@prisma/client";
import type { UserDTO } from "@/lib/types";

/** Maps a Prisma User to the public-safe DTO (never leaks passwordHash). */
export function toUserDTO(user: User): UserDTO {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name,
    phone: user.phone,
    loyaltyPoints: user.loyaltyPoints,
    dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString() : null,
  };
}
