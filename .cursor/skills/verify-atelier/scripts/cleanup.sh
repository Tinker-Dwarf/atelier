#!/bin/sh
# Kill the verification instance recorded in launch.pid. Never deletes evidence.
# Usage (repo root): RUN_ID=… .cursor/skills/verify-atelier/scripts/cleanup.sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../../.." && pwd)
APP_URL="${ATELIER_URL:-http://127.0.0.1:8080/}"

if [ -z "${RUN_ID:-}" ]; then
  CURRENT_FILE="$REPO_ROOT/artifacts/verify-atelier/.current-run"
  if [ -f "$CURRENT_FILE" ]; then
    RUN_ID=$(cat "$CURRENT_FILE")
  else
    printf 'Nothing to clean: RUN_ID unset and no artifacts/verify-atelier/.current-run\n'
    exit 0
  fi
fi

EVIDENCE_DIR="$REPO_ROOT/artifacts/verify-atelier/$RUN_ID"
PID_FILE="$EVIDENCE_DIR/launch.pid"

pid_alive() {
  [ -n "${1:-}" ] && kill -0 "$1" 2>/dev/null
}

collect_tree() {
  pid="$1"
  printf '%s\n' "$pid"
  for child in $(ps -o pid= --ppid "$pid" 2>/dev/null); do
    collect_tree "$child"
  done
}

if [ ! -f "$PID_FILE" ]; then
  printf 'No launch.pid at %s — nothing this run started.\n' "$PID_FILE"
  exit 0
fi

ROOT_PID=$(cat "$PID_FILE")
if ! pid_alive "$ROOT_PID"; then
  printf 'Recorded pid %s already gone. Evidence kept at %s\n' "$ROOT_PID" "$EVIDENCE_DIR"
  exit 0
fi

TREE=$(collect_tree "$ROOT_PID")
for pid in $TREE; do
  kill -TERM "$pid" 2>/dev/null || true
done

n=0
while [ "$n" -lt 20 ]; do
  still=0
  for pid in $TREE; do
    if pid_alive "$pid"; then
      still=1
      break
    fi
  done
  [ "$still" -eq 0 ] && break
  n=$((n + 1))
  sleep 0.25
done

for pid in $TREE; do
  if pid_alive "$pid"; then
    kill -KILL "$pid" 2>/dev/null || true
  fi
done

printf 'Stopped pid tree of %s for RUN_ID=%s\n' "$ROOT_PID" "$RUN_ID"
printf 'Evidence kept at %s\n' "$EVIDENCE_DIR"

if curl -sf -o /dev/null --max-time 2 "$APP_URL"; then
  printf 'WARNING: %s still answers after cleanup. Listener is not this run; not killing it.\n' "$APP_URL" >&2
  exit 3
fi

exit 0
