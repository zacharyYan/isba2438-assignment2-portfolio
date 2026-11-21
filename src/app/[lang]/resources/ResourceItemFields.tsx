"use client";

import type { Dictionary } from "@/lib/i18n";
import {
  resourceReadingStatuses,
  type ResourceFieldErrors,
  type ResourceReadingStatus,
} from "@/lib/resource-validation";

type ResourcesDict = Dictionary["resources"];

export type ResourceDraftValues = {
  title: string;
  url: string;
  category: string;
  notes: string;
  readingStatus: ResourceReadingStatus;
};

const inputClassName =
  "w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:text-zinc-50 dark:focus:border-zinc-400";

export function statusLabel(
  status: ResourceReadingStatus,
  dict: ResourcesDict,
): string {
  if (status === "reading") return dict.statusReading;
  if (status === "completed") return dict.statusCompleted;
  return dict.statusToRead;
}

export default function ResourceItemFields({
  idPrefix,
  values,
  errors,
  dict,
  onChange,
}: {
  idPrefix: string;
  values: ResourceDraftValues;
  errors: ResourceFieldErrors;
  dict: ResourcesDict;
  onChange: (patch: Partial<ResourceDraftValues>) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`${idPrefix}-title`}
          className="text-sm font-medium text-zinc-900 dark:text-zinc-50"
        >
          {dict.formTitleLabel}
        </label>
        <input
          id={`${idPrefix}-title`}
          name="title"
          type="text"
          value={values.title}
          onChange={(event) => onChange({ title: event.target.value })}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? `${idPrefix}-title-error` : undefined}
          className={inputClassName}
        />
        {errors.title && (
          <p id={`${idPrefix}-title-error`} className="text-sm text-red-600 dark:text-red-400">
            {dict.errors[errors.title]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`${idPrefix}-url`}
          className="text-sm font-medium text-zinc-900 dark:text-zinc-50"
        >
          {dict.formUrl}
        </label>
        <input
          id={`${idPrefix}-url`}
          name="url"
          type="url"
          value={values.url}
          onChange={(event) => onChange({ url: event.target.value })}
          aria-invalid={Boolean(errors.url)}
          aria-describedby={errors.url ? `${idPrefix}-url-error` : undefined}
          className={inputClassName}
        />
        {errors.url && (
          <p id={`${idPrefix}-url-error`} className="text-sm text-red-600 dark:text-red-400">
            {dict.errors[errors.url]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`${idPrefix}-category`}
          className="text-sm font-medium text-zinc-900 dark:text-zinc-50"
        >
          {dict.formCategory}
        </label>
        <input
          id={`${idPrefix}-category`}
          name="category"
          type="text"
          value={values.category}
          placeholder={dict.formCategoryPlaceholder}
          onChange={(event) => onChange({ category: event.target.value })}
          aria-invalid={Boolean(errors.category)}
          aria-describedby={errors.category ? `${idPrefix}-category-error` : undefined}
          className={inputClassName}
        />
        {errors.category && (
          <p id={`${idPrefix}-category-error`} className="text-sm text-red-600 dark:text-red-400">
            {dict.errors[errors.category]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`${idPrefix}-notes`}
          className="text-sm font-medium text-zinc-900 dark:text-zinc-50"
        >
          {dict.formNotes}
        </label>
        <textarea
          id={`${idPrefix}-notes`}
          name="notes"
          rows={3}
          value={values.notes}
          placeholder={dict.formNotesPlaceholder}
          onChange={(event) => onChange({ notes: event.target.value })}
          className={inputClassName}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`${idPrefix}-status`}
          className="text-sm font-medium text-zinc-900 dark:text-zinc-50"
        >
          {dict.formStatus}
        </label>
        <select
          id={`${idPrefix}-status`}
          name="readingStatus"
          value={values.readingStatus}
          onChange={(event) =>
            onChange({ readingStatus: event.target.value as ResourceReadingStatus })
          }
          className={inputClassName}
        >
          {resourceReadingStatuses.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status, dict)}
            </option>
          ))}
        </select>
        {errors.readingStatus && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {dict.errors[errors.readingStatus]}
          </p>
        )}
      </div>
    </div>
  );
}
