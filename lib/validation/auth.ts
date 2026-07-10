import { z } from "zod";

// Version-agnostic email check (avoids relying on zod's email-format helper,
// whose API shifted between zod 3 and 4).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const optionalText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().max(max).optional()
  );

export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .min(3, "Please enter a valid email")
    .max(200)
    .regex(EMAIL_RE, "Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters").max(200),
  name: z.string().trim().min(1, "Name is required").max(80),
  username: optionalText(40),
  phone: optionalText(30),
});

export const loginSchema = z.object({
  // Accepts either an email or a username in the same field.
  identifier: z.string().trim().min(1, "Enter your email or username").max(200),
  password: z.string().min(1, "Enter your password").max(200),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
