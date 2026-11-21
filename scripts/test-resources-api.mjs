#!/usr/bin/env node
// Integration tests for /api/resources against an isolated production server.
// The server runs with an explicit child-process cwd (a fresh temp dir), on an
// isolated port. The script first verifies where writes actually land so the
// real project data/ is never touched. Exits non-zero on any failed assertion.
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const projectDataDir = path.join(projectRoot, "data");
const runId = `${process.pid}-${Date.now()}`;
const PORT = 3177;
const BASE = `http://127.0.0.1:${PORT}`;

let server = null;
let serverLogs = "";
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "portfolio-api-test-"));

let failures = 0;
function check(name, condition, detail) {
  if (condition) {
    console.log(`PASS ${name}`);
  } else {
    failures++;
    console.error(`FAIL ${name}${detail ? `: ${detail}` : ""}`);
  }
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function statSnapshot(filePath) {
  try {
    const stat = fs.statSync(filePath);
    return { exists: true, size: stat.size, mtimeMs: stat.mtimeMs };
  } catch {
    return { exists: false, size: 0, mtimeMs: 0 };
  }
}

function dataFileStats() {
  return {
    resources: statSnapshot(path.join(projectDataDir, "resources.json")),
    blogs: statSnapshot(path.join(projectDataDir, "blogs.json")),
    contacts: statSnapshot(path.join(projectDataDir, "contact-messages.json")),
  };
}

function sameSnapshot(a, b) {
  return (
    a.exists === b.exists && a.size === b.size && a.mtimeMs === b.mtimeMs
  );
}

async function isPortFree(port) {
  return new Promise((resolve) => {
    const probe = net.createServer();
    const timer = setTimeout(() => {
      probe.close();
      resolve(false);
    }, 3000);
    probe.once("error", () => {
      clearTimeout(timer);
      resolve(false);
    });
    // net.Server emits "listening" (not "listen"); releasing this probe only
    // ever closes the test's own temporary listener.
    probe.once("listening", () => {
      probe.close(() => {
        clearTimeout(timer);
        resolve(true);
      });
    });
    probe.listen(port, "127.0.0.1");
  });
}

function startServer() {
  const nextBin = path.join(projectRoot, "node_modules", "next", "dist", "bin", "next");
  const child = spawn(
    process.execPath,
    [nextBin, "start", projectRoot, "-H", "127.0.0.1", "-p", String(PORT)],
    {
      cwd: tmpDir,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, NODE_ENV: "production" },
    },
  );
  child.stdout.on("data", (chunk) => {
    serverLogs += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    serverLogs += chunk.toString();
  });
  return child;
}

async function waitForServer(timeoutMs = 45000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`server exited early with code ${server.exitCode}`);
    }
    try {
      const response = await fetch(`${BASE}/api/resources`, {
        signal: AbortSignal.timeout(2000),
      });
      if (response.ok) return;
    } catch {}
    await sleep(500);
  }
  throw new Error("server did not become ready in time");
}

function stopServer() {
  return new Promise((resolve) => {
    if (!server || server.exitCode !== null) return resolve();
    server.once("exit", resolve);
    server.kill("SIGTERM");
    setTimeout(() => {
      if (server.exitCode === null) server.kill("SIGKILL");
      resolve();
    }, 5000);
  });
}

