import json

import httpx
import pytest

from app.ai import (
    OPENROUTER_CHAT_URL,
    OPENROUTER_MODEL,
    MissingOpenRouterApiKey,
    OpenRouterRequestError,
    build_chat_request,
    call_openrouter,
    get_openrouter_api_key,
)


def test_get_openrouter_api_key_reads_project_env_file(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path,
) -> None:
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    env_path = tmp_path / ".env"
    env_path.write_text("OPENROUTER_API_KEY=test-key\n", encoding="utf-8")

    assert get_openrouter_api_key(env_path) == "test-key"


def test_build_chat_request_uses_configured_model() -> None:
    request = build_chat_request("2+2")

    assert request == {
        "model": OPENROUTER_MODEL,
        "messages": [{"role": "user", "content": "2+2"}],
    }


def test_call_openrouter_posts_expected_request(monkeypatch: pytest.MonkeyPatch) -> None:
    captured_request = {}
    original_client = httpx.Client

    def handler(request: httpx.Request) -> httpx.Response:
        captured_request["url"] = str(request.url)
        captured_request["authorization"] = request.headers["authorization"]
        captured_request["json"] = json.loads(request.read().decode())
        return httpx.Response(
            200,
            json={"choices": [{"message": {"content": "4"}}]},
        )

    monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
    monkeypatch.setattr(
        httpx,
        "Client",
        lambda **kwargs: original_client(transport=httpx.MockTransport(handler), **kwargs),
    )

    assert call_openrouter("2+2") == "4"
    assert captured_request["url"] == OPENROUTER_CHAT_URL
    assert captured_request["authorization"] == "Bearer test-key"
    assert captured_request["json"] == build_chat_request("2+2")


def test_call_openrouter_requires_api_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    monkeypatch.setattr("app.ai.get_openrouter_api_key", lambda: None)

    with pytest.raises(MissingOpenRouterApiKey, match="OPENROUTER_API_KEY"):
        call_openrouter("2+2")


def test_call_openrouter_rejects_missing_message_content(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    original_client = httpx.Client

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"choices": []})

    monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
    monkeypatch.setattr(
        httpx,
        "Client",
        lambda **kwargs: original_client(transport=httpx.MockTransport(handler), **kwargs),
    )

    with pytest.raises(OpenRouterRequestError, match="missing message content"):
        call_openrouter("2+2")


def test_real_openrouter_connectivity_when_key_is_available() -> None:
    if not get_openrouter_api_key():
        pytest.skip("OPENROUTER_API_KEY is not configured.")

    reply = call_openrouter("2+2")

    assert reply.strip()
