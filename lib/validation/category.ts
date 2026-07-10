import { z } from "zod";

// Empty-string form fields should mean "not set", not a literal empty
// string — normalize before validating so "" round-trips to null.
const optionalText = (max: number) =>
  z.preprocess(
    (val) => (typeof val === "string" && val.trim() === "" ? null : val),
    z.string().trim().max(max).nullable().optional()
  );

export const categoryCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Category name is required")
    .max(60, "Category name must be 60 characters or fewer"),
  iconKey: optionalText(60),
  iconUrl: optionalText(500),
});

export const categoryUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Category name is required")
    .max(60, "Category name must be 60 characters or fewer")
    .optional(),
  iconKey: optionalText(60),
  iconUrl: optionalText(500),
});

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
