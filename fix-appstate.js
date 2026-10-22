// Validates cookie JSON and writes a separate normalized copy by default.
// Use --replace only when needed; it first preserves the original as a backup.
const fs = require("node:fs");
const path = require("node:path");
const { readAppState, writeAppState } = require("./appstateManager");

const sourcePath = path.resolve("appstate.json");
const outputPath = path.resolve("appstate.normalized.json");
const replaceOriginal = process.argv.includes("--replace");

try {
  const cookies = readAppState(sourcePath);

  if (replaceOriginal) {
    const backupPath = `${sourcePath}.backup-${Date.now()}`;
    fs.copyFileSync(sourcePath, backupPath, fs.constants.COPYFILE_EXCL);
    fs.chmodSync(backupPath, 0o600);
    writeAppState(sourcePath, cookies);
    console.log("Cookie JSON normalized; the original was preserved in a private backup.");
  } else {
    if (fs.existsSync(outputPath)) {
      throw new Error("appstate.normalized.json already exists; it was left unchanged.");
    }
    writeAppState(outputPath, cookies);
    console.log("Validated cookie JSON and created appstate.normalized.json.");
    console.log("The original appstate.json was not changed.");
  }
} catch (error) {
  console.error("Could not normalize session JSON:", error.message);
  process.exitCode = 1;
}
