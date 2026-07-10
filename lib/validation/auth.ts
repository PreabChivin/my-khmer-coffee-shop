import { z } from "zod";

// Version-agnostic email check (avoids relying on zod's email-format helper,
// whose API shifted between zod 3 and 4).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const optionalText = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().max(max).optional()
  );

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .min(3, "Please enter a valid email")
    .max(200)
    .regex(EMAIL_RE, "Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters").max(200),
  name: z.string().trim().min(1, "Real name is required").max(80),
  // 🎂 YYYY-MM-DD; must be a real, past date within a sane range.
  dateOfBirth: z
    .string()
    .regex(DATE_RE, "Please enter your date of birth")
    .refine((v) => {
      const d = new Date(`${v}T00:00:00Z`);
      if (Number.isNaN(d.getTime())) return false;
      const year = d.getUTCFullYear();
      return d.getTime() < Date.now() && year >= 1900 && year <= new Date().getUTCFullYear();
    }, "Please enter a valid date of birth"),
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
