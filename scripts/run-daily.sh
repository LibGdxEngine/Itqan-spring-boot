#!/bin/sh
# Usage: run-daily.sh HH:MM command [args...]
# Runs the command once a day at HH:MM (container time, UTC by default).
# A plain sleep loop instead of crond, which hits setpgid errors in some containers.
set -u

AT="$1"
shift

while true; do
    now=$(date +%s)
    next=$(date -d "$(date +%Y-%m-%d) ${AT}" +%s)
    if [ "$next" -le "$now" ]; then
        next=$((next + 86400))
    fi
    echo "[$(date)] Next run in $((next - now))s: $*"
    sleep $((next - now))
    "$@" || echo "[$(date)] Run failed with exit code $?"
done
