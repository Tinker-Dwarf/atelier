#!/bin/sh
# Start Atelier (`npm run dev`) for a verification run. Owns 8080.
# Usage (repo root): RUN_ID=… .cursor/skills/verify-atelier/scripts/launch.sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../../.." && pwd)
APP_URL="${ATELIER_URL:-http://127.0.0.1:8080/}"
RUN_ID="${RUN_ID:-$(date -u +%Y%m%dT%H%M%SZ)}"
EVIDENCE_DIR="$REPO_ROOT/artifacts/verify-atelier/$RUN_ID"
PID_FILE="$EVIDENCE_DIR/launch.pid"
LOG_FILE="$EVIDENCE_DIR/dev.log"
CURRENT_FILE="$REPO_ROOT/artifacts/verify-atelier/.current-run"
READY_TIMEOUT="${LAUNCH_TIMEOUT_SECS:-120}"

mkdir -p "$EVIDENCE_DIR"

http_ok() {
  curl -sf -o /dev/null --max-time 2 "$APP_URL"
}

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

port_in_tree() {
  root_pid="$1"
  listener=""
  if command -v ss >/dev/null 2>&1; then
    listener=$(ss -ltnp 2>/dev/null | awk '/:8080 / {print; exit}')
  elif command -v lsof >/dev/null 2>&1; then
    listener=$(lsof -nP -iTCP:8080 -sTCP:LISTEN 2>/dev/null | awk 'NR==2 {print}')
  fi
  [ -n "$listener" ] || return 1
  tree=$(collect_tree "$root_pid")
  for pid in $tree; do
    case "$listener" in
      *pid="$pid"*|*pid=$pid,*|*" $pid "*) return 0 ;;
    esac
  done
  return 1
}

if http_ok; then
  if [ -f "$PID_FILE" ] && pid_alive "$(cat "$PID_FILE")"; then
    printf 'Already launched for RUN_ID=%s pid=%s\n' "$RUN_ID" "$(cat "$PID_FILE")"
    printf '%s\n' "$RUN_ID" > "$CURRENT_FILE"
    exit 0
  fi
  printf 'Refusing to launch: %s already answers and this RUN_ID does not own it.\n' "$APP_URL" >&2
  printf 'Do not double-drive a shared instance. Stop the stranger or pick a different checkout.\n' >&2
  exit 2
fi

cd "$REPO_ROOT"
# New session so the script's exit does not SIGHUP Vite, and cleanup can walk this PID tree.
setsid npm run dev >>"$LOG_FILE" 2>&1 </dev/null &
DEV_PID=$!

printf '%s\n' "$DEV_PID" > "$PID_FILE"
printf '%s\n' "$RUN_ID" > "$CURRENT_FILE"

{
  printf '{\n'
  printf '  "runId": "%s",\n' "$RUN_ID"
  printf '  "pid": %s,\n' "$DEV_PID"
  printf '  "url": "%s",\n' "$APP_URL"
  printf '  "command": "npm run dev",\n'
  printf '  "cwd": "%s",\n' "$REPO_ROOT"
  printf '  "startedAt": "%s"\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  printf '}\n'
} > "$EVIDENCE_DIR/launch.json"

i=0
while [ "$i" -lt "$READY_TIMEOUT" ]; do
  if http_ok; then
    printf 'RUN_ID=%s\n' "$RUN_ID"
    printf 'PID=%s\n' "$DEV_PID"
    printf 'URL=%s\n' "$APP_URL"
    printf 'EVIDENCE=%s\n' "$EVIDENCE_DIR"
    exit 0
  fi
  if ! pid_alive "$DEV_PID"; then
    printf 'npm run dev exited before %s answered. Last log lines:\n' "$APP_URL" >&2
    tail -n 80 "$LOG_FILE" >&2 || true
    exit 1
  fi
  i=$((i + 1))
  sleep 1
done

printf 'Timed out waiting for %s after %ss. Last log lines:\n' "$APP_URL" "$READY_TIMEOUT" >&2
tail -n 80 "$LOG_FILE" >&2 || true
exit 1
