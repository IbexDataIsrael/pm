import os
from pathlib import Path
from typing import Any

import httpx


OPENROUTER_MODEL = "openai/gpt-oss-120b"
OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions"
PROJECT_ROOT = Path(__file__).resolve().parents[2]


class MissingOpenRouterApiKey(RuntimeError):
    pass


class OpenRouterRequestError(RuntimeError):
    pass


def get_openrouter_api_key(env_path: Path = PROJECT_ROOT / ".env") -> str | None:
    configured_key = os.environ.get("OPENROUTER_API_KEY")
    if configured_key:
        return configured_key

    if not env_path.is_file():
        return None

    for line in env_path.read_text(encoding="utf-8").splitlines():
        key, separator, value = line.partition("=")
        if separator and key.strip() == "OPENROUTER_API_KEY":
            return value.strip().strip("\"'")

    return None


def build_chat_request(prompt: str) -> dict[str, Any]:
    return build_chat_messages_request([{"role": "user", "content": prompt}])


def build_chat_messages_request(
    messages: list[dict[str, str]],
    *,
    json_response: bool = False,
) -> dict[str, Any]:
    request = {
        "model": OPENROUTER_MODEL,
        "messages": messages,
    }
    if json_response:
        request["response_format"] = {"type": "json_object"}
    return request


def call_openrouter(prompt: str) -> str:
    return call_openrouter_messages([{"role": "user", "content": prompt}])


def call_openrouter_messages(
    messages: list[dict[str, str]],
    *,
    json_response: bool = False,
) -> str:
    api_key = get_openrouter_api_key()
    if not api_key:
        raise MissingOpenRouterApiKey("OPENROUTER_API_KEY is not configured.")

    try:
        with httpx.Client(timeout=30) as client:
            response = client.post(
                OPENROUTER_CHAT_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json=build_chat_messages_request(
                    messages,
                    json_response=json_response,
                ),
            )
            response.raise_for_status()
    except httpx.HTTPError as error:
        raise OpenRouterRequestError("OpenRouter request failed.") from error

    data = response.json()
    try:
        content = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as error:
        raise OpenRouterRequestError("OpenRouter response was missing message content.") from error

    if not isinstance(content, str) or not content.strip():
        raise OpenRouterRequestError("OpenRouter response message content was empty.")

    return content
