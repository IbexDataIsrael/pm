import { useState, type FormEvent } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import type { Card } from "@/lib/kanban";
import { CheckIcon, CloseIcon, EditIcon, TrashIcon } from "@/components/icons";

type KanbanCardProps = {
  card: Card;
  onEdit: (title: string, details: string) => void;
  onDelete: (cardId: string) => void;
};

export const KanbanCard = ({ card, onEdit, onDelete }: KanbanCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState({ title: card.title, details: card.details });

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id, disabled: isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const startEditing = () => {
    setDraft({ title: card.title, details: card.details });
    setIsEditing(true);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = draft.title.trim();
    if (!title) {
      return;
    }
    onEdit(title, draft.details.trim());
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <article
        ref={setNodeRef}
        style={style}
        className="rounded-2xl border border-[var(--stroke)] bg-white px-4 py-4 shadow-[0_12px_24px_rgba(3,33,71,0.08)]"
        data-testid={`card-${card.id}`}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            value={draft.title}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, title: event.target.value }))
            }
            className="w-full rounded-xl border border-[var(--stroke)] bg-white px-3 py-2 font-display text-base font-semibold text-[var(--navy-dark)] outline-none transition focus:border-[var(--primary-blue)]"
            aria-label="Card title"
            required
          />
          <textarea
            value={draft.details}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, details: event.target.value }))
            }
            rows={3}
            className="w-full resize-none rounded-xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm text-[var(--gray-text)] outline-none transition focus:border-[var(--primary-blue)]"
            aria-label="Card details"
          />
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--secondary-purple)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:brightness-110"
            >
              <CheckIcon className="h-4 w-4" />
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--stroke)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--gray-text)] transition hover:text-[var(--navy-dark)]"
            >
              <CloseIcon className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </form>
      </article>
    );
  }

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={clsx(
        "group rounded-2xl border border-transparent bg-white px-4 py-3.5 shadow-[0_12px_24px_rgba(3,33,71,0.08)]",
        "transition-all duration-150 hover:border-[var(--stroke)] hover:shadow-[0_16px_30px_rgba(3,33,71,0.12)]",
        isDragging && "opacity-60 shadow-[0_18px_32px_rgba(3,33,71,0.16)]"
      )}
      {...attributes}
      {...listeners}
      data-testid={`card-${card.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-display text-base font-semibold leading-snug text-[var(--navy-dark)]">
          {card.title}
        </h4>
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100">
          <button
            type="button"
            onClick={startEditing}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--gray-text)] transition hover:bg-[var(--surface)] hover:text-[var(--primary-blue)]"
            aria-label={`Edit ${card.title}`}
          >
            <EditIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(card.id)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--gray-text)] transition hover:bg-[var(--surface)] hover:text-[var(--secondary-purple)]"
            aria-label={`Delete ${card.title}`}
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      <p className="mt-1.5 text-sm leading-6 text-[var(--gray-text)]">
        {card.details}
      </p>
    </article>
  );
};
