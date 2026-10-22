// Tests the Arabic greeting fallback and preservation of admin-customized greetings.
const assert = require("node:assert/strict");
const test = require("node:test");
const DataManager = require("../dataManager");

function createDataManagerWithoutIO() {
  const dataManager = Object.create(DataManager.prototype);
  dataManager.greetings = {};
  dataManager.greetingsFile = "greetings.json";
  dataManager.saveJSON = () => {};
  return dataManager;
}

test("uses the Arabic default greeting and preserves the {name} placeholder", () => {
  const dataManager = createDataManagerWithoutIO();

  assert.equal(
    dataManager.getGreeting("group-without-custom-greeting"),
    "مرحباً {name}، نورت المجموعة! 👋🌷"
  );
});

test("returns a custom greeting exactly as the admin entered it", () => {
  const dataManager = createDataManagerWithoutIO();
  const customGreeting = "أهلًا يا {name}!\nنورت المجموعة.  ";

  dataManager.setGreeting("group-with-custom-greeting", customGreeting);

  assert.equal(
    dataManager.getGreeting("group-with-custom-greeting"),
    customGreeting
  );
});
