"use client";

import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";
import type { ResourceFieldErrors, ResourceRecord } from "@/lib/resource-validation";
import ResourceItemFields, {
  statusLabel,
  type ResourceDraftValues,
} from "./ResourceItemFields";

type ResourcesDict = Dictionary["resources"];

const statusBadgeClassName: Record<ResourceRecord["readingStatus"], string> = {
  "to-read":
    "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300",
  reading:
    "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  completed:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
};

const buttonClassName =
  "rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-zinc-500 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:text-zinc-50";
const primaryButtonClassName =
  "rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-50 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300";

export default function ResourceCard({
  resource,
  dict,
  editing,
  draft,
  editErrors,
  confirmingDelete,
  disabled,
  onStartEdit,
  onDraftChange,
  onEditSave,
  onEditCancel,
  onDeleteRequest,
  onDeleteConfirm,
}: {
  resource: ResourceRecord;
  dict: ResourcesDict;
  editing: boolean;
  draft: ResourceDraftValues | null;
  editErrors: ResourceFieldErrors;
  confirmingDelete: boolean;
  disabled: boolean;
  onStartEdit: () => void;
  onDraftChange: (patch: Partial<ResourceDraftValues>) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onDeleteRequest: () => void;
  onDeleteConfirm: () => void;
}) {
  if (editing && draft) {
    return (
      <li className="flex flex-col gap-4 rounded-lg border border-zinc-900 p-5 dark:border-zinc-50">
        <ResourceItemFields
          idPrefix="resource-edit"
          values={draft}
          errors={editErrors}
          dict={dict}
          onChange={onDraftChange}
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onEditSave}
            disabled={disabled}
            className={primaryButtonClassName}
          >
            {dict.editSave}
          </button>
          <button type="button" onClick={onEditCancel} disabled={disabled} className={buttonClassName}>
            {dict.cancel}
          </button>
        </div>
      </li>
    );
  }

  return (
    <li
      className={`flex flex-col gap-2 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800 ${
        disabled ? "opacity-60" : ""
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-lg font-semibold text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50"
        >
          {resource.title}
        </Link>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClassName[resource.readingStatus]}`}
        >
          {statusLabel(resource.readingStatus, dict)}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
        <span>{resource.category}</span>
        <span>
          {dict.createdAt}:{" "}
          <time dateTime={resource.createdAt}>
            {resource.createdAt.slice(0, 10)}
          </time>
        </span>
      </div>
      <p className="break-all text-sm text-zinc-600 dark:text-zinc-400">
        {resource.url}
      </p>
      {resource.notes.length > 0 && (
        <p className="whitespace-pre-line text-sm text-zinc-600 dark:text-zinc-400">
          {resource.notes}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button type="button" onClick={onStartEdit} disabled={disabled} className={buttonClassName}>
          {dict.edit}
        </button>
        {confirmingDelete ? (
          <>
            <button
              type="button"
              onClick={onDeleteConfirm}
              disabled={disabled}
              className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-red-900 dark:hover:bg-red-800"
            >
              {dict.deleteConfirm}
            </button>
            <button type="button" onClick={onDeleteRequest} disabled={disabled} className={buttonClassName}>
              {dict.cancel}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onDeleteRequest}
            disabled={disabled}
            className="rounded-full border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
          >
            {dict.delete}
          </button>
        )}
      </div>
    </li>
  );
}
