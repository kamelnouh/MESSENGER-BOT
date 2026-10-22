// Tests JSON cookie-session parsing and writes using synthetic data in a temp directory.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const {
  normalizeAppState,
  readAppState,
  writeAppState
} = require("../appstateManager");

test("normalizes browser cookie JSON without dropping existing fields", () => {
  const cookies = normalizeAppState(JSON.stringify([{
    name: "session-cookie",
    value: "sample-only",
    domain: ".facebook.com",
    expirationDate: 1_700_000_000.8,
    httpOnly: true,
    sameSite: "lax",
    customField: "preserved"
  }]));

  assert.equal(cookies.length, 1);
  assert.equal(cookies[0].key, "session-cookie");
  assert.equal(cookies[0].path, "/");
  assert.equal(cookies[0].expires, "1700000000");
  assert.equal(cookies[0].httponly, true);
  assert.equal(cookies[0].customField, "preserved");
});

test("accepts JSON wrapper objects and rejects invalid cookie data", () => {
  assert.equal(normalizeAppState({ cookies: [{ key: "sid", value: "sample" }] }).length, 1);
  assert.throws(() => normalizeAppState("{broken"), /valid JSON/);
  assert.throws(() => normalizeAppState([]), /non-empty cookie array/);
  assert.throws(() => normalizeAppState([{ value: "sample" }]), /key or name/);
  assert.throws(() => normalizeAppState([{ key: "sid", value: 7 }]), /string value/);
});

test("writes and reads valid session JSON with private file permissions", (t) => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "messenger-session-test-"));
  t.after(() => fs.rmSync(tempDirectory, { recursive: true, force: true }));

  const filePath = path.join(tempDirectory, "appstate.json");
  const sampleCookies = [{ key: "sample-cookie", value: "test-only" }];
  assert.equal(writeAppState(filePath, sampleCookies), 1);
  assert.deepEqual(readAppState(filePath), [
    { key: "sample-cookie", value: "test-only", path: "/" }
  ]);
  assert.equal(fs.statSync(filePath).mode & 0o777, 0o600);
});
