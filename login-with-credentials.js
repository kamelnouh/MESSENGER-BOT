// Compatibility helper: validates cookie JSON only and never requests a password.
const path = require("node:path");
const { readAppState } = require("./appstateManager");

try {
  const cookies = readAppState(path.resolve("appstate.json"));
  console.log(`Valid cookie JSON session found (${cookies.length} cookies).`);
  console.log("The session values were not printed. Start the bot with: npm start");
} catch (error) {
  console.error("Cookie session check failed:", error.message);
  process.exitCode = 1;
}
