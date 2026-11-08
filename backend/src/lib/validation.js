import { z } from "zod";

const email = z.string().trim().toLowerCase().email().max(254);
const password = z
  .string()
  .min(1, "Password is required")
  .refine((value) => Buffer.byteLength(value, "utf8") <= 72, "Password is too long");

export const signupSchema = z.object({
  fullName: z.string().trim().min(1).max(60),
  email,
  password: password.min(10, "Password must be at least 10 characters"),
});

export const loginSchema = z.object({ email, password });
export const emailSchema = z.object({ email });
export const verifyEmailSchema = z.object({ token: z.string().min(20).max(100) });
export const resetPasswordSchema = z.object({
  token: z.string().min(20).max(100),
  password: password.min(10, "Password must be at least 10 characters"),
});

export const messageSchema = z.object({
  text: z.string().trim().max(2000).default(""),
  image: z
    .string()
    .max(11_200_000)
    .regex(
      /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/,
      "Choose a JPEG, PNG, or WebP image",
    )
    .optional(),
  clientMessageId: z.string().uuid().optional(),
  replyTo: z
    .string()
    .regex(/^[a-f\d]{24}$/i)
    .optional(),
});

export const editMessageSchema = z.object({ text: z.string().trim().min(1).max(2000) });
export const reactionSchema = z.object({
  emoji: z.enum(["👍", "❤️", "😂", "😮", "😢", "🎉", "✨", "🔥"]),
});
export const reportSchema = z.object({ reason: z.string().trim().min(4).max(500) });
export const blockSchema = z.object({ blocked: z.boolean() });
export const muteSchema = z.object({ muted: z.boolean() });

export const paginationSchema = z.object({
  cursor: z
    .string()
    .regex(/^[a-f\d]{24}$/i)
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export function validationMessage(error) {
  return error.issues?.[0]?.message || "Invalid request";
}
