/**
 * Maps chat command names to their command modules.
 * Modules are required only when used so optional image dependencies cannot
 * prevent the Messenger bot from starting.
 */
const COMMAND_MODULES = Object.freeze({
  "زواج": "./marriage",
  "marriage": "./marriage",
  "طلاق": "./divorce",
  "divorce": "./divorce",
  "حب": "./love",
  "love": "./love",
  "خطبة": "./khotba",
  "khotba": "./khotba",
  "كذب": "./kizb",
  "kizb": "./kizb"
});

function getCommandName(message) {
  if (typeof message !== "string") return null;
  const match = message.trim().match(/^\.(\S+)/u);
  return match ? match[1] : null;
}

function resolveCommandFile(commandName) {
  return COMMAND_MODULES[commandName] || null;
}

function loadCommand(commandName) {
  const modulePath = resolveCommandFile(commandName);
  if (!modulePath) return null;

  const command = require(modulePath);
  if (!command || typeof command.execute !== "function") {
    throw new TypeError(`Command module "${modulePath}" must export execute().`);
  }
  return command;
}

function listCommandNames() {
  return ["زواج", "طلاق", "حب", "خطبة", "كذب"];
}

module.exports = {
  getCommandName,
  resolveCommandFile,
  loadCommand,
  listCommandNames
};
