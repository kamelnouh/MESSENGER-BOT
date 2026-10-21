#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Install dependencies and repair the lockfile if a merged package.json changed.
npm install --no-audit --no-fund
npm test
node --check bot.js
node --check dataManager.js
