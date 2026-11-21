import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { enqueueJsonWrite } from "./json-write-queue";
import { isResourceRecord, type ResourceRecord } from "./resource-validation";

export class ResourceNotFoundError extends Error {
  constructor(id: string) {
    super(`resource not found: ${id}`);
    this.name = "ResourceNotFoundError";
  }
}

export class DuplicateResourceIdError extends Error {
  constructor(id: string) {
    super(`duplicate resource id: ${id}`);
    this.name = "DuplicateResourceIdError";
  }
}

const storageDir = path.join(process.cwd(), "data");
const storageFile = path.join(storageDir, "resources.json");

export async function readResourceRecords(): Promise<ResourceRecord[]> {
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

function validateRecords(parsed: unknown): ResourceRecord[] {
  if (!Array.isArray(parsed)) {
    throw new Error("resource storage file content is not an array");
  }
  const seenIds = new Set<string>();
  for (let index = 0; index < parsed.length; index++) {
    const item: unknown = parsed[index];
    if (!isResourceRecord(item)) {
      throw new Error(`resource record ${index} failed validation`);
    }
    if (seenIds.has(item.id)) {
      throw new Error(`resource record ${index} has a duplicate id`);
    }
    seenIds.add(item.id);
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

export function listResources(): Promise<ResourceRecord[]> {
  return readResourceRecords();
}

export function getResourceById(id: string): Promise<ResourceRecord | undefined> {
  return readResourceRecords().then((records) =>
    records.find((record) => record.id === id),
  );
}

export function createResource(input: {
  title: string;
  url: string;
  category: string;
  notes: string;
  readingStatus: ResourceRecord["readingStatus"];
}): Promise<ResourceRecord> {
  // The duplicate-id check and the append run inside the same process-wide
  // write queue as the write itself, so a read-check-write cycle cannot
  // interleave with another mutation.
  return enqueueJsonWrite(() => doCreate(input));
}

async function doCreate(input: {
  title: string;
  url: string;
  category: string;
  notes: string;
  readingStatus: ResourceRecord["readingStatus"];
}): Promise<ResourceRecord> {
  const records = await readResourceRecords();
  const record: ResourceRecord = {
    id: randomUUID(),
    title: input.title,
    url: input.url,
    category: input.category,
    notes: input.notes,
    readingStatus: input.readingStatus,
    createdAt: new Date().toISOString(),
  };
  if (records.some((existing) => existing.id === record.id)) {
    throw new DuplicateResourceIdError(record.id);
  }
  records.push(record);
  await writeRecords(records);
  return record;
}

export function updateResource(
  id: string,
  input: {
    title: string;
    url: string;
    category: string;
    notes: string;
    readingStatus: ResourceRecord["readingStatus"];
  },
): Promise<ResourceRecord> {
  return enqueueJsonWrite(() => doUpdate(id, input));
}

async function doUpdate(
  id: string,
  input: {
    title: string;
    url: string;
    category: string;
    notes: string;
    readingStatus: ResourceRecord["readingStatus"];
  },
): Promise<ResourceRecord> {
  const records = await readResourceRecords();
  const index = records.findIndex((record) => record.id === id);
  if (index === -1) {
    throw new ResourceNotFoundError(id);
  }
  const updated: ResourceRecord = {
    ...records[index],
    title: input.title,
    url: input.url,
    category: input.category,
    notes: input.notes,
    readingStatus: input.readingStatus,
  };
  records[index] = updated;
  await writeRecords(records);
  return updated;
}

export function deleteResource(id: string): Promise<ResourceRecord> {
  return enqueueJsonWrite(() => doDelete(id));
}

async function doDelete(id: string): Promise<ResourceRecord> {
  const records = await readResourceRecords();
  const index = records.findIndex((record) => record.id === id);
  if (index === -1) {
    throw new ResourceNotFoundError(id);
  }
  const [removed] = records.splice(index, 1);
  await writeRecords(records);
  return removed;
}

async function writeRecords(records: ResourceRecord[]): Promise<void> {
  await fs.mkdir(storageDir, { recursive: true });
  await fs.writeFile(storageFile, JSON.stringify(records, null, 2), "utf8");
}
