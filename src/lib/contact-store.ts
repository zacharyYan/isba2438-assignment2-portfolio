import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
  submittedAt: string;
};

const storageDir = path.join(process.cwd(), "data");
const storageFile = path.join(storageDir, "contact-messages.json");

let writeQueue: Promise<unknown> = Promise.resolve();

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
  if (!Array.isArray(parsed)) {
    throw new Error(
      `留言存储文件内容异常，应为数组: ${storageFile}`,
    );
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
  const task = writeQueue.then(() => doAppend(input));
  writeQueue = task.catch(() => undefined);
  return task;
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
