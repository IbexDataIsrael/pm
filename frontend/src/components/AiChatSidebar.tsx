"use client";

import { FormEvent, useState } from "react";
import { sendAiChatMessage, type AiChatMessage } from "@/lib/boardApi";
import { SendIcon } from "@/components/icons";

type AiChatSidebarProps = {
  onBoardChanged: () => Promise<void>;
};

export const AiChatSidebar = ({ onBoardChanged }: AiChatSidebarProps) => {
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      role: "assistant",
      content: "Ask me to summarize, create, edit, or move cards on this board.",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const message = draft.trim();
    if (!message || isSending) {
      return;
    }

    const nextMessages: AiChatMessage[] = [
      ...messages,
      { role: "user", content: message },
    ];
    setMessages(nextMessages);
    setDraft("");
    setError("");
    setIsSending(true);

    try {
      const response = await sendAiChatMessage(message, messages);
      setMessages([
        ...nextMessages,
        { role: "assistant", content: response.message },
      ]);

      if (response.boardChanged) {
        await onBoardChanged();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "AI chat failed. Try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <aside className="rounded-[32px] border border-[var(--stroke)] bg-white/90 p-5 shadow-[var(--shadow)] backdrop-blur xl:sticky xl:top-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--gray-text)]">
          AI Assistant
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold text-[var(--navy-dark)]">
          Board chat
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--gray-text)]">
          Ask for board updates in plain language. Valid changes refresh the
          Kanban board automatically.
        </p>
      </div>

      <div
        className="mt-5 flex max-h-[460px] flex-col gap-3 overflow-y-auto pr-1"
        aria-live="polite"
      >
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={
              message.role === "user"
                ? "ml-6 rounded-2xl bg-[var(--primary-blue)] px-4 py-3 text-sm leading-6 text-white"
                : "mr-6 rounded-2xl border border-[var(--stroke)] bg-[var(--surface)] px-4 py-3 text-sm leading-6 text-[var(--navy-dark)]"
            }
          >
            {message.content}
          </div>
        ))}
        {isSending ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]">
            Thinking...
          </p>
        ) : null}
      </div>

      <form className="mt-5" onSubmit={handleSubmit}>
        <label
          className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]"
          htmlFor="ai-chat-message"
        >
          Message
        </label>
        <textarea
          id="ai-chat-message"
          className="mt-2 min-h-28 w-full resize-none rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm text-[var(--navy-dark)] outline-none transition focus:border-[var(--primary-blue)]"
          placeholder="Create a card for launch planning..."
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        {error ? (
          <p className="mt-2 text-sm font-semibold text-[var(--secondary-purple)]">
            {error}
          </p>
        ) : null}
        <button
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--secondary-purple)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSending || !draft.trim()}
          type="submit"
        >
          <SendIcon className="h-4 w-4" />
          {isSending ? "Sending..." : "Send"}
        </button>
      </form>
    </aside>
  );
};
