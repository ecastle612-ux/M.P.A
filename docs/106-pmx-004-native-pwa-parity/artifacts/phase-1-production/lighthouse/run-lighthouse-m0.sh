#!/usr/bin/env bash
# M0 Lighthouse runner — requires macOS Google Chrome at default path.
set -euo pipefail
CHROME="${CHROME_PATH:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
OUT_DIR="$(cd "$(dirname "$0")" && pwd)"
URL="${1:-https://www.my-property-assistant.com/login}"
if [[ ! -x "$CHROME" ]]; then
  echo "Chrome not found at: $CHROME" >&2
  echo "Set CHROME_PATH to the Google Chrome binary." >&2
  exit 1
fi
npx --yes lighthouse@12.6.0 "$URL" \
  --chrome-path="$CHROME" \
  --chrome-flags="--headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage" \
  --only-categories=performance,accessibility,best-practices,seo \
  --form-factor=mobile \
  --output=json \
  --output=html \
  --output-path="$OUT_DIR/login"
echo "Wrote $OUT_DIR/login.report.{json,html}"
