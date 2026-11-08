import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { io } from "socket.io-client";

const API_ORIGIN = process.env.MINGLE_INTEGRATION_URL;
const password = "mingle-test-password-2026";

if (
  API_ORIGIN &&
  !["localhost", "127.0.0.1", "[::1]", "::1"].includes(new URL(API_ORIGIN).hostname)
) {
  throw new Error(
    "Integration tests are limited to a local server. Use an isolated local test database.",
  );
}

function cookieHeader(response) {
  const cookies =
    response.headers.getSetCookie?.() || [response.headers.get("set-cookie")].filter(Boolean);
  return cookies.map((cookie) => cookie.split(";", 1)[0]).join("; ");
}

function cookieValue(cookie, name) {
  return cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

async function api(path, { cookie, body, ...options } = {}) {
  return fetch(new URL(path, API_ORIGIN), {
    ...options,
    headers: {
      ...(body === undefined ? {} : { "content-type": "application/json" }),
      ...(cookie ? { cookie } : {}),
      ...options.headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

function once(socket, event, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`Timed out waiting for ${event}`)),
      timeoutMs,
    );
    socket.once(event, (...args) => {
      clearTimeout(timeout);
      resolve(args[0]);
    });
  });
}

async function createAccount(label) {
  const unique = randomUUID();
  const email = `mingle-${label}-${unique}@example.test`;
  const response = await api("/api/auth/signup", {
    method: "POST",
    body: {
      fullName: `Mingle ${label}`,
      email,
      password,
    },
  });
  const user = await response.json();
  assert.equal(response.status, 201, JSON.stringify(user));
  return { user, cookie: cookieHeader(response), email };
}

test(
  "auth refresh, authenticated realtime DMs, receipts, and message actions",
  {
    skip: !API_ORIGIN && "Set MINGLE_INTEGRATION_URL to an isolated local server",
  },
  async (t) => {
    const first = await createAccount("first");
    const second = await createAccount("second");
    let socketA;
    let socketB;
    t.after(() => {
      socketA?.disconnect();
      socketB?.disconnect();
    });

    const oldRefreshToken = cookieValue(first.cookie, "refreshToken");
    const refreshResponse = await api("/api/auth/refresh", {
      method: "POST",
      cookie: first.cookie,
    });
    assert.equal(refreshResponse.status, 204);
    first.cookie = cookieHeader(refreshResponse);
    assert.notEqual(cookieValue(first.cookie, "refreshToken"), oldRefreshToken);

    const replayResponse = await api("/api/auth/refresh", {
      method: "POST",
      cookie: `refreshToken=${oldRefreshToken}`,
    });
    assert.equal(replayResponse.status, 401, "a rotated refresh token must not be reusable");
    assert.equal((await api("/api/auth/check", { cookie: first.cookie })).status, 200);

    const loginResponse = await api("/api/auth/login", {
      method: "POST",
      body: { email: second.email, password },
    });
    assert.equal(loginResponse.status, 200);
    second.cookie = cookieHeader(loginResponse);

    socketA = io(API_ORIGIN, { extraHeaders: { cookie: first.cookie }, transports: ["websocket"] });
    socketB = io(API_ORIGIN, {
      extraHeaders: { cookie: second.cookie },
      transports: ["websocket"],
    });
    await Promise.all([once(socketA, "connect"), once(socketB, "connect")]);

    const messageReceivedA = once(socketA, "message:new");
    const messageReceivedB = once(socketB, "message:new");
    const messageText = `Realtime hello ${randomUUID()}`;
    const sendResponse = await api(`/api/messages/send/${second.user._id}`, {
      method: "POST",
      cookie: first.cookie,
      body: { text: messageText, clientMessageId: randomUUID() },
    });
    const sentMessage = await sendResponse.json();
    assert.equal(sendResponse.status, 201, JSON.stringify(sentMessage));
    assert.ok(sentMessage.deliveredAt, "an online recipient should receive a delivery timestamp");
    assert.equal((await messageReceivedA).text, messageText);
    assert.equal((await messageReceivedB).text, messageText);

    const readReceipt = once(socketA, "message:read");
    socketB.emit("message:read", { withUserId: first.user._id });
    assert.ok((await readReceipt).messageIds.includes(sentMessage._id));

    const editedText = `${messageText} (edited)`;
    const editResponse = await api(`/api/messages/${sentMessage._id}`, {
      method: "PATCH",
      cookie: first.cookie,
      body: { text: editedText },
    });
    assert.equal(editResponse.status, 200);
    assert.equal((await editResponse.json()).text, editedText);

    const reactionResponse = await api(`/api/messages/${sentMessage._id}/reactions`, {
      method: "POST",
      cookie: second.cookie,
      body: { emoji: "❤️" },
    });
    assert.equal(reactionResponse.status, 200);
    assert.equal((await reactionResponse.json()).reactions.length, 1);

    const pinResponse = await api(`/api/messages/${sentMessage._id}/pin`, {
      method: "POST",
      cookie: second.cookie,
    });
    assert.equal(pinResponse.status, 200);
    assert.equal((await pinResponse.json()).isPinned, true);

    const historyResponse = await api(`/api/messages/${first.user._id}?limit=10`, {
      cookie: second.cookie,
    });
    assert.equal(historyResponse.status, 200);
    const history = await historyResponse.json();
    assert.equal(history.messages[0]._id, sentMessage._id);
    assert.equal(history.messages[0].isRead, true);

    const searchResponse = await api(`/api/messages/search?q=${encodeURIComponent(messageText)}`, {
      cookie: first.cookie,
    });
    assert.equal(searchResponse.status, 200);
    assert.ok((await searchResponse.json()).some((message) => message._id === sentMessage._id));

    const deleteResponse = await api(`/api/messages/${sentMessage._id}`, {
      method: "DELETE",
      cookie: first.cookie,
    });
    assert.equal(deleteResponse.status, 200);
    assert.ok((await deleteResponse.json()).deletedAt);

    const blockResponse = await api(`/api/messages/contacts/${second.user._id}/block`, {
      method: "POST",
      cookie: first.cookie,
      body: { blocked: true },
    });
    assert.equal(blockResponse.status, 200);
    assert.ok((await blockResponse.json()).blockedUsers.includes(second.user._id));
    assert.equal(
      (await api(`/api/messages/${second.user._id}`, { cookie: first.cookie })).status,
      404,
      "a blocked conversation must no longer be readable by the blocker",
    );
    assert.equal(
      (await api(`/api/messages/${first.user._id}`, { cookie: second.cookie })).status,
      404,
      "a blocked conversation must no longer be readable by the blocked person",
    );

    const socketDisconnect = once(socketA, "disconnect");
    const logoutResponse = await api("/api/auth/logout", { method: "POST", cookie: first.cookie });
    assert.equal(logoutResponse.status, 200);
    assert.equal(await socketDisconnect, "io server disconnect");
    assert.equal((await api("/api/auth/check", { cookie: first.cookie })).status, 401);
  },
);
