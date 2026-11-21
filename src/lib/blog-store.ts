import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { enqueueJsonWrite } from "./json-write-queue";

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  createdAt: string;
};

export class DuplicateSlugError extends Error {
  constructor(slug: string) {
    super(`duplicate blog slug: ${slug}`);
    this.name = "DuplicateSlugError";
  }
}

export class BlogPostNotFoundError extends Error {
  constructor(id: string) {
    super(`blog post not found: ${id}`);
    this.name = "BlogPostNotFoundError";
  }
}

const storageDir = path.join(process.cwd(), "data");
const storageFile = path.join(storageDir, "blogs.json");

export async function readBlogPosts(): Promise<BlogPost[]> {
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
  return validatePosts(parsed);
}

// Minimal shape validation so a malformed record (e.g. [{}]) is reported as a
// storage error instead of crashing later in sorting or rendering. Records are
// never silently filtered or rewritten; the error propagates to the caller.
function validatePosts(parsed: unknown): BlogPost[] {
  if (!Array.isArray(parsed)) {
    throw new Error(`blog storage file content is not an array: ${storageFile}`);
  }
  for (let index = 0; index < parsed.length; index++) {
    const item: unknown = parsed[index];
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      throw new Error(`blog record ${index} is not an object: ${storageFile}`);
    }
    const { id, slug, title, summary, body, createdAt } = item as Record<string, unknown>;
    if (typeof id !== "string" || id.length === 0) {
      throw new Error(`blog record ${index} has an invalid id: ${storageFile}`);
    }
    if (typeof slug !== "string" || slug.length === 0) {
      throw new Error(`blog record ${index} has an invalid slug: ${storageFile}`);
    }
    if (typeof title !== "string" || title.length === 0) {
      throw new Error(`blog record ${index} has an invalid title: ${storageFile}`);
    }
    if (typeof summary !== "string") {
      throw new Error(`blog record ${index} has an invalid summary: ${storageFile}`);
    }
    if (typeof body !== "string" || body.length === 0) {
      throw new Error(`blog record ${index} has an invalid body: ${storageFile}`);
    }
    if (
      typeof createdAt !== "string" ||
      createdAt.length === 0 ||
      Number.isNaN(Date.parse(createdAt))
    ) {
      throw new Error(`blog record ${index} has an invalid createdAt: ${storageFile}`);
    }
  }
  return parsed as BlogPost[];
}

function isFileNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "ENOENT"
  );
}

export function getBlogPost(slug: string): Promise<BlogPost | undefined> {
  return readBlogPosts().then((posts) =>
    posts.find((post) => post.slug === slug),
  );
}

export function getBlogPostById(id: string): Promise<BlogPost | undefined> {
  return readBlogPosts().then((posts) =>
    posts.find((post) => post.id === id),
  );
}

export function updateBlogPost(
  id: string,
  input: {
    title: string;
    summary: string;
    body: string;
  },
): Promise<BlogPost> {
  // Read-check-write runs inside the shared write queue. The slug, id and
  // createdAt of an existing post are fixed; only title/summary/body change.
  return enqueueJsonWrite(() => doUpdate(id, input));
}

async function doUpdate(
  id: string,
  input: {
    title: string;
    summary: string;
    body: string;
  },
): Promise<BlogPost> {
  const posts = await readBlogPosts();
  const index = posts.findIndex((post) => post.id === id);
  if (index === -1) {
    throw new BlogPostNotFoundError(id);
  }
  const updated: BlogPost = {
    ...posts[index],
    title: input.title,
    summary: input.summary,
    body: input.body,
  };
  posts[index] = updated;
  await fs.mkdir(storageDir, { recursive: true });
  await fs.writeFile(storageFile, JSON.stringify(posts, null, 2), "utf8");
  return updated;
}

export function deleteBlogPost(id: string): Promise<BlogPost> {
  return enqueueJsonWrite(() => doDelete(id));
}

async function doDelete(id: string): Promise<BlogPost> {
  const posts = await readBlogPosts();
  const index = posts.findIndex((post) => post.id === id);
  if (index === -1) {
    throw new BlogPostNotFoundError(id);
  }
  const [removed] = posts.splice(index, 1);
  await fs.mkdir(storageDir, { recursive: true });
  await fs.writeFile(storageFile, JSON.stringify(posts, null, 2), "utf8");
  return removed;
}

export function createBlogPost(input: {
  title: string;
  slug: string;
  summary: string;
  body: string;
}): Promise<BlogPost> {
  // The duplicate check runs inside the same process-wide write queue as the
  // append, so a read-check-write cycle cannot interleave with another create.
  return enqueueJsonWrite(() => doCreate(input));
}

async function doCreate(input: {
  title: string;
  slug: string;
  summary: string;
  body: string;
}): Promise<BlogPost> {
  const posts = await readBlogPosts();
  if (posts.some((post) => post.slug === input.slug)) {
    throw new DuplicateSlugError(input.slug);
  }
  const post: BlogPost = {
    id: randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
  };
  posts.push(post);
  await fs.mkdir(storageDir, { recursive: true });
  await fs.writeFile(storageFile, JSON.stringify(posts, null, 2), "utf8");
  return post;
}
