#!/usr/bin/env bash
# Apply EML-001 branded recovery template to hosted Supabase Auth (ADR-018).
# Requires: SUPABASE_ACCESS_TOKEN (https://supabase.com/dashboard/account/tokens)
set -euo pipefail
PROJECT_REF="${SUPABASE_PROJECT_REF:-vahnmcrpnuggxkivynvo}"
TEMPLATE_FILE="${1:-supabase/templates/recovery.html}"
TOKEN="${SUPABASE_ACCESS_TOKEN:-}"
if [[ -z "$TOKEN" ]]; then
  echo "Set SUPABASE_ACCESS_TOKEN then re-run." >&2
  exit 1
fi
HTML=$(python3 - <<PY
import json
from pathlib import Path
print(json.dumps(Path("$TEMPLATE_FILE").read_text()))
PY
)
curl -sS -X PATCH "https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"mailer_subjects_recovery\":\"Reset your My Property Assistant password\",\"mailer_templates_recovery_content\":${HTML}}" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('recovery_subject', d.get('mailer_subjects_recovery')); print('content_len', len(d.get('mailer_templates_recovery_content') or ''))"
echo "Applied Auth recovery template to ${PROJECT_REF}"
