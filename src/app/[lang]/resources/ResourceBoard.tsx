"use client";

import { useCallback, useEffect, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import {
  validateResourceInput,
  type ResourceFieldErrors,
  type ResourceRecord,
} from "@/lib/resource-validation";
import ResourceAddForm from "./ResourceAddForm";
import ResourceCard from "./ResourceCard";
import type { ResourceDraftValues } from "./ResourceItemFields";

type ResourcesDict = Dictionary["resources"];

type LoadState =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready" };

type Feedback =
  | { kind: "idle" }
  | { kind: "added" }
  | { kind: "updated" }
  | { kind: "deleted" }
  | { kind: "stale" }
  | { kind: "save-error" }
  | { kind: "network-error" }
  | { kind: "invalid-request" };

const bannerErrorClassName =
  "rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300";
const bannerSuccessClassName =
  "rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300";

async function parseErrorBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function isFieldErrors(value: unknown): value is ResourceFieldErrors {
  if (typeof value !== "object" || value === null) return false;
  const known: string[] = [
    "titleEmpty",
    "urlEmpty",
    "urlFormat",
    "categoryEmpty",
    "readingStatusInvalid",
  ];
  return Object.values(value as Record<string, unknown>).every(
    (key) => typeof key === "string" && known.includes(key),
  );
}

export default function ResourceBoard({ dict }: { dict: ResourcesDict }) {
  const [loadState, setLoadState] = useState<LoadState>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [resources, setResources] = useState<ResourceRecord[]>([]);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>({ kind: "idle" });
  const [addErrors, setAddErrors] = useState<ResourceFieldErrors>({});
  const [formResetToken, setFormResetToken] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ResourceDraftValues | null>(null);
  const [editErrors, setEditErrors] = useState<ResourceFieldErrors>({});
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/resources")
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok || !data || data.status !== "success") {
          throw new Error("list request failed");
        }
        return data;
      })
      .then((data: { resources: ResourceRecord[] }) => {
        if (cancelled) return;
        if (!Array.isArray(data.resources)) throw new Error("bad list shape");
        setResources(data.resources);
        setLoadState({ kind: "ready" });
      })
      .catch(() => {
        if (!cancelled) setLoadState({ kind: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retryLoad = useCallback(() => {
    setLoadState({ kind: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  const startEdit = useCallback((resource: ResourceRecord) => {
    setEditingId(resource.id);
    setDraft({
      title: resource.title,
      url: resource.url,
      category: resource.category,
      notes: resource.notes,
      readingStatus: resource.readingStatus,
    });
    setEditErrors({});
    setConfirmingDeleteId(null);
    setFeedback({ kind: "idle" });
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setDraft(null);
    setEditErrors({});
  }, []);

  const handleAdd = useCallback(
    async (values: ResourceDraftValues) => {
      setPending(true);
      setFeedback({ kind: "idle" });
      let response: Response;
      try {
        response = await fetch("/api/resources", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(values),
        });
      } catch {
        setFeedback({ kind: "network-error" });
        setPending(false);
        return;
      }
      const data = await parseErrorBody(response);
      if (response.status === 201 && data && (data as { status?: string }).status === "success") {
        const created = (data as { resource: ResourceRecord }).resource;
        setResources((prev) => [...prev, created]);
        setAddErrors({});
        setFormResetToken((n) => n + 1);
        setFeedback({ kind: "added" });
        setPending(false);
        return;
      }
      if (
        response.status === 400 &&
        data &&
        (data as { status?: string }).status === "validation-error" &&
        isFieldErrors((data as { errors: unknown }).errors)
      ) {
        setAddErrors((data as { errors: ResourceFieldErrors }).errors);
        setPending(false);
        return;
      }
      if (response.status === 400) {
        setFeedback({ kind: "invalid-request" });
        setPending(false);
        return;
      }
      setFeedback({ kind: "save-error" });
      setPending(false);
    },
    [],
  );

  const handleEditSave = useCallback(async () => {
    if (editingId === null || draft === null) return;
    const clientErrors = validateResourceInput(draft);
    if (
      clientErrors.title ||
      clientErrors.url ||
      clientErrors.category ||
      clientErrors.readingStatus
    ) {
      setEditErrors(clientErrors);
      return;
    }
    setPending(true);
    setFeedback({ kind: "idle" });
    let response: Response;
    try {
      response = await fetch(`/api/resources/${encodeURIComponent(editingId)}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft),
      });
    } catch {
      setFeedback({ kind: "network-error" });
      setPending(false);
      return;
    }
    const data = await parseErrorBody(response);
    if (response.status === 200 && data && (data as { status?: string }).status === "success") {
      const updated = (data as { resource: ResourceRecord }).resource;
      setResources((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
      setEditingId(null);
      setDraft(null);
      setEditErrors({});
      setFeedback({ kind: "updated" });
      setPending(false);
      return;
    }
    if (response.status === 404) {
      setResources((prev) => prev.filter((item) => item.id !== editingId));
      setEditingId(null);
      setDraft(null);
      setEditErrors({});
      setFeedback({ kind: "stale" });
      setPending(false);
      return;
    }
    if (
      response.status === 400 &&
      data &&
      (data as { status?: string }).status === "validation-error" &&
      isFieldErrors((data as { errors: unknown }).errors)
    ) {
      setEditErrors((data as { errors: ResourceFieldErrors }).errors);
      setPending(false);
      return;
    }
    if (response.status === 400) {
      setFeedback({ kind: "invalid-request" });
      setPending(false);
      return;
    }
    setFeedback({ kind: "save-error" });
    setPending(false);
  }, [draft, editingId]);

  const handleDelete = useCallback(
    async (id: string) => {
      setConfirmingDeleteId(null);
      setPending(true);
      setFeedback({ kind: "idle" });
      let response: Response;
      try {
        response = await fetch(`/api/resources/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
      } catch {
        setFeedback({ kind: "network-error" });
        setPending(false);
        return;
      }
      const data = await parseErrorBody(response);
      if (response.status === 200 && data && (data as { status?: string }).status === "success") {
        setResources((prev) => prev.filter((item) => item.id !== id));
        setFeedback({ kind: "deleted" });
        setPending(false);
        return;
      }
      if (response.status === 404) {
        setResources((prev) => prev.filter((item) => item.id !== id));
        setFeedback({ kind: "stale" });
        setPending(false);
        return;
      }
      setFeedback({ kind: "save-error" });
      setPending(false);
    },
    [],
  );

  if (loadState.kind === "loading") {
    return <p className="text-zinc-600 dark:text-zinc-400">{dict.loading}</p>;
  }
  if (loadState.kind === "error") {
    return (
      <div className="flex flex-col items-start gap-3">
        <p role="alert" className={bannerErrorClassName}>
          {dict.listError}
        </p>
        <button
          type="button"
          onClick={retryLoad}
          className="flex h-10 w-fit items-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {dict.retry}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {feedback.kind === "save-error" && (
        <p role="alert" className={bannerErrorClassName}>
          {dict.saveError}
        </p>
      )}
      {feedback.kind === "network-error" && (
        <p role="alert" className={bannerErrorClassName}>
          {dict.networkError}
        </p>
      )}
      {feedback.kind === "invalid-request" && (
        <p role="alert" className={bannerErrorClassName}>
          {dict.invalidRequest}
        </p>
      )}
      {feedback.kind === "stale" && (
        <p role="status" aria-live="polite" className={bannerSuccessClassName}>
          {dict.staleEntry}
        </p>
      )}
      {feedback.kind === "added" && (
        <p role="status" aria-live="polite" className={bannerSuccessClassName}>
          {dict.added}
        </p>
      )}
      {feedback.kind === "updated" && (
        <p role="status" aria-live="polite" className={bannerSuccessClassName}>
          {dict.updated}
        </p>
      )}
      {feedback.kind === "deleted" && (
        <p role="status" aria-live="polite" className={bannerSuccessClassName}>
          {dict.deleted}
        </p>
      )}

      <ResourceAddForm
        key={formResetToken}
        dict={dict}
        pending={pending}
        serverErrors={addErrors}
        onSubmit={handleAdd}
      />

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {dict.listTitle}
          </h2>
          {resources.length > 0 && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {dict.count.replace("{n}", String(resources.length))}
            </p>
          )}
        </div>

        {resources.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">{dict.empty}</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {resources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                dict={dict}
                editing={editingId === resource.id}
                draft={editingId === resource.id ? draft : null}
                editErrors={editErrors}
                confirmingDelete={confirmingDeleteId === resource.id}
                disabled={pending}
                onStartEdit={() => startEdit(resource)}
                onDraftChange={(patch) =>
                  setDraft((prev) => (prev ? { ...prev, ...patch } : prev))
                }
                onEditSave={handleEditSave}
                onEditCancel={cancelEdit}
                onDeleteRequest={() =>
                  setConfirmingDeleteId((prev) =>
                    prev === resource.id ? null : resource.id,
                  )
                }
                onDeleteConfirm={() => handleDelete(resource.id)}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
