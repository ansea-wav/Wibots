#!/bin/bash
echo "═══════════════════════════════════════════"
echo "  YAY by netals — Startup Script"
echo "═══════════════════════════════════════════"

# Install dependencies jika ada package.json
if [ -f "package.json" ]; then
  echo "[Setup] Installing dependencies..."
  npm install --production
  echo "[Setup] ✓ Dependencies installed!"
else
  echo "[Setup] ⚠ No package.json found!"
  exit 1
fi

echo ""

# Start the bot engine
echo "[Boot] Starting bot engine..."
node index.js
