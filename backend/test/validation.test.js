import test from "node:test";
import assert from "node:assert/strict";
import {
  loginSchema,
  messageSchema,
  muteSchema,
  paginationSchema,
  signupSchema,
} from "../src/lib/validation.js";

test("signup input is normalized and enforces the new-account password policy", () => {
  const result = signupSchema.safeParse({
    fullName: "  Mingle Tester  ",
    email: "  TESTER@example.com ",
    password: "mingle-secure-123",
  });
  assert.equal(result.success, true);
  assert.equal(result.data.fullName, "Mingle Tester");
  assert.equal(result.data.email, "tester@example.com");
  assert.equal(
    signupSchema.safeParse({ fullName: "A", email: "a@example.com", password: "short" }).success,
    false,
  );
  assert.equal(
    signupSchema.safeParse({ fullName: "A", email: "a@example.com", password: "é".repeat(37) })
      .success,
    false,
  );
});

test("login preserves existing password policy while rejecting oversized bcrypt input", () => {
  assert.equal(
    loginSchema.safeParse({ email: "person@example.com", password: "existing-password" }).success,
    true,
  );
  assert.equal(
    loginSchema.safeParse({ email: "person@example.com", password: "x".repeat(73) }).success,
    false,
  );
});

test("message payload allows text and supported image data but rejects remote URLs", () => {
  assert.equal(messageSchema.safeParse({ text: "hello" }).success, true);
  assert.equal(
    messageSchema.safeParse({ text: "", image: "data:image/png;base64,aGVsbG8=" }).success,
    true,
  );
  assert.equal(
    messageSchema.safeParse({ text: "", image: "https://example.com/image.png" }).success,
    false,
  );
  assert.equal(messageSchema.safeParse({ text: "x".repeat(2001) }).success, false);
});

test("pagination uses bounded page sizes and ObjectId cursors", () => {
  assert.deepEqual(paginationSchema.parse({ limit: "100" }), { limit: 100 });
  assert.equal(paginationSchema.safeParse({ limit: "101" }).success, false);
  assert.equal(paginationSchema.safeParse({ cursor: "not-an-object-id" }).success, false);
});

test("notification mute input requires an explicit boolean", () => {
  assert.deepEqual(muteSchema.parse({ muted: true }), { muted: true });
  assert.equal(muteSchema.safeParse({ muted: "true" }).success, false);
});
