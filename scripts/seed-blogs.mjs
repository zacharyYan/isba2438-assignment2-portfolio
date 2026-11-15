#!/usr/bin/env node
// Initializes data/blogs.json from the committed sample posts.
// Refuses to overwrite any existing file (valid, corrupt, or otherwise).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const target = path.join(process.cwd(), "data", "blogs.json");

if (existsSync(target)) {
  console.error(`Refusing to overwrite existing file: ${target}`);
  console.error("If you really want to start over, delete the file yourself first.");
  process.exit(1);
}

const seedPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "data",
  "blog-seed.json",
);
let posts;
try {
  posts = JSON.parse(readFileSync(seedPath, "utf8"));
} catch (error) {
  console.error(`Seed file is unreadable: ${seedPath}`);
  console.error(String(error));
  process.exit(1);
}
if (!Array.isArray(posts) || posts.length === 0) {
  console.error(`Seed file must contain a non-empty array: ${seedPath}`);
  process.exit(1);
}

mkdirSync(path.dirname(target), { recursive: true });
// Exclusive create: even if two seed runs race past the existsSync check above
// (or another process creates the file in between), only one write can win.
try {
  writeFileSync(target, JSON.stringify(posts, null, 2), { encoding: "utf8", flag: "wx" });
} catch (error) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "EEXIST"
  ) {
    console.error(`Refusing to overwrite existing file: ${target}`);
    console.error("If you really want to start over, delete the file yourself first.");
    process.exit(1);
  }
  throw error;
}
console.log(`Created ${target} with ${posts.length} sample post(s).`);
