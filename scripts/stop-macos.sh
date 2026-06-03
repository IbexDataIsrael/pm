#!/usr/bin/env sh
set -eu

CONTAINER_NAME="pm-mvp"
EXISTING_CONTAINER="$(docker ps -aq --filter "name=^/${CONTAINER_NAME}$")"

if [ -n "$EXISTING_CONTAINER" ]; then
  docker rm -f "$CONTAINER_NAME" >/dev/null
  printf 'Stopped Project Management MVP.\n'
else
  printf 'Project Management MVP is not running.\n'
fi
