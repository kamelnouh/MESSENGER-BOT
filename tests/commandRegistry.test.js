// Verifies command-name parsing and lazy loading without starting Messenger.
const assert = require("node:assert/strict");
const test = require("node:test");
const {
  getCommandName,
  loadCommand,
  listCommandNames
} = require("../commands/registry");

test("parses Arabic group command names and ignores ordinary messages", () => {
  assert.equal(getCommandName(".حب"), "حب");
  assert.equal(getCommandName(".زواج @member"), "زواج");
  assert.equal(getCommandName("hello"), null);
});

test("loads every Arabic command module without loading image libraries", () => {
  for (const name of listCommandNames()) {
    const command = loadCommand(name);
    assert.equal(command.name, name);
    assert.equal(typeof command.execute, "function");
  }
});

test("English aliases resolve to the same command module", () => {
  assert.equal(loadCommand("love"), loadCommand("حب"));
  assert.equal(loadCommand("marriage"), loadCommand("زواج"));
});
