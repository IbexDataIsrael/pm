"use client";

import { useCallback, useEffect, useState } from "react";
import { KanbanBoard } from "@/components/KanbanBoard";
import { LoginForm } from "@/components/LoginForm";
import { fetchBoard, saveBoard } from "@/lib/boardApi";
import type { BoardData } from "@/lib/kanban";

const SESSION_KEY = "pm-mvp-session";
const USERNAME = "user";
const PASSWORD = "password";

export const AuthenticatedKanban = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [hasLoadedSession, setHasLoadedSession] = useState(false);
  const [board, setBoard] = useState<BoardData | null>(null);
  const [isLoadingBoard, setIsLoadingBoard] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "error">(
    "idle"
  );
  const [loadError, setLoadError] = useState("");

  const loadBoard = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoadingBoard(true);
      setLoadError("");
    }

    try {
      const nextBoard = await fetchBoard();
      setBoard(nextBoard);
    } catch {
      if (showLoading) {
        setLoadError("Unable to load board.");
      }
      throw new Error("Unable to load board.");
    } finally {
      if (showLoading) {
        setIsLoadingBoard(false);
      }
    }
  }, []);

  useEffect(() => {
    setIsSignedIn(window.localStorage.getItem(SESSION_KEY) === USERNAME);
    setHasLoadedSession(true);
  }, []);

  useEffect(() => {
    if (!isSignedIn) {
      setBoard(null);
      setLoadError("");
      setSaveStatus("idle");
      return;
    }

    loadBoard().catch(() => undefined);
  }, [isSignedIn, loadBoard]);

  const handleLogin = (username: string, password: string) => {
    if (username !== USERNAME || password !== PASSWORD) {
      return false;
    }

    window.localStorage.setItem(SESSION_KEY, username);
    setIsSignedIn(true);
    return true;
  };

  const handleLogout = () => {
    window.localStorage.removeItem(SESSION_KEY);
    setIsSignedIn(false);
  };

  const handleBoardChange = (nextBoard: BoardData) => {
    setBoard(nextBoard);
    setSaveStatus("saving");

    saveBoard(nextBoard)
      .then(() => {
        setSaveStatus("idle");
      })
      .catch(() => {
        setSaveStatus("error");
      });
  };

  if (!hasLoadedSession) {
    return null;
  }

  if (!isSignedIn) {
    return <LoginForm onLogin={handleLogin} />;
  }

  if (isLoadingBoard) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 py-12">
        <p className="text-sm font-semibold text-[var(--gray-text)]">
          Loading board...
        </p>
      </main>
    );
  }

  if (loadError || !board) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 py-12">
        <section className="rounded-[32px] border border-[var(--stroke)] bg-white/85 p-8 text-center shadow-[var(--shadow)]">
          <h1 className="font-display text-3xl font-semibold text-[var(--navy-dark)]">
            Board unavailable
          </h1>
          <p className="mt-3 text-sm text-[var(--gray-text)]">
            {loadError || "Unable to load board."}
          </p>
          <button
            className="mt-6 rounded-full bg-[var(--secondary-purple)] px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:opacity-90"
            onClick={handleLogout}
            type="button"
          >
            Log out
          </button>
        </section>
      </main>
    );
  }

  return (
    <KanbanBoard
      board={board}
      onAiBoardChange={() => loadBoard(false)}
      onBoardChange={handleBoardChange}
      onLogout={handleLogout}
      saveStatus={saveStatus}
    />
  );
};
