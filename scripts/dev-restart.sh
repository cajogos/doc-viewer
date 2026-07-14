#!/usr/bin/env bash
# Rebuild the doc-viewer image and restart the compose service.
# Use after changes that require a Docker build (source, Dockerfile, deps).
#
# Usage:
#   scripts/dev-restart.sh          rebuild + restart the production service
#   scripts/dev-restart.sh -l       same, then follow the container logs
set -euo pipefail

cd "$(dirname "$0")/.."

FOLLOW_LOGS=false
if [ "${1:-}" = "-l" ] || [ "${1:-}" = "--logs" ]
then
  FOLLOW_LOGS=true
fi

echo ">> Building image..."
docker compose build doc-viewer

echo ">> Restarting container..."
docker compose up -d doc-viewer

docker compose ps doc-viewer

PORT="${DOC_VIEWER_PORT:-8090}"
echo ">> doc-viewer is up on http://localhost:${PORT}"

if [ "$FOLLOW_LOGS" = true ]
then
  docker compose logs -f doc-viewer
fi
