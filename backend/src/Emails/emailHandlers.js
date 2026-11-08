import { resendCLient } from "../lib/resend.js";
import { ENV } from "../lib/env.js";
import {
  createPasswordResetEmailTemplate,
  createVerificationEmailTemplate,
  createWelcomeEmailTemplate,
} from "./emailTemplates.js";

async function sendEmail(to, subject, html) {
  if (!ENV.RESEND_API_KEY || !ENV.EMAIL_FROM) throw new Error("Email service is not configured");
  const { data, error } = await resendCLient.emails.send({
    from: `${ENV.EMAIL_FROM_NAME} <${ENV.EMAIL_FROM}>`,
    to,
    subject,
    html,
  });
  if (error) throw new Error(error.message || "Email provider rejected the request");
  return data;
}

export const sendWelcomeEmail = (email, name, clientURL) =>
  sendEmail(email, "Welcome to mingle", createWelcomeEmailTemplate(name, clientURL));

export const sendVerificationEmail = (email, name, verificationURL) =>
  sendEmail(
    email,
    "Confirm your mingle email",
    createVerificationEmailTemplate(name, verificationURL),
  );

export const sendPasswordResetEmail = (email, name, resetURL) =>
  sendEmail(email, "Reset your mingle password", createPasswordResetEmailTemplate(name, resetURL));
