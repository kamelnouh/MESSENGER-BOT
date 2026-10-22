#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Dependency installation is currently blocked by the package security firewall.
# Keep these checks local; do not bypass the block or swap out group-chat support.
npm test
node --check bot.js
node --check dataManager.js
node --check appstateManager.js
node --check fix-appstate.js
node --check login-with-credentials.js
node --check commands/registry.js
