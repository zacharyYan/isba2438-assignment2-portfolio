"use client";

import type { Dictionary } from "@/lib/i18n";
import {
  plannerStatuses,
  type PlannerFieldErrorKey,
  type PlannerFieldErrors,
  type PlannerItemStatus,
} from "@/lib/planner-validation";

type PlannerDict = Dictionary["planner"];

export type PlannerDraftValues = {
  topic: string;
  targetDate: string;
  notes: string;
  status: PlannerItemStatus;
};

const inputClassName =
  "w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:text-zinc-50 dark:focus:border-zinc-400";

export default function PlannerItemFields({
  idPrefix,
  values,
  errors,
  dict,
  onChange,
}: {
  idPrefix: string;
  values: PlannerDraftValues;
  errors: PlannerFieldErrors;
  dict: PlannerDict;
  onChange: (patch: Partial<PlannerDraftValues>) => void;
}) {
  const errorFor = (field: keyof PlannerFieldErrors) =>
    errors[field] ? dict.errors[errors[field] as PlannerFieldErrorKey] : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`${idPrefix}-topic`}
          className="text-sm font-medium text-zinc-900 dark:text-zinc-50"
        >
          {dict.formTopic}
        </label>
        <input
          id={`${idPrefix}-topic`}
          name="topic"
          type="text"
          value={values.topic}
          placeholder={dict.formTopicPlaceholder}
          onChange={(event) => onChange({ topic: event.target.value })}
          aria-invalid={Boolean(errors.topic)}
          aria-describedby={errors.topic ? `${idPrefix}-topic-error` : undefined}
          className={inputClassName}
        />
        {errors.topic && (
          <p id={`${idPrefix}-topic-error`} className="text-sm text-red-600 dark:text-red-400">
            {errorFor("topic")}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`${idPrefix}-target-date`}
          className="text-sm font-medium text-zinc-900 dark:text-zinc-50"
        >
          {dict.formDate}
        </label>
        <input
          id={`${idPrefix}-target-date`}
          name="targetDate"
          type="date"
          value={values.targetDate}
          onChange={(event) => onChange({ targetDate: event.target.value })}
          aria-invalid={Boolean(errors.targetDate)}
          aria-describedby={errors.targetDate ? `${idPrefix}-target-date-error` : undefined}
          className={inputClassName}
        />
        {errors.targetDate && (
          <p id={`${idPrefix}-target-date-error`} className="text-sm text-red-600 dark:text-red-400">
            {errorFor("targetDate")}
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
          name="status"
          value={values.status}
          onChange={(event) =>
            onChange({ status: event.target.value as PlannerItemStatus })
          }
          className={inputClassName}
        >
          {plannerStatuses.map((status) => (
            <option key={status} value={status}>
              {status === "pending" ? dict.statusPending : dict.statusCompleted}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