async function main() {
  const statsBefore = dataFileStats();
  check("project data baseline has resources.json", statsBefore.resources.exists);
  check(
    "project resources.json is the seeded 2-record file",
    deepEqual(
      JSON.parse(fs.readFileSync(path.join(projectDataDir, "resources.json"), "utf8")).length,
      2,
    ),
  );

  // Isolated seed: exclusive-create resources.json inside the temp cwd only.
  const seedResult = await new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(projectRoot, "scripts", "seed-resources.mjs")], {
      cwd: tmpDir,
      stdio: "ignore",
    });
    child.on("exit", (code) => resolve(code));
  });
  const tmpResources = path.join(tmpDir, "data", "resources.json");
  check("isolated seed exit 0", seedResult === 0);
  check("isolated seed wrote tmp/data/resources.json", fs.existsSync(tmpResources));
  check(
    "isolated seed file has 2 records",
    JSON.parse(fs.readFileSync(tmpResources, "utf8")).length === 2,
  );
  check(
    "isolated seed created nothing else in tmp/data",
    deepEqual(fs.readdirSync(path.join(tmpDir, "data")), ["resources.json"]),
  );

  if (!(await isPortFree(PORT))) {
    failures++;
    console.error(
      `FAIL port ${PORT} is occupied; refusing to start the isolated server`,
    );
    console.error("ABORT: free the port or change PORT in this script");
    return 1;
  }
  console.log(`PASS port ${PORT} is free`);

  server = startServer();
  await waitForServer();
  console.log("server ready");

  // --- Write landing spot check before trusting any further mutation. ---
  const marker = `LANDING-CHECK-${runId}`;
  const postResponse = await fetch(`${BASE}/api/resources`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title: marker,
      url: "https://example.com/landing-check",
      category: "Docs",
      notes: "",
      readingStatus: "to-read",
    }),
  });
  const postBody = await postResponse.json();
  check("landing POST -> 201", postResponse.status === 201, `got ${postResponse.status}`);
  check(
    "landing POST body shape",
    postBody.status === "success" &&
      typeof postBody.resource?.id === "string" &&
      postBody.resource.title === marker,
  );
  check(
    "write landed in tmp/data (isolated cwd)",
    fs.existsSync(tmpResources) &&
      fs.readFileSync(tmpResources, "utf8").includes(marker),
  );
  const statsAfterLanding = dataFileStats();
  check(
    "project data untouched after landing check",
    Object.keys(statsBefore).every((key) =>
      sameSnapshot(statsBefore[key], statsAfterLanding[key]),
    ),
  );
  if (!fs.existsSync(tmpResources) || !fs.readFileSync(tmpResources, "utf8").includes(marker)) {
    console.error("ABORT: writes did not land in the isolated temp cwd");
    return 1;
  }

  // --- GET list / single ---
  const list1 = await (await fetch(`${BASE}/api/resources`)).json();
  check("GET list -> success with 3 resources", list1.status === "success" && list1.resources.length === 3);

  const createdId = postBody.resource.id;
  const getOne = await fetch(`${BASE}/api/resources/${createdId}`);
  const getOneBody = await getOne.json();
  check("GET /:id -> 200 record", getOne.status === 200 && getOneBody.resource.id === createdId);
  const missing = await fetch(`${BASE}/api/resources/does-not-exist`);
  check("GET unknown id -> 404", missing.status === 404);
  check("404 body shape", deepEqual(await missing.json(), { status: "not-found" }));

  // --- POST validation ---
  async function postRaw(body, headers) {
    return fetch(`${BASE}/api/resources`, {
      method: "POST",
      headers: headers ?? { "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
  }
  const cases = [
    ["missing title key (shape)", { url: "https://a.com", category: "c", readingStatus: "to-read" }, 400, null],
    ["empty title", { title: "  ", url: "https://a.com", category: "c", readingStatus: "to-read" }, 400, { title: "titleEmpty" }],
    ["ftp url", { title: "t", url: "ftp://a.com", category: "c", readingStatus: "to-read" }, 400, { url: "urlFormat" }],
    ["space in url", { title: "t", url: "https://a b.com", category: "c", readingStatus: "to-read" }, 400, { url: "urlFormat" }],
    ["bare url", { title: "t", url: "a.com/x", category: "c", readingStatus: "to-read" }, 400, { url: "urlFormat" }],
    ["bad enum", { title: "t", url: "https://a.com", category: "c", readingStatus: "done" }, 400, { readingStatus: "readingStatusInvalid" }],
    ["empty category", { title: "t", url: "https://a.com", category: " ", readingStatus: "to-read" }, 400, { category: "categoryEmpty" }],
    ["notes number", { title: "t", url: "https://a.com", category: "c", notes: 42, readingStatus: "to-read" }, 400, null],
    ["client id rejected", { id: "x", title: "t", url: "https://a.com", category: "c", readingStatus: "to-read" }, 400, null],
  ];
  const fileLenBefore = fs.statSync(tmpResources).size;
  for (const [name, body, wantStatus, wantErrors] of cases) {
    const response = await postRaw(body);
    const bodyJson = await response.json();
    check(`POST ${name} -> ${wantStatus}`, response.status === wantStatus, `got ${response.status}`);
    if (wantErrors) {
      check(`POST ${name} error keys`, deepEqual(bodyJson.errors, wantErrors), JSON.stringify(bodyJson));
    } else {
      check(`POST ${name} is validation/invalid shape`, bodyJson.status === "validation-error" || bodyJson.status === "invalid-request", JSON.stringify(bodyJson));
    }
  }
  const badJson = await postRaw("{not json");
  check("POST invalid json -> 400", badJson.status === 400 && (await badJson.json()).reason === "invalid-json");
  check(
    "failed POSTs wrote nothing",
    fs.statSync(tmpResources).size === fileLenBefore,
  );

  // --- PUT update ---
  const putResponse = await fetch(`${BASE}/api/resources/${createdId}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title: `${marker}-updated`,
      url: "https://example.com/updated",
      category: "Docs",
      notes: "updated notes",
      readingStatus: "completed",
    }),
  });
  const putBody = await putResponse.json();
  check("PUT -> 200 updated record", putResponse.status === 200 && putBody.resource.readingStatus === "completed" && putBody.resource.title === `${marker}-updated`);
  check("PUT keeps id and createdAt", putBody.resource.id === createdId && putBody.resource.createdAt === postBody.resource.createdAt);
  const putGet = await fetch(`${BASE}/api/resources/${createdId}`);
  check("GET after PUT reflects update", (await putGet.json()).resource.notes === "updated notes");
  const putUnknown = await fetch(`${BASE}/api/resources/nope`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: "t", url: "https://a.com", category: "c", readingStatus: "to-read" }),
  });
  check("PUT unknown id -> 404", putUnknown.status === 404);
  const putInvalid = await fetch(`${BASE}/api/resources/${createdId}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: "t", url: "ftp://a.com", category: "c", readingStatus: "to-read" }),
  });
  check("PUT invalid url -> 400 urlFormat", putInvalid.status === 400 && (await putInvalid.json()).errors.url === "urlFormat");

  // --- Corrupt file: controlled failure, no silent overwrite ---
  const goodBytes = fs.readFileSync(tmpResources);
  fs.writeFileSync(tmpResources, "corrupt{{{", "utf8");
  const corruptBytes = fs.readFileSync(tmpResources);
  const corruptGet = await fetch(`${BASE}/api/resources`);
  check("GET corrupt file -> 500", corruptGet.status === 500);
  check("500 body shape (no paths/stacks)", deepEqual(await corruptGet.json(), { status: "storage-error" }));
  const corruptPost = await fetch(`${BASE}/api/resources`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: "t", url: "https://a.com", category: "c", readingStatus: "to-read" }),
  });
  check("POST onto corrupt file -> 500", corruptPost.status === 500);
  check(
    "corrupt file bytes unchanged after failed POST",
    Buffer.compare(corruptBytes, fs.readFileSync(tmpResources)) === 0,
  );
  const corruptDelete = await fetch(`${BASE}/api/resources/${createdId}`, { method: "DELETE" });
  check("DELETE on corrupt file -> 500", corruptDelete.status === 500);
  check(
    "corrupt file bytes unchanged after failed DELETE",
    Buffer.compare(corruptBytes, fs.readFileSync(tmpResources)) === 0,
  );
  fs.writeFileSync(tmpResources, goodBytes);

  // --- DELETE ---
  const delResponse = await fetch(`${BASE}/api/resources/${createdId}`, { method: "DELETE" });
  const delBody = await delResponse.json();
  check("DELETE -> 200 JSON", delResponse.status === 200 && delBody.status === "success" && delBody.resource.id === createdId);
  const delAgain = await fetch(`${BASE}/api/resources/${createdId}`, { method: "DELETE" });
  check("second DELETE -> 404", delAgain.status === 404);
  const list2 = await (await fetch(`${BASE}/api/resources`)).json();
  check("list reflects deletion", list2.resources.length === 2 && !list2.resources.some((r) => r.id === createdId));

  // --- zh requests are not redirected (proxy excludes /api) ---
  const zhApi = await fetch(`${BASE}/api/resources`, {
    headers: { "accept-language": "zh-CN,zh;q=0.9" },
    redirect: "manual",
  });
  check("zh Accept-Language on /api is not redirected", zhApi.status === 200);
  const zhPage = await fetch(`${BASE}/zh/resources`, { redirect: "manual" });
  check("zh resources page renders 200", zhPage.status === 200);

  // --- Restart persistence ---
  const persistMarker = `PERSIST-CHECK-${runId}`;
  await fetch(`${BASE}/api/resources`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: persistMarker, url: "https://example.com/persist", category: "Docs", notes: "", readingStatus: "reading" }),
  });
  await stopServer();
  server = startServer();
  await waitForServer();
  const list3 = await (await fetch(`${BASE}/api/resources`)).json();
  check(
    "restart: updates persisted",
    list3.resources.length === 3 && list3.resources.some((r) => r.title === persistMarker),
  );

  // --- Log assertions (method/route/status only, no content) ---
  check("log: POST 201 line present", serverLogs.includes(`[api] POST /api/resources -> 201`));
  check("log: DELETE 200 line present", serverLogs.includes(`[api] DELETE /api/resources/:id -> 200`));
  check("log: PUT 200 line present", serverLogs.includes(`[api] PUT /api/resources/:id -> 200`));
  check("log: GET 500 line present", serverLogs.includes(`[api] GET /api/resources -> 500`));
  check("log: no request bodies leaked (marker absent)", !serverLogs.includes("LANDING-CHECK"));
  check("log: no notes content leaked", !serverLogs.includes("updated notes"));

  // --- Final project data integrity ---
  const statsEnd = dataFileStats();
  check(
    "project data untouched at end",
    Object.keys(statsBefore).every((key) => sameSnapshot(statsBefore[key], statsEnd[key])),
  );

  return failures > 0 ? 1 : 0;
}

main()
  .then(async (code) => {
    await stopServer();
    fs.rmSync(tmpDir, { recursive: true, force: true });
    console.log(code === 0 ? "all resources API tests passed" : `${failures} API test(s) failed`);
    process.exit(code);
  })
  .catch(async (error) => {
    console.error("ABORT:", error);
    await stopServer();
    fs.rmSync(tmpDir, { recursive: true, force: true });
    process.exit(1);
  });
