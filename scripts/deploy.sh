#!/usr/bin/env bash
# Production deployment runbook for xn--kgbei0hva.com.
# Run on the target server after git pull + .env.production in place.
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -f .env.production ]]; then
    echo "FATAL: .env.production not found. Copy from your secrets store before running." >&2
    exit 1
fi

if [[ ! -s frontend/package.json ]]; then
    echo "FATAL: frontend/ has no package.json — cannot build. Restore the Next.js sources first." >&2
    exit 1
fi

DOMAIN="$(grep '^DOMAIN=' .env.production | cut -d= -f2)"
if [[ -z "${DOMAIN}" ]]; then
    echo "FATAL: DOMAIN not set in .env.production" >&2
    exit 1
fi

echo "==> Verifying DNS for ${DOMAIN}"
RESOLVED="$(getent hosts "${DOMAIN}" | awk '{print $1}' | head -n1 || true)"
PUBLIC_IP="$(curl -fsS https://api.ipify.org || true)"
if [[ -n "${RESOLVED}" && -n "${PUBLIC_IP}" && "${RESOLVED}" != "${PUBLIC_IP}" ]]; then
    echo "WARNING: ${DOMAIN} resolves to ${RESOLVED} but this host appears to be ${PUBLIC_IP}."
    echo "         Let's Encrypt will fail until DNS matches. Continue? [y/N]"
    read -r reply
    [[ "${reply}" =~ ^[Yy]$ ]] || exit 1
fi

echo "==> Pulling base images"
docker compose --env-file .env.production --profile prod pull --ignore-buildable

echo "==> Building application images"
docker compose --env-file .env.production --profile prod build --pull

echo "==> Starting stack"
docker compose --env-file .env.production --profile prod up -d --remove-orphans

echo "==> Waiting for backend health (up to 3 min)"
for i in $(seq 1 36); do
    if docker compose --env-file .env.production --profile prod exec -T backend-prod \
         curl -fsS http://localhost:8080/actuator/health >/dev/null 2>&1; then
        echo "   backend healthy"
        break
    fi
    sleep 5
    if [[ $i -eq 36 ]]; then
        echo "FATAL: backend never reported healthy. Check: docker compose logs backend-prod" >&2
        exit 1
    fi
done

echo "==> Verifying HTTPS from outside the container"
sleep 5
if curl -fsS -o /dev/null -w "%{http_code}\n" "https://${DOMAIN}/" | grep -qE '^(200|301|302|307|308)$'; then
    echo "   https://${DOMAIN} responding"
else
    echo "WARNING: https://${DOMAIN} not responding yet. Caddy may still be provisioning the cert."
    echo "         Tail: docker compose logs -f caddy"
fi

echo "==> Done."
