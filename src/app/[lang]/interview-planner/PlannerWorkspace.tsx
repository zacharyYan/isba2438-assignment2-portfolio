"use client";

import { useCallback, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { writePlannerStorage } from "@/lib/planner-storage";
import {
  validatePlannerInput,
  type PlannerFieldErrors,
  type PlannerItem,
} from "@/lib/planner-validation";
import PlannerAddForm from "./PlannerAddForm";
import PlannerCard from "./PlannerCard";
import type { PlannerDraftValues } from "./PlannerItemFields";

type PlannerDict = Dictionary["planner"];

type SaveState =
  | { kind: "idle" }
  | { kind: "saved"; at: string }
  | { kind: "quota-error" }
  | { kind: "save-unavailable" };

const bannerErrorClassName =
  "rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300";

export default function PlannerWorkspace({
  dict,
  initialItems,
  storageAvailable,
  onPersisted,
}: {
  dict: PlannerDict;
  initialItems: PlannerItem[];
  storageAvailable: boolean;
  onPersisted: (items: PlannerItem[]) => void;
}) {
  const [items, setItems] = useState<PlannerItem[]>(initialItems);
  const [snapshot, setSnapshot] = useState<PlannerItem[]>(initialItems);
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>({ kind: "idle" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PlannerDraftValues | null>(null);
  const [editErrors, setEditErrors] = useState<PlannerFieldErrors>({});
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);

  const markChanged = useCallback(() => {
    setDirty(true);
    setSaveState({ kind: "idle" });
  }, []);

  const addItem = useCallback(
    (item: PlannerItem) => {
      setItems((prev) => [...prev, item]);
      markChanged();
    },
    [markChanged],
  );

  const toggleStatus = useCallback(
    (id: string) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: item.status === "completed" ? "pending" : "completed",
              }
            : item,
        ),
      );
      markChanged();
    },
    [markChanged],
  );

  const deleteItem = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((item) => item.id !== id));
      setConfirmingDeleteId(null);
      if (editingId === id) {
        setEditingId(null);
        setDraft(null);
        setEditErrors({});
      }
      markChanged();
    },
    [editingId, markChanged],
  );

  const startEdit = useCallback((item: PlannerItem) => {
    setEditingId(item.id);
    setDraft({
      topic: item.topic,
      targetDate: item.targetDate,
      notes: item.notes,
      status: item.status,
    });
    setEditErrors({});
    setConfirmingDeleteId(null);
  }, []);

  const saveEdit = useCallback(() => {
    if (editingId === null || draft === null) return;
    const errors = validatePlannerInput(draft);
    if (errors.topic || errors.targetDate) {
      setEditErrors(errors);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === editingId
          ? {
              ...item,
              topic: draft.topic.trim(),
              targetDate: draft.targetDate.trim(),
              notes: draft.notes,
              status: draft.status,
            }
          : item,
      ),
    );
    setEditingId(null);
    setDraft(null);
    setEditErrors({});
    markChanged();
  }, [draft, editingId, markChanged]);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setDraft(null);
    setEditErrors({});
  }, []);

  const discard = useCallback(() => {
    setItems(snapshot);
    setDirty(false);
    setEditingId(null);
    setDraft(null);
    setEditErrors({});
    setConfirmingDeleteId(null);
    setConfirmingDiscard(false);
    setSaveState({ kind: "idle" });
  }, [snapshot]);

  const save = useCallback(() => {
    if (!dirty) return;
    const result = writePlannerStorage(items);
    if (result.kind === "saved") {
      setSnapshot(items);
      setDirty(false);
      setSaveState({ kind: "saved", at: new Date().toLocaleTimeString() });
      onPersisted(items);
    } else if (result.kind === "quota") {
      setSaveState({ kind: "quota-error" });
    } else {
      setSaveState({ kind: "save-unavailable" });
    }
  }, [dirty, items, onPersisted]);

  const completedCount = items.filter((item) => item.status === "completed").length;

  return (
    <div className="flex flex-col gap-8">
      {!storageAvailable && (
        <p role="alert" className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
          {dict.storageUnavailable}
        </p>
      )}

      <PlannerAddForm dict={dict} onAdd={addItem} />

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {dict.listTitle}
          </h2>
          {items.length > 0 && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {dict.count
                .replace("{n}", String(items.length))
                .replace("{m}", String(completedCount))}
            </p>
          )}
        </div>

        {storageAvailable && (
          <div className="flex flex-wrap items-center gap-3" aria-live="polite">
            {saveState.kind === "quota-error" && (
              <p role="alert" className={bannerErrorClassName}>
                {dict.quotaError}
              </p>
            )}
            {saveState.kind === "save-unavailable" && (
              <p role="alert" className={bannerErrorClassName}>
                {dict.storageUnavailable}
              </p>
            )}
            {dirty ? (
              <>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  {dict.dirty}
                </p>
                <button
                  type="button"
                  onClick={save}
                  className="flex h-9 w-fit items-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
                >
                  {dict.save}
                </button>
                {confirmingDiscard ? (
                  <>
                    <p className="text-sm text-zinc-900 dark:text-zinc-50">
                      {dict.discardConfirm}
                    </p>
                    <button
                      type="button"
                      onClick={discard}
                      className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 dark:bg-red-900 dark:hover:bg-red-800"
                    >
                      {dict.discard}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDiscard(false)}
                      className="rounded-full border border-zinc-300 px-4 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300"
                    >
                      {dict.cancel}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingDiscard(true)}
                    className="rounded-full border border-zinc-300 px-4 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-zinc-500 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:text-zinc-50"
                  >
                    {dict.discard}
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled
                  className="flex h-9 w-fit cursor-not-allowed items-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-zinc-50 opacity-60 dark:bg-zinc-50 dark:text-zinc-900"
                >
                  {dict.save}
                </button>
                {saveState.kind === "saved" && (
                  <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400">
                    {dict.savedAt.replace("{time}", saveState.at)}
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {items.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">{dict.empty}</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {items.map((item) => (
              <PlannerCard
                key={item.id}
                item={item}
                dict={dict}
                editing={editingId === item.id}
                draft={editingId === item.id ? draft : null}
                editErrors={editErrors}
                confirmingDelete={confirmingDeleteId === item.id}
                onToggleStatus={() => toggleStatus(item.id)}
                onStartEdit={() => startEdit(item)}
                onDraftChange={(patch) =>
                  setDraft((prev) => (prev ? { ...prev, ...patch } : prev))
                }
                onEditSave={saveEdit}
                onEditCancel={cancelEdit}
                onDeleteRequest={() =>
                  setConfirmingDeleteId((prev) =>
                    prev === item.id ? null : item.id,
                  )
                }
                onDeleteConfirm={() => deleteItem(item.id)}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
