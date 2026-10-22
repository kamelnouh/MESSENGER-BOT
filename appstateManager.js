/**
 * Reads, validates, and safely writes the Messenger cookie session as JSON.
 * Session values are never logged; call sites receive only parsed cookie data.
 */
const fs = require("node:fs");
const path = require("node:path");

function normalizeAppState(input) {
  let value = input;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      throw new Error("Session file must contain valid JSON.");
    }
  }

  let cookies = value;
  if (!Array.isArray(cookies) && value && typeof value === "object") {
    if (Array.isArray(value.appState)) cookies = value.appState;
    else if (Array.isArray(value.cookies)) cookies = value.cookies;
  }

  if (!Array.isArray(cookies) || cookies.length === 0) {
    throw new Error("Session JSON must contain a non-empty cookie array.");
  }

  return cookies.map((cookie, index) => {
    if (!cookie || typeof cookie !== "object" || Array.isArray(cookie)) {
      throw new Error(`Session cookie ${index + 1} must be a JSON object.`);
    }

    const key = cookie.key ?? cookie.name;
    if (typeof key !== "string" || key.trim() === "") {
      throw new Error(`Session cookie ${index + 1} is missing its key or name.`);
    }
    if (typeof cookie.value !== "string") {
      throw new Error(`Session cookie ${index + 1} is missing its string value.`);
    }

    const normalized = { ...cookie, key };
    if (normalized.path == null || normalized.path === "") normalized.path = "/";

    if (normalized.expires == null && cookie.expirationDate != null) {
      let expiry = Number(cookie.expirationDate);
      if (!Number.isFinite(expiry)) {
        throw new Error(`Session cookie ${index + 1} has an invalid expiration.`);
      }
      if (expiry > 1_000_000_000_000) expiry /= 1000;
      normalized.expires = String(Math.floor(expiry));
    } else if (normalized.expires != null) {
      normalized.expires = String(normalized.expires);
    }

    if (normalized.httponly == null && cookie.httpOnly != null) {
      normalized.httponly = Boolean(cookie.httpOnly);
    }

    return normalized;
  });
}

function readAppState(filePath) {
  let contents;
  try {
    contents = fs.readFileSync(path.resolve(filePath), "utf8");
  } catch (error) {
    const reason = error.code === "ENOENT" ? "file not found" : "file could not be read";
    throw new Error(`Session JSON ${reason}.`);
  }
  return normalizeAppState(contents);
}

function writeAppState(filePath, appState) {
  const destination = path.resolve(filePath);
  const temporary = `${destination}.${process.pid}.${Date.now()}.tmp`;
  const normalized = normalizeAppState(appState);
  const contents = `${JSON.stringify(normalized, null, 2)}\n`;

  try {
    fs.writeFileSync(temporary, contents, {
      encoding: "utf8",
      mode: 0o600,
      flag: "wx"
    });
    fs.renameSync(temporary, destination);
  } catch (error) {
    try {
      if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
    } catch {
      // Keep the original session intact even if temporary-file cleanup fails.
    }
    throw new Error(`Session JSON could not be saved safely: ${error.message}`);
  }

  return normalized.length;
}

module.exports = { normalizeAppState, readAppState, writeAppState };
