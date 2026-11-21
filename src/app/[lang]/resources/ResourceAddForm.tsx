"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import {
  validateResourceInput,
  type ResourceFieldErrors,
} from "@/lib/resource-validation";
import ResourceItemFields, {
  type ResourceDraftValues,
} from "./ResourceItemFields";

type ResourcesDict = Dictionary["resources"];

const emptyDraft: ResourceDraftValues = {
  title: "",
  url: "",
  category: "",
  notes: "",
  readingStatus: "to-read",
};

export default function ResourceAddForm({
  dict,
  pending,
  serverErrors,
  onSubmit,
}: {
  dict: ResourcesDict;
  pending: boolean;
  serverErrors: ResourceFieldErrors;
  onSubmit: (values: ResourceDraftValues) => void;
}) {
  const [values, setValues] = useState<ResourceDraftValues>(emptyDraft);
  const [clientErrors, setClientErrors] = useState<ResourceFieldErrors>({});

  const errors = { ...clientErrors, ...serverErrors };

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateResourceInput(values);
    if (
      nextErrors.title ||
      nextErrors.url ||
      nextErrors.category ||
      nextErrors.readingStatus
    ) {
      setClientErrors(nextErrors);
      return;
    }
    setClientErrors({});
    onSubmit(values);
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
      <ResourceItemFields
        idPrefix="resource-add"
        values={values}
        errors={errors}
        dict={dict}
        onChange={(patch) => setValues((prev) => ({ ...prev, ...patch }))}
      />
      <button
        type="submit"
        disabled={pending}
        className="flex h-10 w-fit items-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {dict.add}
      </button>
    </form>
  );
}
