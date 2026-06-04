#!/usr/bin/env sh
set -eu

IMAGE_NAME="pm-mvp"
CONTAINER_NAME="pm-mvp"
ENV_ARGS=""

docker build -t "$IMAGE_NAME" .

EXISTING_CONTAINER="$(docker ps -aq --filter "name=^/${CONTAINER_NAME}$")"
if [ -n "$EXISTING_CONTAINER" ]; then
  docker rm -f "$CONTAINER_NAME" >/dev/null
fi

if [ -f ".env" ]; then
  ENV_ARGS="--env-file .env"
fi

docker run -d --name "$CONTAINER_NAME" -p 8000:8000 $ENV_ARGS "$IMAGE_NAME"
printf 'Project Management MVP is running at http://localhost:8000\n'
if [ ! -f ".env" ]; then
  printf 'No .env file found. AI chat requires OPENROUTER_API_KEY to be set.\n'
fi
