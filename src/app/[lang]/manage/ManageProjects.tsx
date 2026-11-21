"use client";

import { useCallback, useEffect, useState } from "react";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { ProjectFieldErrorKey } from "@/lib/project-validation";

type ProjectLink = { kind: "source" | "demo"; url: string };
type Project = {
  slug: string;
  title: { zh: string; en: string };
  summary: { zh: string; en: string };
  description: { zh: string; en: string };
  role: { zh: string; en: string };
  techStack: string[];
  year?: string;
  links?: ProjectLink[];
  featured?: boolean;
};

type FieldErrors = Partial<Record<ProjectFieldErrorKey | string, string>>;

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
  | { kind: "invalid-request" }
  | { kind: "validation-error" };

type FormValues = {
  slug: string;
  titleZh: string;
  titleEn: string;
  summaryZh: string;
  summaryEn: string;
  descriptionZh: string;
  descriptionEn: string;
  roleZh: string;
  roleEn: string;
  tech: string;
  year: string;
  sourceUrl: string;
  demoUrl: string;
  featured: boolean;
};

const bannerErrorClassName =
  "rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300";
const bannerSuccessClassName =
  "rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300";
const inputClassName =
  "w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:text-zinc-50 dark:focus:border-zinc-400";
const smallButtonClassName =
  "rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-zinc-500 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:text-zinc-50";
const dangerButtonClassName =
  "rounded-full bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-red-900 dark:hover:bg-red-800";
const primarySmallClassName =
  "flex h-9 w-fit items-center rounded-full bg-zinc-900 px-4 text-xs font-medium text-zinc-50 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300";

const emptyForm: FormValues = {
  slug: "",
  titleZh: "",
  titleEn: "",
  summaryZh: "",
  summaryEn: "",
  descriptionZh: "",
  descriptionEn: "",
  roleZh: "",
  roleEn: "",
  tech: "",
  year: "",
  sourceUrl: "",
  demoUrl: "",
  featured: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isLocalizedShape(value: unknown): value is { zh: string; en: string } {
  return (
    isRecord(value) &&
    typeof value.zh === "string" &&
    typeof value.en === "string"
  );
}

function isProjectList(value: unknown): value is Project[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        isRecord(item) &&
        typeof item.slug === "string" &&
        isLocalizedShape(item.title) &&
        isLocalizedShape(item.summary) &&
        isLocalizedShape(item.description) &&
        isLocalizedShape(item.role) &&
        Array.isArray(item.techStack),
    )
  );
}

function projectFromValues(values: FormValues) {
  const links: ProjectLink[] = [];
  if (values.sourceUrl.trim().length > 0) {
    links.push({ kind: "source", url: values.sourceUrl.trim() });
  }
  if (values.demoUrl.trim().length > 0) {
    links.push({ kind: "demo", url: values.demoUrl.trim() });
  }
  return {
    ...(values.slug.trim().length > 0 ? { slug: values.slug.trim() } : {}),
    title: { zh: values.titleZh, en: values.titleEn },
    summary: { zh: values.summaryZh, en: values.summaryEn },
    description: { zh: values.descriptionZh, en: values.descriptionEn },
    role: { zh: values.roleZh, en: values.roleEn },
    techStack: values.tech
      .split(",")
      .map((tech) => tech.trim())
      .filter((tech) => tech.length > 0),
    ...(values.year.trim().length > 0 ? { year: values.year.trim() } : {}),
    links,
    featured: values.featured,
  };
}

function valuesFromProject(project: Project): FormValues {
  return {
    slug: project.slug,
    titleZh: project.title.zh,
    titleEn: project.title.en,
    summaryZh: project.summary.zh,
    summaryEn: project.summary.en,
    descriptionZh: project.description.zh,
    descriptionEn: project.description.en,
    roleZh: project.role.zh,
    roleEn: project.role.en,
    tech: project.techStack.join(", "),
    year: project.year ?? "",
    sourceUrl: project.links?.find((link) => link.kind === "source")?.url ?? "",
    demoUrl: project.links?.find((link) => link.kind === "demo")?.url ?? "",
    featured: project.featured === true,
  };
}

