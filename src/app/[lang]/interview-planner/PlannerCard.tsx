"use client";

import type { Dictionary } from "@/lib/i18n";
import type {
  PlannerFieldErrors,
  PlannerItem,
} from "@/lib/planner-validation";
import PlannerItemFields, {
  type PlannerDraftValues,
} from "./PlannerItemFields";

type PlannerDict = Dictionary["planner"];

const buttonClassName =
  "rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-zinc-500 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:text-zinc-50";
const primaryButtonClassName =
  "rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-50 transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300";

export default function PlannerCard({
  item,
  dict,
  editing,
  draft,
  editErrors,
  confirmingDelete,
  onToggleStatus,
  onStartEdit,
  onDraftChange,
  onEditSave,
  onEditCancel,
  onDeleteRequest,
  onDeleteConfirm,
}: {
  item: PlannerItem;
  dict: PlannerDict;
  editing: boolean;
  draft: PlannerDraftValues | null;
  editErrors: PlannerFieldErrors;
  confirmingDelete: boolean;
  onToggleStatus: () => void;
  onStartEdit: () => void;
  onDraftChange: (patch: Partial<PlannerDraftValues>) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onDeleteRequest: () => void;
  onDeleteConfirm: () => void;
}) {
  if (editing && draft) {
    return (
      <li className="flex flex-col gap-4 rounded-lg border border-zinc-900 p-5 dark:border-zinc-50">
        <PlannerItemFields
          idPrefix="planner-edit"
          values={draft}
          errors={editErrors}
          dict={dict}
          onChange={onDraftChange}
        />
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={onEditSave} className={primaryButtonClassName}>
            {dict.editSave}
          </button>
          <button type="button" onClick={onEditCancel} className={buttonClassName}>
            {dict.cancel}
          </button>
        </div>
      </li>
    );
  }

  const completed = item.status === "completed";

  return (
    <li
      className={`flex flex-col gap-2 rounded-lg border p-5 ${
        completed
          ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/30"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p
          className={`text-lg font-semibold ${
            completed
              ? "text-zinc-500 line-through dark:text-zinc-500"
              : "text-zinc-900 dark:text-zinc-50"
          }`}
        >
          {item.topic}
        </p>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            completed
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300"
              : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
          }`}
        >
          {completed ? dict.statusCompleted : dict.statusPending}
        </span>
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {dict.formDate}: <time dateTime={item.targetDate}>{item.targetDate}</time>
      </p>
      {item.notes.length > 0 && (
        <p className="whitespace-pre-line text-sm text-zinc-600 dark:text-zinc-400">
          {item.notes}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button type="button" onClick={onToggleStatus} className={buttonClassName}>
          {completed ? dict.markPending : dict.markCompleted}
        </button>
        <button type="button" onClick={onStartEdit} className={buttonClassName}>
          {dict.edit}
        </button>
        {confirmingDelete ? (
          <>
            <button
              type="button"
              onClick={onDeleteConfirm}
              className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 dark:bg-red-900 dark:hover:bg-red-800"
            >
              {dict.deleteConfirm}
            </button>
            <button type="button" onClick={onDeleteRequest} className={buttonClassName}>
              {dict.cancel}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onDeleteRequest}
            className="rounded-full border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
          >
            {dict.delete}
          </button>
        )}
      </div>
    </li>
  );
}
