import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { enqueueJsonWrite } from "./json-write-queue";

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  submittedAt: string;
};

export class ContactNotFoundError extends Error {
  constructor(id: string) {
    super(`contact not found: ${id}`);
    this.name = "ContactNotFoundError";
  }
}

const storageDir = path.join(process.cwd(), "data");
const storageFile = path.join(storageDir, "contact-messages.json");

export async function readContactMessages(): Promise<ContactMessage[]> {
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
  return validateMessages(parsed);
}

// Minimal shape validation so a malformed record is reported as a controlled
// storage error instead of crashing list rendering or detail edits later.
// Records are never silently filtered or rewritten.
function validateMessages(parsed: unknown): ContactMessage[] {
  if (!Array.isArray(parsed)) {
    throw new Error("contact storage file content is not an array");
  }
  for (let index = 0; index < parsed.length; index++) {
    const item: unknown = parsed[index];
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      throw new Error(`contact record ${index} is not an object`);
    }
    const { id, name, email, message, submittedAt } = item as Record<string, unknown>;
    if (typeof id !== "string" || id.length === 0) {
      throw new Error(`contact record ${index} has an invalid id`);
    }
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof message !== "string"
    ) {
      throw new Error(`contact record ${index} has invalid fields`);
    }
    if (typeof submittedAt !== "string" || submittedAt.length === 0) {
      throw new Error(`contact record ${index} has an invalid submittedAt`);
    }
  }
  return parsed as ContactMessage[];
}

function isFileNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "ENOENT"
  );
}

export function appendContactMessage(input: {
  name: string;
  email: string;
  message: string;
}): Promise<ContactMessage> {
  return enqueueJsonWrite(() => doAppend(input));
}

async function doAppend(input: {
  name: string;
  email: string;
  message: string;
}): Promise<ContactMessage> {
  const messages = await readContactMessages();
  const message: ContactMessage = {
    id: randomUUID(),
    ...input,
    submittedAt: new Date().toISOString(),
  };
  messages.push(message);
  await fs.mkdir(storageDir, { recursive: true });
  await fs.writeFile(storageFile, JSON.stringify(messages, null, 2), "utf8");
  return message;
}

export function getContactById(id: string): Promise<ContactMessage | undefined> {
  return readContactMessages().then((messages) =>
    messages.find((message) => message.id === id),
  );
}

export function updateContactMessage(
  id: string,
  input: {
    name: string;
    email: string;
    message: string;
  },
): Promise<ContactMessage> {
  // Read-check-write runs inside the shared write queue so it cannot
  // interleave with another mutation on the same file.
  return enqueueJsonWrite(() => doUpdate(id, input));
}

async function doUpdate(
  id: string,
  input: {
    name: string;
    email: string;
    message: string;
  },
): Promise<ContactMessage> {
  const messages = await readContactMessages();
  const index = messages.findIndex((message) => message.id === id);
  if (index === -1) {
    throw new ContactNotFoundError(id);
  }
  const updated: ContactMessage = {
    ...messages[index],
    name: input.name,
    email: input.email,
    message: input.message,
  };
  messages[index] = updated;
  await fs.mkdir(storageDir, { recursive: true });
  await fs.writeFile(storageFile, JSON.stringify(messages, null, 2), "utf8");
  return updated;
}

export function deleteContactMessage(id: string): Promise<ContactMessage> {
  return enqueueJsonWrite(() => doDelete(id));
}

async function doDelete(id: string): Promise<ContactMessage> {
  const messages = await readContactMessages();
  const index = messages.findIndex((message) => message.id === id);
  if (index === -1) {
    throw new ContactNotFoundError(id);
  }
  const [removed] = messages.splice(index, 1);
  await fs.mkdir(storageDir, { recursive: true });
  await fs.writeFile(storageFile, JSON.stringify(messages, null, 2), "utf8");
  return removed;
}
