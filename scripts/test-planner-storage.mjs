#!/usr/bin/env node
// Tests planner-storage behavior against an isolated mock Storage.
// Compiles the planner TS modules to CommonJS in a temp dir using the
// project's own TypeScript, then runs assertions. Exits non-zero on failure.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const tscBin = path.join(projectRoot, "node_modules", "typescript", "bin", "tsc");
const buildDir = fs.mkdtempSync(path.join(os.tmpdir(), "planner-storage-test-"));

function cleanup(code) {
  try {
    fs.rmSync(buildDir, { recursive: true, force: true });
  } catch {}
  process.exit(code);
}

execFileSync(
  process.execPath,
  [
    tscBin,
    "src/lib/planner-validation.ts",
    "src/lib/planner-storage.ts",
    "--outDir",
    buildDir,
    "--module",
    "commonjs",
    "--moduleResolution",
    "node",
    "--target",
    "es2020",
    "--skipLibCheck",
    "--esModuleInterop",
  ],
  { cwd: projectRoot, stdio: "inherit" },
);

const {
  PLANNER_STORAGE_KEY,
  readPlannerStorage,
  writePlannerStorage,
} = require(path.join(buildDir, "planner-storage.js"));

class MockStorage {
  constructor() {
    this.map = new Map();
    this.disabled = false;
    this.quota = false;
  }
  get length() {
    return this.map.size;
  }
  key(index) {
    return Array.from(this.map.keys())[index] ?? null;
  }
  getItem(key) {
    if (this.disabled) throw new DOMException("storage disabled", "SecurityError");
    return this.map.has(key) ? this.map.get(key) : null;
  }
  setItem(key, value) {
    if (this.disabled) throw new DOMException("storage disabled", "SecurityError");
    if (this.quota) {
      throw new DOMException("quota exceeded", "QuotaExceededError");
    }
    this.map.set(key, String(value));
  }
  removeItem(key) {
    if (this.disabled) throw new DOMException("storage disabled", "SecurityError");
    this.map.delete(key);
  }
}

function withStorage(mock) {
  globalThis.window = { localStorage: mock };
}

let failures = 0;
function check(name, actual, expected) {
  const got = JSON.stringify(actual);
  const want = JSON.stringify(expected);
  if (got === want) {
    console.log(`PASS ${name}`);
  } else {
    failures++;
    console.error(`FAIL ${name}: expected ${want}, got ${got}`);
  }
}

const validItem = {
  id: "item-1",
  topic: "System design basics",
  targetDate: "2026-12-01",
  notes: "review caching",
  status: "pending",
};

// 1. Empty storage reads as empty (and writes nothing).
{
  const mock = new MockStorage();
  withStorage(mock);
  check("empty -> empty", readPlannerStorage(), { kind: "empty" });
  check("empty read writes nothing", mock.map.size, 0);
}

// 2. Explicit save writes the versioned payload; read round-trips.
{
  const mock = new MockStorage();
  withStorage(mock);
  check("save valid -> saved", writePlannerStorage([validItem]), { kind: "saved" });
  const raw = JSON.parse(mock.map.get(PLANNER_STORAGE_KEY));
  check("payload has version", raw.version, 1);
  check("payload has items", Array.isArray(raw.items) && raw.items.length, 1);
  check("read round-trip", readPlannerStorage(), { kind: "loaded", items: [validItem] });
}

// 3. Invalid JSON -> corrupt (parse), never an exception.
{
  const mock = new MockStorage();
  withStorage(mock);
  mock.map.set(PLANNER_STORAGE_KEY, "{definitely not json");
  check("bad json -> corrupt parse", readPlannerStorage(), {
    kind: "corrupt",
    reason: "parse",
  });
}

// 4. Bad envelope structure -> corrupt (structure).
const structureCases = [
  ["top-level array", ["nope"]],
  ["missing version", { items: [] }],
  ["wrong version", { version: 2, items: [] }],
  ["items not array", { version: 1, items: "nope" }],
  ["extra top-level key", { version: 1, items: [], extra: true }],
];
for (const [name, payload] of structureCases) {
  const mock = new MockStorage();
  withStorage(mock);
  mock.map.set(PLANNER_STORAGE_KEY, JSON.stringify(payload));
  check(`structure: ${name} -> corrupt`, readPlannerStorage(), {
    kind: "corrupt",
    reason: "structure",
  });
}

// 5. Bad item records -> corrupt (item).
const itemCases = [
  ["bad status", { ...validItem, status: "done" }],
  ["bad date", { ...validItem, targetDate: "2026-02-30" }],
  ["bad date format", { ...validItem, targetDate: "2026/12/01" }],
  ["empty topic", { ...validItem, topic: "   " }],
  ["empty id", { ...validItem, id: "" }],
  ["notes not string", { ...validItem, notes: 42 }],
  ["extra field", { ...validItem, extra: true }],
  ["item is not an object", "nope"],
];
for (const [name, item] of itemCases) {
  const mock = new MockStorage();
  withStorage(mock);
  mock.map.set(PLANNER_STORAGE_KEY, JSON.stringify({ version: 1, items: [item] }));
  check(`item: ${name} -> corrupt`, readPlannerStorage(), {
    kind: "corrupt",
    reason: "item",
  });
}

// 6. Duplicate ids are rejected as corrupt.
{
  const mock = new MockStorage();
  withStorage(mock);
  const second = { ...validItem, topic: "Second item" };
  mock.map.set(
    PLANNER_STORAGE_KEY,
    JSON.stringify({ version: 1, items: [validItem, second] }),
  );
  check("duplicate ids -> corrupt", readPlannerStorage(), {
    kind: "corrupt",
    reason: "duplicate",
  });
}

// 7. Disabled storage on read -> unavailable, no throw.
{
  const mock = new MockStorage();
  mock.disabled = true;
  withStorage(mock);
  check("disabled read -> unavailable", readPlannerStorage(), {
    kind: "unavailable",
  });
}

// 8. Quota failure on write -> quota, input is the caller's to keep.
{
  const mock = new MockStorage();
  withStorage(mock);
  mock.quota = true;
  check("quota write -> quota", writePlannerStorage([validItem]), {
    kind: "quota",
  });
}

// 9. Disabled storage on write -> unavailable, no throw.
{
  const mock = new MockStorage();
  mock.disabled = true;
  withStorage(mock);
  check("disabled write -> unavailable", writePlannerStorage([validItem]), {
    kind: "unavailable",
  });
}

fs.rmSync(buildDir, { recursive: true, force: true });
if (failures > 0) {
  console.error(`${failures} planner-storage assertion(s) failed`);
  cleanup(1);
}
console.log("all planner-storage tests passed");
cleanup(0);
