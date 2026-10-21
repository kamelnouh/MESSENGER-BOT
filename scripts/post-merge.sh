#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Dependency installation is currently blocked by the package security firewall.
# Keep these checks local; do not bypass the block or swap out group-chat support.
npm test
node --check bot.js
node --check dataManager.js
