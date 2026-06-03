#!/usr/bin/env sh
set -eu

IMAGE_NAME="pm-mvp"
CONTAINER_NAME="pm-mvp"

docker build -t "$IMAGE_NAME" .

EXISTING_CONTAINER="$(docker ps -aq --filter "name=^/${CONTAINER_NAME}$")"
if [ -n "$EXISTING_CONTAINER" ]; then
  docker rm -f "$CONTAINER_NAME" >/dev/null
fi

docker run -d --name "$CONTAINER_NAME" -p 8000:8000 "$IMAGE_NAME"
printf 'Project Management MVP is running at http://localhost:8000\n'
