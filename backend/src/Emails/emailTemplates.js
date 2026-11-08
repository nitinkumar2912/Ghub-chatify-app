function escapeHtml(value = "") {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );
}

function emailLayout(title, name, content) {
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${escapeHtml(title)}</title></head>
  <body style="margin:0;padding:32px 16px;background:#f4f1f8;color:#302b3b;font-family:Arial,sans-serif">
    <main style="max-width:560px;margin:0 auto;padding:36px;border:1px solid #ebe5f3;border-radius:20px;background:#fff;box-shadow:0 16px 45px #302b3b12">
      <p style="margin:0 0 26px;color:#7959cf;font-size:23px;font-weight:700;letter-spacing:-1px">mingle<span style="color:#c7b5f4">.</span></p>
      <h1 style="margin:0 0 14px;font-size:25px;letter-spacing:-.6px">${escapeHtml(title)}</h1>
      <p style="margin:0 0 12px;color:#6c6678;font-size:15px;line-height:1.65">Hi ${escapeHtml(name)},</p>
      ${content}
      <p style="margin:28px 0 0;color:#9992a4;font-size:12px">Good conversations, a little closer.<br>The mingle team</p>
    </main>
  </body></html>`;
}

function actionLink(url, label) {
  return `<p style="margin:25px 0"><a href="${escapeHtml(url)}" style="display:inline-block;padding:13px 20px;border-radius:11px;background:#8061d5;color:#fff;text-decoration:none;font-size:14px;font-weight:700">${escapeHtml(label)}</a></p>`;
}

export function createWelcomeEmailTemplate(name, clientURL) {
  const safeURL = escapeHtml(clientURL);
  return emailLayout(
    "Welcome to mingle",
    name,
    `
    <p style="margin:0;color:#6c6678;font-size:15px;line-height:1.65">Your space is ready. Find your people, share a moment, and pick up the conversation whenever you’re ready.</p>
    ${actionLink(safeURL, "Open mingle")}`,
  );
}

export function createVerificationEmailTemplate(name, verificationURL) {
  return emailLayout(
    "Confirm your email",
    name,
    `
    <p style="margin:0;color:#6c6678;font-size:15px;line-height:1.65">Confirm this email address to finish setting up your mingle account. The link expires in 24 hours.</p>
    ${actionLink(verificationURL, "Verify email")}
    <p style="color:#9992a4;font-size:12px;line-height:1.6">If you did not create this account, you can ignore this email.</p>`,
  );
}

export function createPasswordResetEmailTemplate(name, resetURL) {
  return emailLayout(
    "Reset your password",
    name,
    `
    <p style="margin:0;color:#6c6678;font-size:15px;line-height:1.65">We received a request to reset your mingle password. This link expires in one hour.</p>
    ${actionLink(resetURL, "Choose a new password")}
    <p style="color:#9992a4;font-size:12px;line-height:1.6">If you did not request a reset, ignore this email. Your password will stay the same.</p>`,
  );
}
