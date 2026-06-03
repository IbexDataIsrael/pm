import type { BoardData } from "@/lib/kanban";

type BoardResponse = {
  board: BoardData;
};

export const fetchBoard = async (): Promise<BoardData> => {
  const response = await fetch("/api/board");

  if (!response.ok) {
    throw new Error("Unable to load board.");
  }

  const data = (await response.json()) as BoardResponse;
  return data.board;
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
