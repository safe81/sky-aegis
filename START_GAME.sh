#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Sky Aegis requires Node.js 20 or newer."
  exit 1
fi
if [ ! -f "dist/index.html" ]; then
  echo "Missing dist/index.html. This package is incomplete."
  exit 1
fi
node scripts/serve.mjs dist 4173 --open
