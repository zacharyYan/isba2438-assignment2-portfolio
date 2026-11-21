import { promises as fs } from "node:fs";
import path from "node:path";
import { enqueueJsonWrite } from "./json-write-queue";
import {
  isProjectRecord,
  type ProjectRecord,
} from "./project-validation";

export class ProjectNotFoundError extends Error {
  constructor(slug: string) {
    super(`project not found: ${slug}`);
    this.name = "ProjectNotFoundError";
  }
}

export class DuplicateSlugError extends Error {
  constructor(slug: string) {
    super(`duplicate project slug: ${slug}`);
    this.name = "DuplicateSlugError";
  }
}

const storageDir = path.join(process.cwd(), "data");
const storageFile = path.join(storageDir, "projects.json");

export async function readProjects(): Promise<ProjectRecord[]> {
  let raw: string;
  try {
    raw = await fs.readFile(storageFile, "utf8");
  } catch (error) {
    if (isFileNotFound(error)) {
      return [];
    }
    throw error;
  }
  const parsed: unknown = JSON.parse(raw);
  return validateRecords(parsed);
}

function validateRecords(parsed: unknown): ProjectRecord[] {
  if (!Array.isArray(parsed)) {
    throw new Error("project storage file content is not an array");
  }
  const seenSlugs = new Set<string>();
  for (let index = 0; index < parsed.length; index++) {
    const item: unknown = parsed[index];
    if (!isProjectRecord(item)) {
      throw new Error(`project record ${index} failed validation`);
    }
    if (seenSlugs.has(item.slug)) {
      throw new Error(`project record ${index} has a duplicate slug`);
    }
    seenSlugs.add(item.slug);
  }
  return parsed;
}

function isFileNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "ENOENT"
  );
}

export function listProjects(): Promise<ProjectRecord[]> {
  return readProjects();
}

export function getProjectBySlug(
  slug: string,
): Promise<ProjectRecord | undefined> {
  return readProjects().then((records) =>
    records.find((record) => record.slug === slug),
  );
}

export function getFeaturedProjects(): Promise<ProjectRecord[]> {
  return readProjects().then((records) =>
    records.filter((record) => record.featured),
  );
}

export type ProjectWriteInput = {
  title: ProjectRecord["title"];
  summary: ProjectRecord["summary"];
  description: ProjectRecord["description"];
  role: ProjectRecord["role"];
  techStack: string[];
  year?: string;
  links?: ProjectRecord["links"];
  featured?: boolean;
};

export function createProject(
  slug: string,
  input: ProjectWriteInput,
): Promise<ProjectRecord> {
  // The duplicate-slug check and the append run inside the same process-wide
  // write queue as the write itself, so a read-check-write cycle cannot
  // interleave with another mutation.
  return enqueueJsonWrite(() => doCreate(slug, input));
}

async function doCreate(
  slug: string,
  input: ProjectWriteInput,
): Promise<ProjectRecord> {
  const records = await readProjects();
  if (records.some((record) => record.slug === slug)) {
    throw new DuplicateSlugError(slug);
  }
  const record: ProjectRecord = {
    slug,
    title: input.title,
    summary: input.summary,
    description: input.description,
    role: input.role,
    techStack: input.techStack,
    ...(input.year ? { year: input.year } : {}),
    ...(input.links && input.links.length > 0 ? { links: input.links } : {}),
    ...(input.featured ? { featured: true } : {}),
  };
  records.push(record);
  await writeRecords(records);
  return record;
}

export function updateProject(
  slug: string,
  input: ProjectWriteInput,
): Promise<ProjectRecord> {
  return enqueueJsonWrite(() => doUpdate(slug, input));
}

async function doUpdate(
  slug: string,
  input: ProjectWriteInput,
): Promise<ProjectRecord> {
  const records = await readProjects();
  const index = records.findIndex((record) => record.slug === slug);
  if (index === -1) {
    throw new ProjectNotFoundError(slug);
  }
  const updated: ProjectRecord = {
    ...records[index],
    title: input.title,
    summary: input.summary,
    description: input.description,
    role: input.role,
    techStack: input.techStack,
    ...(input.year ? { year: input.year } : { year: undefined }),
    ...(input.links && input.links.length > 0
      ? { links: input.links }
      : { links: undefined }),
    ...(input.featured ? { featured: true } : { featured: undefined }),
  };
  records[index] = updated;
  await writeRecords(records);
  return updated;
}

export function deleteProject(slug: string): Promise<ProjectRecord> {
  return enqueueJsonWrite(() => doDelete(slug));
}

async function doDelete(slug: string): Promise<ProjectRecord> {
  const records = await readProjects();
  const index = records.findIndex((record) => record.slug === slug);
  if (index === -1) {
    throw new ProjectNotFoundError(slug);
  }
  const [removed] = records.splice(index, 1);
  await writeRecords(records);
  return removed;
}

async function writeRecords(records: ProjectRecord[]): Promise<void> {
  await fs.mkdir(storageDir, { recursive: true });
  await fs.writeFile(storageFile, JSON.stringify(records, null, 2), "utf8");
}
