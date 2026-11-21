"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import {
  validatePlannerInput,
  type PlannerFieldErrors,
  type PlannerItem,
} from "@/lib/planner-validation";
import PlannerItemFields, {
  type PlannerDraftValues,
} from "./PlannerItemFields";

type PlannerDict = Dictionary["planner"];

const emptyDraft: PlannerDraftValues = {
  topic: "",
  targetDate: "",
  notes: "",
  status: "pending",
};

export default function PlannerAddForm({
  dict,
  onAdd,
}: {
  dict: PlannerDict;
  onAdd: (item: PlannerItem) => void;
}) {
  const [values, setValues] = useState<PlannerDraftValues>(emptyDraft);
  const [errors, setErrors] = useState<PlannerFieldErrors>({});

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validatePlannerInput(values);
    if (nextErrors.topic || nextErrors.targetDate) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    onAdd({
      id: crypto.randomUUID(),
      topic: values.topic.trim(),
      targetDate: values.targetDate.trim(),
      notes: values.notes,
      status: values.status,
    });
    setValues(emptyDraft);
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800"
    >
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        {dict.formTitle}
      </h2>
      <PlannerItemFields
        idPrefix="planner-add"
        values={values}
        errors={errors}
        dict={dict}
        onChange={(patch) => setValues((prev) => ({ ...prev, ...patch }))}
      />
      <button
        type="submit"
        className="flex h-10 w-fit items-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {dict.add}
      </button>
    </form>
  );
}
