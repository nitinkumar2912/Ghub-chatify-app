import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const runtimeMode = process.env.NODE_ENV || "development";
const envFile = runtimeMode === "development" ? ".env.development" : ".env";
dotenv.config({ path: path.join(backendDirectory, envFile) });

export const ENV = {
  PORT: Number(process.env.PORT || 3000),
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  NODE_ENV: process.env.NODE_ENV || "development",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  COOKIE_SAME_SITE: process.env.COOKIE_SAME_SITE,
  EMAIL_VERIFICATION_REQUIRED:
    process.env.EMAIL_VERIFICATION_REQUIRED?.toLowerCase() === "true" ||
    (process.env.NODE_ENV === "production" &&
      process.env.EMAIL_VERIFICATION_REQUIRED?.toLowerCase() !== "false"),
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || "mingle",
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  ARCJET_KEY: process.env.ARCJET_KEY,
  ARCJET_ENV: process.env.ARCJET_ENV,
};

export function assertRequiredEnvironment() {
  const missing = ["MONGO_URI", "JWT_SECRET"].filter((key) => !ENV[key]);
  if (missing.length) {
    throw new Error(`Missing required backend environment variables: ${missing.join(", ")}`);
  }
  if (ENV.NODE_ENV === "production" && ENV.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters in production");
  }
  if (
    ENV.NODE_ENV === "production" &&
    ENV.EMAIL_VERIFICATION_REQUIRED &&
    (!ENV.RESEND_API_KEY || !ENV.EMAIL_FROM)
  ) {
    throw new Error(
      "RESEND_API_KEY and EMAIL_FROM are required when production email verification is enabled",
    );
  }
}
