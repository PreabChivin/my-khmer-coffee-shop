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
    .string({ error: "សូមបញ្ចូលអុីមែលឲ្យបានត្រឹមត្រូវ។" })
    .trim()
    .min(3, "សូមបញ្ចូលអុីមែលឲ្យបានត្រឹមត្រូវ។")
    .max(200)
    .regex(EMAIL_RE, "សូមបញ្ចូលអុីមែលឲ្យបានត្រឹមត្រូវ។"),
  password: z
    .string({ error: "ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៦ តួអក្សរ។" })
    .min(6, "ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៦ តួអក្សរ។")
    .max(200),
  name: z
    .string({ error: "តម្រូវឲ្យមានឈ្មោះពិត។" })
    .trim()
    .min(1, "តម្រូវឲ្យមានឈ្មោះពិត។")
    .max(80),
  // 🎂 YYYY-MM-DD; must be a real, past date within a sane range.
  dateOfBirth: z
    .string({ error: "សូមបញ្ចូលថ្ងៃខែឆ្នាំកំណើត។" })
    .regex(DATE_RE, "សូមបញ្ចូលថ្ងៃខែឆ្នាំកំណើត។")
    .refine((v) => {
      const d = new Date(`${v}T00:00:00Z`);
      if (Number.isNaN(d.getTime())) return false;
      const year = d.getUTCFullYear();
      return d.getTime() < Date.now() && year >= 1900 && year <= new Date().getUTCFullYear();
    }, "សូមបញ្ចូលថ្ងៃខែឆ្នាំកំណើតឲ្យបានត្រឹមត្រូវ។"),
  username: optionalText(40),
  phone: optionalText(30),
});

export const loginSchema = z.object({
  // Accepts either an email or a username in the same field.
  identifier: z
    .string({ error: "សូមបញ្ចូលអុីមែល ឬឈ្មោះអ្នកប្រើ។" })
    .trim()
    .min(1, "សូមបញ្ចូលអុីមែល ឬឈ្មោះអ្នកប្រើ។")
    .max(200),
  password: z
    .string({ error: "សូមបញ្ចូលពាក្យសម្ងាត់។" })
    .min(1, "សូមបញ្ចូលពាក្យសម្ងាត់។")
    .max(200),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
