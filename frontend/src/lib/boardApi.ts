import type { BoardData } from "@/lib/kanban";

type BoardResponse = {
  board: BoardData;
};

type ErrorResponse = {
  detail?: string;
};

export type AiChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AiChatResponse = {
  message: string;
  boardChanged: boolean;
};

export const fetchBoard = async (): Promise<BoardData> => {
  const response = await fetch("/api/board");

  if (!response.ok) {
    throw new Error("Unable to load board.");
  }

  const data = (await response.json()) as BoardResponse;
  return data.board;
};

export const sendAiChatMessage = async (
  message: string,
  history: AiChatMessage[]
): Promise<AiChatResponse> => {
  const response = await fetch("/api/ai/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, history }),
  });

  if (!response.ok) {
    let detail = "Unable to reach AI assistant.";
    try {
      const error = (await response.json()) as ErrorResponse;
      if (error.detail) {
        detail = error.detail;
      }
    } catch {
      // Keep the generic message when the server does not return JSON.
    }
    throw new Error(detail);
  }

  return (await response.json()) as AiChatResponse;
};

export const saveBoard = async (board: BoardData): Promise<BoardData> => {
  const response = await fetch("/api/board", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ board }),
  });

  if (!response.ok) {
    throw new Error("Unable to save board.");
  }

  const data = (await response.json()) as BoardResponse;
  return data.board;
};
