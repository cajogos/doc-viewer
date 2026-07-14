#!/bin/sh
# Fixes ownership of the mounted archive/data directories, then runs the
# server as the target uid so files created in the bind-mounted archive
# belong to the host user. Configure with DOC_VIEWER_UID / DOC_VIEWER_GID.
set -e

TARGET_UID="${DOC_VIEWER_UID:-1000}"
TARGET_GID="${DOC_VIEWER_GID:-1000}"

mkdir -p /app/archive /app/data
chown "$TARGET_UID:$TARGET_GID" /app/archive
chown -R "$TARGET_UID:$TARGET_GID" /app/data

export HOME=/tmp
exec setpriv --reuid "$TARGET_UID" --regid "$TARGET_GID" --clear-groups "$@"
