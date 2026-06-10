"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import clsx from "clsx";
import { AiChatSidebar } from "@/components/AiChatSidebar";
import { KanbanColumn } from "@/components/KanbanColumn";
import { KanbanCardPreview } from "@/components/KanbanCardPreview";
import { BoardIcon } from "@/components/icons";
import { createId, moveCard, type BoardData } from "@/lib/kanban";

type KanbanBoardProps = {
  board: BoardData;
  onBoardChange: (board: BoardData) => void;
  onAiBoardChange?: () => Promise<void>;
  onLogout?: () => void;
  saveStatus?: "idle" | "saving" | "error";
};

export const KanbanBoard = ({
  board,
  onBoardChange,
  onAiBoardChange,
  onLogout,
  saveStatus = "idle",
}: KanbanBoardProps) => {
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const cardsById = useMemo(() => board.cards, [board.cards]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveCardId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCardId(null);

    if (!over || active.id === over.id) {
      return;
    }

    onBoardChange({
      ...board,
      columns: moveCard(board.columns, active.id as string, over.id as string),
    });
  };

  const handleRenameColumn = (columnId: string, title: string) => {
    onBoardChange({
      ...board,
      columns: board.columns.map((column) =>
        column.id === columnId ? { ...column, title } : column
      ),
    });
  };

  const handleAddCard = (columnId: string, title: string, details: string) => {
    const id = createId("card");
    onBoardChange({
      ...board,
      cards: {
        ...board.cards,
        [id]: { id, title, details: details || "No details yet." },
      },
      columns: board.columns.map((column) =>
        column.id === columnId
          ? { ...column, cardIds: [...column.cardIds, id] }
          : column
      ),
    });
  };

  const handleEditCard = (cardId: string, title: string, details: string) => {
    onBoardChange({
      ...board,
      cards: {
        ...board.cards,
        [cardId]: { ...board.cards[cardId], title, details },
      },
    });
  };

  const handleDeleteCard = (columnId: string, cardId: string) => {
    onBoardChange({
      ...board,
      cards: Object.fromEntries(
        Object.entries(board.cards).filter(([id]) => id !== cardId)
      ),
      columns: board.columns.map((column) =>
        column.id === columnId
          ? {
              ...column,
              cardIds: column.cardIds.filter((id) => id !== cardId),
            }
          : column
      ),
    });
  };

  const activeCard = activeCardId ? cardsById[activeCardId] : null;
  const totalCards = Object.keys(board.cards).length;

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-[420px] -translate-x-1/3 -translate-y-1/3 rounded-full bg-[radial-gradient(circle,_rgba(32,157,215,0.25)_0%,_rgba(32,157,215,0.05)_55%,_transparent_70%)]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[520px] w-[520px] translate-x-1/4 translate-y-1/4 rounded-full bg-[radial-gradient(circle,_rgba(117,57,145,0.18)_0%,_rgba(117,57,145,0.05)_55%,_transparent_75%)]" />

      <main className="relative mx-auto flex min-h-screen w-full max-w-[1760px] flex-col gap-6 px-5 pb-12 pt-8 xl:px-10">
        <header className="flex flex-col gap-5 rounded-[28px] border border-[var(--stroke)] bg-white/80 px-6 py-5 shadow-[var(--shadow)] backdrop-blur xl:px-8">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--navy-dark)] text-[var(--accent-yellow)]">
                <BoardIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[var(--gray-text)]">
                  Single Board Kanban
                </p>
                <h1 className="font-display text-3xl font-semibold leading-tight text-[var(--navy-dark)]">
                  Kanban Studio
                </h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-[var(--stroke)] bg-[var(--surface)] px-4 py-2">
                <span className="text-lg font-semibold text-[var(--primary-blue)]">
                  {totalCards}
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--gray-text)]">
                  cards
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-[var(--stroke)] bg-[var(--surface)] px-4 py-2">
                <span className="text-lg font-semibold text-[var(--secondary-purple)]">
                  {board.columns.length}
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--gray-text)]">
                  columns
                </span>
              </div>
              {saveStatus !== "idle" ? (
                <span
                  className={clsx(
                    "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em]",
                    saveStatus === "saving"
                      ? "bg-[var(--surface)] text-[var(--gray-text)]"
                      : "bg-[var(--secondary-purple)] text-white"
                  )}
                >
                  {saveStatus === "saving" ? "Saving..." : "Save failed"}
                </span>
              ) : null}
              {onLogout ? (
                <button
                  className="rounded-full bg-[var(--secondary-purple)] px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:opacity-90"
                  onClick={onLogout}
                  type="button"
                >
                  Log out
                </button>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {board.columns.map((column) => (
              <div
                key={column.id}
                className="flex items-center gap-2 rounded-full border border-[var(--stroke)] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--navy-dark)]"
              >
                <span className="h-2 w-2 rounded-full bg-[var(--accent-yellow)]" />
                {column.title}
                <span className="text-[var(--gray-text)]">
                  {column.cardIds.length}
                </span>
              </div>
            ))}
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {board.columns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  cards={column.cardIds.map((cardId) => board.cards[cardId])}
                  onRename={handleRenameColumn}
                  onAddCard={handleAddCard}
                  onEditCard={handleEditCard}
                  onDeleteCard={handleDeleteCard}
                />
              ))}
            </section>
            <DragOverlay>
              {activeCard ? (
                <div className="w-[260px]">
                  <KanbanCardPreview card={activeCard} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
          {onAiBoardChange ? (
            <AiChatSidebar onBoardChanged={onAiBoardChange} />
          ) : null}
        </div>
      </main>
    </div>
  );
};