export default function ManageProjects({
  dict,
  lang,
}: {
  dict: Dictionary;
  lang: Locale;
}) {
  const manage = dict.manage;
  const [loadState, setLoadState] = useState<LoadState>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>({ kind: "idle" });
  const [formErrors, setFormErrors] = useState<FieldErrors>({});
  const [newValues, setNewValues] = useState<FormValues>(emptyForm);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [draft, setDraft] = useState<FormValues>(emptyForm);
  const [draftErrors, setDraftErrors] = useState<FieldErrors>({});
  const [confirmingDeleteSlug, setConfirmingDeleteSlug] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/projects")
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok || !data || data.status !== "success") {
          throw new Error("list request failed");
        }
        return data;
      })
      .then((data: { projects: unknown }) => {
        if (cancelled) return;
        if (!isProjectList(data.projects)) throw new Error("bad list shape");
        setProjects(data.projects);
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

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFeedback({ kind: "idle" });
    let response: Response;
    try {
      response = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(projectFromValues(newValues)),
      });
    } catch {
      setFeedback({ kind: "network-error" });
      setPending(false);
      return;
    }
    const data = await response.json().catch(() => null);
    if (response.status === 201 && isRecord(data) && data.status === "success") {
      setNewValues(emptyForm);
      setFormErrors({});
      setFeedback({ kind: "added" });
      setPending(false);
      retryLoad();
      return;
    }
    if (response.status === 400 && isRecord(data)) {
      if (data.status === "validation-error") {
        setFormErrors((data.errors ?? {}) as FieldErrors);
        setFeedback({ kind: "validation-error" });
      } else {
        setFeedback({ kind: "invalid-request" });
      }
      setPending(false);
      return;
    }
    setFeedback({ kind: "save-error" });
    setPending(false);
  }

  async function handleEditSave() {
    if (editingSlug === null) return;
    setPending(true);
    setFeedback({ kind: "idle" });
    const body = projectFromValues(draft);
    delete (body as Record<string, unknown>).slug;
    let response: Response;
    try {
      response = await fetch(`/api/projects/${encodeURIComponent(editingSlug)}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      setFeedback({ kind: "network-error" });
      setPending(false);
      return;
    }
    const data = await response.json().catch(() => null);
    if (response.status === 200 && isRecord(data) && data.status === "success") {
      setProjects((prev) =>
        prev.map((item) =>
          item.slug === editingSlug ? (data.project as Project) : item,
        ),
      );
      setEditingSlug(null);
      setDraftErrors({});
      setFeedback({ kind: "updated" });
      setPending(false);
      return;
    }
    if (response.status === 404) {
      setProjects((prev) => prev.filter((item) => item.slug !== editingSlug));
      setEditingSlug(null);
      setFeedback({ kind: "stale" });
      setPending(false);
      return;
    }
    if (response.status === 400 && isRecord(data)) {
      if (data.status === "validation-error") {
        setDraftErrors((data.errors ?? {}) as FieldErrors);
        setFeedback({ kind: "validation-error" });
      } else {
        setFeedback({ kind: "invalid-request" });
      }
      setPending(false);
      return;
    }
    setFeedback({ kind: "save-error" });
    setPending(false);
  }

  async function handleDelete(slug: string) {
    setConfirmingDeleteSlug(null);
    setPending(true);
    setFeedback({ kind: "idle" });
    let response: Response;
    try {
      response = await fetch(`/api/projects/${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });
    } catch {
      setFeedback({ kind: "network-error" });
      setPending(false);
      return;
    }
    if (response.status === 200) {
      setProjects((prev) => prev.filter((item) => item.slug !== slug));
      setFeedback({ kind: "deleted" });
      setPending(false);
      return;
    }
    if (response.status === 404) {
      setProjects((prev) => prev.filter((item) => item.slug !== slug));
      setFeedback({ kind: "stale" });
      setPending(false);
      return;
    }
    setFeedback({ kind: "save-error" });
    setPending(false);
  }

  const errorText = (key: string | undefined) =>
    key ? (dict.manage.errors as Record<string, string>)[key] : undefined;

  function renderFields(
    prefix: string,
    values: FormValues,
    errors: FieldErrors,
    withSlug: boolean,
    onChange: (patch: Partial<FormValues>) => void,
  ) {
    const errorFor = (base: keyof FieldErrors, key: ProjectFieldErrorKey) =>
      errors[base] === key ? key : undefined;
    const localizedError = (
      field: "title" | "summary" | "description" | "role",
      zhKey: ProjectFieldErrorKey,
      enKey: ProjectFieldErrorKey,
    ) => ({
      zh: errorFor(field, zhKey),
      en: errorFor(field, enKey),
    });
    const titleErrors = localizedError("title", "titleZhEmpty", "titleEnEmpty");
    const summaryErrors = localizedError("summary", "summaryZhEmpty", "summaryEnEmpty");
    const descriptionErrors = localizedError("description", "descriptionZhEmpty", "descriptionEnEmpty");
    const roleErrors = localizedError("role", "roleZhEmpty", "roleEnEmpty");

    const field = (
      id: string,
      label: string,
      value: string,
      onInput: (next: string) => void,
      errorKey?: string,
      rows?: number,
    ) => (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {label}
        </label>
        {rows ? (
          <textarea
            id={id}
            rows={rows}
            value={value}
            disabled={pending}
            onChange={(event) => onInput(event.target.value)}
            aria-invalid={Boolean(errorKey)}
            className={inputClassName}
          />
        ) : (
          <input
            id={id}
            type="text"
            value={value}
            disabled={pending}
            onChange={(event) => onInput(event.target.value)}
            aria-invalid={Boolean(errorKey)}
            className={inputClassName}
          />
        )}
        {errorKey && (
          <p className="text-sm text-red-600 dark:text-red-400">{errorText(errorKey)}</p>
        )}
      </div>
    );

    return (
      <div className="flex flex-col gap-4">
        {withSlug && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${prefix}-slug`} className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {manage.formSlug}
            </label>
            <input
              id={`${prefix}-slug`}
              type="text"
              value={values.slug}
              disabled={pending}
              onChange={(event) => onChange({ slug: event.target.value })}
              aria-invalid={Boolean(errors.slug)}
              className={inputClassName}
            />
            {errors.slug && (
              <p className="text-sm text-red-600 dark:text-red-400">{errorText(errors.slug)}</p>
            )}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {field(
            `${prefix}-title-zh`,
            manage.formTitleZh,
            values.titleZh,
            (next) => onChange({ titleZh: next }),
            titleErrors.zh,
          )}
          {field(
            `${prefix}-title-en`,
            manage.formTitleEn,
            values.titleEn,
            (next) => onChange({ titleEn: next }),
            titleErrors.en,
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {field(
            `${prefix}-summary-zh`,
            manage.formSummaryZh,
            values.summaryZh,
            (next) => onChange({ summaryZh: next }),
            summaryErrors.zh,
            2,
          )}
          {field(
            `${prefix}-summary-en`,
            manage.formSummaryEn,
            values.summaryEn,
            (next) => onChange({ summaryEn: next }),
            summaryErrors.en,
            2,
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {field(
            `${prefix}-description-zh`,
            manage.formDescriptionZh,
            values.descriptionZh,
            (next) => onChange({ descriptionZh: next }),
            descriptionErrors.zh,
            4,
          )}
          {field(
            `${prefix}-description-en`,
            manage.formDescriptionEn,
            values.descriptionEn,
            (next) => onChange({ descriptionEn: next }),
            descriptionErrors.en,
            4,
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {field(
            `${prefix}-role-zh`,
            manage.formRoleZh,
            values.roleZh,
            (next) => onChange({ roleZh: next }),
            roleErrors.zh,
          )}
          {field(
            `${prefix}-role-en`,
            manage.formRoleEn,
            values.roleEn,
            (next) => onChange({ roleEn: next }),
            roleErrors.en,
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {field(`${prefix}-tech`, manage.formTech, values.tech, (next) =>
            onChange({ tech: next }),
          )}
          {field(`${prefix}-year`, manage.formYear, values.year, (next) =>
            onChange({ year: next }),
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {field(`${prefix}-source`, manage.formSourceUrl, values.sourceUrl, (next) =>
            onChange({ sourceUrl: next }),
          )}
          {field(`${prefix}-demo`, manage.formDemoUrl, values.demoUrl, (next) =>
            onChange({ demoUrl: next }),
          )}
        </div>
        {errors.techStack && (
          <p className="text-sm text-red-600 dark:text-red-400">{errorText(errors.techStack)}</p>
        )}
        {errors.year && (
          <p className="text-sm text-red-600 dark:text-red-400">{errorText(errors.year)}</p>
        )}
        {errors.links && (
          <p className="text-sm text-red-600 dark:text-red-400">{errorText(errors.links)}</p>
        )}
        {errors.featured && (
          <p className="text-sm text-red-600 dark:text-red-400">{errorText(errors.featured)}</p>
        )}
        <label className="flex w-fit items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
          <input
            type="checkbox"
            checked={values.featured}
            disabled={pending}
            onChange={(event) => onChange({ featured: event.target.checked })}
            className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700"
          />
          {manage.formFeatured}
        </label>
      </div>
    );
  }

  if (loadState.kind === "loading") {
    return (
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {manage.projectsTitle}
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">{manage.loading}</p>
      </section>
    );
  }
  if (loadState.kind === "error") {
    return (
      <section className="flex flex-col items-start gap-3">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {manage.projectsTitle}
        </h2>
        <p role="alert" className={bannerErrorClassName}>
          {manage.listError}
        </p>
        <button type="button" onClick={retryLoad} className={smallButtonClassName}>
          {manage.retry}
        </button>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {manage.projectsTitle}
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {manage.count.replace("{n}", String(projects.length))}
        </p>
      </div>

      {feedback.kind === "added" && (
        <p role="status" aria-live="polite" className={bannerSuccessClassName}>
          {manage.added}
        </p>
      )}
      {feedback.kind === "updated" && (
        <p role="status" aria-live="polite" className={bannerSuccessClassName}>
          {manage.updated}
        </p>
      )}
      {feedback.kind === "deleted" && (
        <p role="status" aria-live="polite" className={bannerSuccessClassName}>
          {manage.deleted}
        </p>
      )}
      {feedback.kind === "stale" && (
        <p role="status" aria-live="polite" className={bannerSuccessClassName}>
          {manage.staleEntry}
        </p>
      )}
      {feedback.kind === "validation-error" && (
        <p role="alert" className={bannerErrorClassName}>
          {manage.validationError}
        </p>
      )}
      {feedback.kind === "invalid-request" && (
        <p role="alert" className={bannerErrorClassName}>
          {manage.invalidRequest}
        </p>
      )}
      {feedback.kind === "save-error" && (
        <p role="alert" className={bannerErrorClassName}>
          {manage.saveError}
        </p>
      )}
      {feedback.kind === "network-error" && (
        <p role="alert" className={bannerErrorClassName}>
          {manage.networkError}
        </p>
      )}

      <form
        onSubmit={handleCreate}
        noValidate
        className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800"
      >
        {renderFields("manage-project-add", newValues, formErrors, true, (patch) =>
          setNewValues((prev) => ({ ...prev, ...patch })),
        )}
        <button
          type="submit"
          disabled={pending}
          className="flex h-10 w-fit items-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {manage.create}
        </button>
      </form>

      {projects.length === 0 ? (
        <p className="text-zinc-600 dark:text-zinc-400">{manage.empty}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {projects.map((project) =>
            editingSlug === project.slug ? (
              <li
                key={project.slug}
                className="flex flex-col gap-4 rounded-lg border border-zinc-900 p-5 dark:border-zinc-50"
              >
                <p className="text-xs text-zinc-500 dark:text-zinc-500">
                  {manage.slugFixed}: {project.slug}
                </p>
                {renderFields("manage-project-edit", draft, draftErrors, false, (patch) =>
                  setDraft((prev) => ({ ...prev, ...patch })),
                )}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleEditSave}
                    disabled={pending}
                    className={primarySmallClassName}
                  >
                    {manage.save}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingSlug(null)}
                    disabled={pending}
                    className={smallButtonClassName}
                  >
                    {manage.cancel}
                  </button>
                </div>
              </li>
            ) : (
              <li
                key={project.slug}
                className={`flex flex-col gap-2 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800 ${
                  pending ? "opacity-60" : ""
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {project.title[lang]}
                  </p>
                  {project.featured && (
                    <span className="rounded-full border border-zinc-300 px-2 py-0.5 text-xs dark:border-zinc-700">
                      {manage.featuredBadge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-500">
                  {project.slug}
                  {project.year ? ` · ${project.year}` : ""}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {project.summary[lang]}
                </p>
                {project.links && project.links.length > 0 && (
                  <ul className="flex flex-wrap gap-3 text-xs">
                    {project.links.map((link) => (
                      <li key={link.kind + link.url}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline underline-offset-4 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                        >
                          {link.kind === "source"
                            ? dict.projects.linkSource
                            : dict.projects.linkDemo}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSlug(project.slug);
                      setDraft(valuesFromProject(project));
                      setDraftErrors({});
                      setConfirmingDeleteSlug(null);
                      setFeedback({ kind: "idle" });
                    }}
                    disabled={pending}
                    className={smallButtonClassName}
                  >
                    {manage.edit}
                  </button>
                  {confirmingDeleteSlug === project.slug ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleDelete(project.slug)}
                        disabled={pending}
                        className={dangerButtonClassName}
                      >
                        {manage.deleteConfirm}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingDeleteSlug(null)}
                        disabled={pending}
                        className={smallButtonClassName}
                      >
                        {manage.cancel}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmingDeleteSlug(project.slug)}
                      disabled={pending}
                      className="rounded-full border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                    >
                      {manage.delete}
                    </button>
                  )}
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </section>
  );
}
