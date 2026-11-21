#!/usr/bin/env node
// Integration tests for contacts/blogs/projects CRUD against an isolated
// production server (explicit child-process cwd = fresh temp dir, isolated
// port). Verifies the write landing spot first so the real project data/ is
// never touched. Exits non-zero on any failed assertion.
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
const PORT = 3188;
const BASE = `http://127.0.0.1:${PORT}`;
const runId = `${process.pid}${Date.now() % 100000}`;

let server = null;
let serverLogs = "";
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "portfolio-crud-test-"));

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
  return ["resources.json", "blogs.json", "contact-messages.json", "projects.json"].map(
    (name) => statSnapshot(path.join(projectDataDir, name)),
  );
}

function sameSnapshot(a, b) {
  return a.exists === b.exists && a.size === b.size && a.mtimeMs === b.mtimeMs;
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
      const response = await fetch(`${BASE}/api/projects`, {
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

async function seedIsolatedData() {
  const script = (name) => path.join(projectRoot, "scripts", name);
  for (const name of ["seed-blogs.mjs", "seed-projects.mjs"]) {
    const code = await new Promise((resolve) => {
      const child = spawn(process.execPath, [script(name)], {
        cwd: tmpDir,
        stdio: "ignore",
      });
      child.on("exit", resolve);
    });
    if (code !== 0) throw new Error(`${name} exited ${code}`);
  }
  const fakeContacts = [
    { id: "qa-contact-1", name: "QA One", email: "qa.one@example.com", message: "first synthetic message", submittedAt: "2026-11-20T10:00:00.000Z" },
    { id: "qa-contact-2", name: "QA Two", email: "qa.two@example.com", message: "second synthetic message", submittedAt: "2026-11-20T10:05:00.000Z" },
  ];
  fs.writeFileSync(
    path.join(tmpDir, "data", "contact-messages.json"),
    JSON.stringify(fakeContacts, null, 2),
    { flag: "wx" },
  );
}

async function main() {
  const statsBefore = dataFileStats();

  await seedIsolatedData();
  const dataDir = path.join(tmpDir, "data");
  check(
    "isolated data has 4 files",
    deepEqual(fs.readdirSync(dataDir).sort(), [
      "blogs.json",
      "contact-messages.json",
      "projects.json",
    ]),
  );

  if (!(await isPortFree(PORT))) {
    failures++;
    console.error(`FAIL port ${PORT} is occupied; refusing to start`);
    return 1;
  }
  console.log(`PASS port ${PORT} is free`);

  server = startServer();
  await waitForServer();
  console.log("server ready");

  // --- Landing spot check via the legacy contact endpoint ---
  const contactName = `QA Contact ${runId}`;
  const contactEmail = `qa.${runId}@example.com`;
  const landingResponse = await fetch(`${BASE}/api/contact`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: contactName, email: contactEmail, message: "landing check message" }),
  });
  check("legacy POST /api/contact -> 201", landingResponse.status === 201);
  check(
    "write landed in tmp/data (isolated cwd)",
    fs.readFileSync(path.join(dataDir, "contact-messages.json"), "utf8").includes(contactName),
  );
  const statsAfterLanding = dataFileStats();
  check(
    "project data untouched after landing check",
    statsBefore.every((snap, index) => sameSnapshot(snap, statsAfterLanding[index])),
  );

  // --- Contacts: list / create / get / put / delete ---
  const contactsList = await (await fetch(`${BASE}/api/contacts`)).json();
  check("GET /api/contacts -> success with 3 contacts", contactsList.status === "success" && contactsList.contacts.length === 3);
  check(
    "contact list shape keeps id/submittedAt",
    contactsList.contacts.every((c) => c.id && c.submittedAt),
  );

  const canonicalPost = await fetch(`${BASE}/api/contacts`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: `QA Canonical ${runId}`, email: `canon.${runId}@example.com`, message: "canonical create" }),
  });
  const canonicalBody = await canonicalPost.json();
  check("POST /api/contacts -> 201", canonicalPost.status === 201);
  const canonicalId = canonicalBody.contact?.id;
  check("canonical create returns record with id/submittedAt", Boolean(canonicalId && canonicalBody.contact.submittedAt));

  const landingContact = contactsList.contacts.find((c) => c.name === contactName);
  const contactUpdate = await fetch(`${BASE}/api/contacts/${landingContact.id}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: `${contactName} v2`, email: contactEmail, message: "updated message" }),
  });
  const contactUpdateBody = await contactUpdate.json();
  check("PUT /api/contacts/:id -> 200", contactUpdate.status === 200);
  check(
    "contact PUT keeps id and submittedAt",
    contactUpdateBody.contact.id === landingContact.id &&
      contactUpdateBody.contact.submittedAt === landingContact.submittedAt,
  );
  const contactGet = await fetch(`${BASE}/api/contacts/${landingContact.id}`);
  check("GET /api/contacts/:id reflects update", (await contactGet.json()).contact.name === `${contactName} v2`);

  const badEmail = await fetch(`${BASE}/api/contacts/${landingContact.id}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "x", email: "bad email@example.com", message: "m" }),
  });
  check("contact PUT invalid email -> 400 emailWhitespace", badEmail.status === 400 && (await badEmail.json()).errors.email === "emailWhitespace");
  const contactMissing = await fetch(`${BASE}/api/contacts/never-existed`);
  check("GET unknown contact -> 404", contactMissing.status === 404);

  const canonicalDelete = await fetch(`${BASE}/api/contacts/${canonicalId}`, { method: "DELETE" });
  check("DELETE /api/contacts/:id -> 200 JSON", canonicalDelete.status === 200 && (await canonicalDelete.json()).status === "success");
  check("deleted contact -> 404", (await fetch(`${BASE}/api/contacts/${canonicalId}`)).status === 404);

  // --- Blogs: create / duplicate 409 / put / public detail sync / delete ---
  const blogSlug = `qa-blog-${runId}`;
  const blogTitle = `QA Blog ${runId}`;
  const blogPost = await fetch(`${BASE}/api/blogs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: blogTitle, slug: blogSlug, summary: "qa summary", body: "qa body line" }),
  });
  const blogPostBody = await blogPost.json();
  check("POST /api/blogs -> 201", blogPost.status === 201 && blogPostBody.status === "success");
  const blogId = blogPostBody.post.id;
  const blogDuplicate = await fetch(`${BASE}/api/blogs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: "another", slug: blogSlug, body: "body" }),
  });
  check("duplicate blog slug -> 409", blogDuplicate.status === 409);

  const blogUpdatedTitle = `${blogTitle} v2`;
  const blogUpdate = await fetch(`${BASE}/api/blogs/${blogId}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: blogUpdatedTitle, summary: "updated summary", body: "updated body" }),
  });
  const blogUpdateBody = await blogUpdate.json();
  check("PUT /api/blogs/:id -> 200", blogUpdate.status === 200 && blogUpdateBody.post.title === blogUpdatedTitle);
  check(
    "blog PUT keeps slug and createdAt",
    blogUpdateBody.post.slug === blogSlug &&
      blogUpdateBody.post.createdAt === blogPostBody.post.createdAt,
  );
  const blogDetail = await fetch(`${BASE}/en/blogs/${blogSlug}`);
  check("public blog detail reflects update", blogDetail.status === 200 && (await blogDetail.text()).includes(blogUpdatedTitle));
  const blogPutSlug = await fetch(`${BASE}/api/blogs/${blogId}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: "t", body: "b", slug: "new-slug" }),
  });
  check("blog PUT with slug key -> 400", blogPutSlug.status === 400 && (await blogPutSlug.json()).reason === "unexpected-field");
  const blogPutInvalid = await fetch(`${BASE}/api/blogs/${blogId}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: "  ", body: "b" }),
  });
  check("blog PUT empty title -> 400 titleEmpty", blogPutInvalid.status === 400 && (await blogPutInvalid.json()).errors.title === "titleEmpty");
  const blogMissing = await fetch(`${BASE}/api/blogs/never-existed`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: "t", body: "b" }),
  });
  check("blog PUT unknown id -> 404", blogMissing.status === 404);

  // --- Projects: create / duplicate 409 / put / public sync / delete / 404 ---
  const projectSlug = `qa-project-${runId}`;
  const projectTitleZh = `QA 项目 ${runId}`;
  const projectTitleEn = `QA Project ${runId}`;
  const projectBody = {
    title: { zh: projectTitleZh, en: projectTitleEn },
    summary: { zh: "QA 摘要", en: "QA summary" },
    description: { zh: "QA 描述", en: "QA description" },
    role: { zh: "个人", en: "Individual" },
    techStack: ["QA", "Testing"],
    year: "2026",
    links: [{ kind: "source", url: "https://example.com/qa" }],
    featured: true,
  };
  const projectPost = await fetch(`${BASE}/api/projects`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ slug: projectSlug, ...projectBody }),
  });
  const projectPostBody = await projectPost.json();
  check("POST /api/projects -> 201", projectPost.status === 201 && projectPostBody.status === "success");
  const projectDuplicate = await fetch(`${BASE}/api/projects`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ slug: projectSlug, ...projectBody }),
  });
  check("duplicate project slug -> 409", projectDuplicate.status === 409);

  const projectsPage = await fetch(`${BASE}/en/projects`);
  check("public projects list shows new project", projectsPage.status === 200 && (await projectsPage.text()).includes(projectTitleEn));
  const homePage = await fetch(`${BASE}/en`);
  check("home featured shows new featured project", homePage.status === 200 && (await homePage.text()).includes(projectTitleEn));
  const projectDetail = await fetch(`${BASE}/en/projects/${projectSlug}`);
  check("new project detail opens with description", projectDetail.status === 200 && (await projectDetail.text()).includes("QA description"));

  const projectUpdateBody = {
    ...projectBody,
    title: { zh: `${projectTitleZh} 二版`, en: `${projectTitleEn} v2` },
    featured: false,
  };
  const projectUpdate = await fetch(`${BASE}/api/projects/${projectSlug}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(projectUpdateBody),
  });
  const projectUpdateResult = await projectUpdate.json();
  check("valid project PUT -> 200", projectUpdate.status === 200 && projectUpdateResult.status === "success", JSON.stringify(projectUpdateResult).slice(0, 200));
  check("project PUT keeps slug", projectUpdateResult.project?.slug === projectSlug);
  const projectDetailAfter = await fetch(`${BASE}/en/projects/${projectSlug}`);
  const projectDetailAfterText = await projectDetailAfter.text();
  check("public detail shows updated title", projectDetailAfter.status === 200 && projectDetailAfterText.includes(`${projectTitleEn} v2`));
  const homeAfter = await fetch(`${BASE}/en`);
  check("home no longer shows unfeatured project", !(await homeAfter.text()).includes(projectTitleEn));
  const projectsListApi = await fetch(`${BASE}/api/projects`);
  const projectsListBody = await projectsListApi.json();
  check(
    "project list API shows updated title",
    projectsListBody.projects.some((p) => p.title.en === `${projectTitleEn} v2`),
  );

  const projectPutInvalid = await fetch(`${BASE}/api/projects/${projectSlug}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...projectUpdateBody, title: { zh: "  ", en: "x" } }),
  });
  check("project PUT empty zh title -> 400 titleZhEmpty", projectPutInvalid.status === 400 && (await projectPutInvalid.json()).errors.title === "titleZhEmpty");
  const projectPutSlug = await fetch(`${BASE}/api/projects/${projectSlug}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...projectUpdateBody, slug: "other" }),
  });
  check("project PUT with slug key -> 400", projectPutSlug.status === 400 && (await projectPutSlug.json()).reason === "unexpected-field");
  const projectMissing = await fetch(`${BASE}/api/projects/never-existed`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(projectUpdateBody),
  });
  check("project PUT unknown slug -> 404", projectMissing.status === 404);

  const projectDelete = await fetch(`${BASE}/api/projects/${projectSlug}`, { method: "DELETE" });
  check("DELETE /api/projects/:slug -> 200 JSON", projectDelete.status === 200 && (await projectDelete.json()).status === "success");
  const deletedProjectApi = await fetch(`${BASE}/api/projects/${projectSlug}`);
  check("deleted project API -> 404 body", deletedProjectApi.status === 404 && deepEqual(await deletedProjectApi.json(), { status: "not-found" }));
  const projectDetailDeleted = await fetch(`${BASE}/en/projects/${projectSlug}`);
  const deletedDetailText = await projectDetailDeleted.text();
  check(
    "deleted project page renders not-found content",
    (projectDetailDeleted.status === 404 || projectDetailDeleted.status === 200) &&
      deletedDetailText.includes("404 · Project not found"),
    `status ${projectDetailDeleted.status}`,
  );
  check("deleted project page has no deleted content", !deletedDetailText.includes(projectTitleEn));
  const projectsAfterDelete = await (await fetch(`${BASE}/api/projects`)).json();
  check("project list back to 5 after delete", projectsAfterDelete.projects.length === 5);

  // --- Restart persistence ---
  await stopServer();
  server = startServer();
  await waitForServer();
  const blogsAfterRestart = await (await fetch(`${BASE}/api/blogs`)).json();
  check(
    "restart: blog update persisted",
    blogsAfterRestart.posts.some((p) => p.title === blogUpdatedTitle),
  );
  const contactsAfterRestart = await (await fetch(`${BASE}/api/contacts`)).json();
  check(
    "restart: contact update persisted",
    contactsAfterRestart.contacts.some((c) => c.name === `${contactName} v2`),
  );

  // --- Corrupt file protection (projects) ---
  const goodProjectsBytes = fs.readFileSync(path.join(dataDir, "projects.json"));
  fs.writeFileSync(path.join(dataDir, "projects.json"), "corrupt{{{", "utf8");
  const corruptBytes = fs.readFileSync(path.join(dataDir, "projects.json"));
  const corruptGet = await fetch(`${BASE}/api/projects`);
  check("GET corrupt projects -> 500", corruptGet.status === 500);
  check("500 body shape", deepEqual(await corruptGet.json(), { status: "storage-error" }));
  const corruptPost = await fetch(`${BASE}/api/projects`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ slug: "qa-corrupt", ...projectBody }),
  });
  check("POST onto corrupt projects -> 500", corruptPost.status === 500);
  const corruptDelete = await fetch(`${BASE}/api/projects/${blogSlug}`, { method: "DELETE" });
  check("DELETE (projects route) on corrupt file -> 500", corruptDelete.status === 500);
  check(
    "corrupt file bytes unchanged after failed POST/DELETE",
    Buffer.compare(corruptBytes, fs.readFileSync(path.join(dataDir, "projects.json"))) === 0,
  );
  fs.writeFileSync(path.join(dataDir, "projects.json"), goodProjectsBytes);

  // --- Blog delete: API 404 + page not-found content ---
  const blogDelete = await fetch(`${BASE}/api/blogs/${blogId}`, { method: "DELETE" });
  check("DELETE /api/blogs/:id -> 200 JSON", blogDelete.status === 200 && (await blogDelete.json()).status === "success");
  const deletedBlogApi = await fetch(`${BASE}/api/blogs/${blogId}`);
  check("deleted blog API -> 404 body", deletedBlogApi.status === 404 && deepEqual(await deletedBlogApi.json(), { status: "not-found" }));
  const blogDetailDeleted = await fetch(`${BASE}/en/blogs/${blogSlug}`);
  const deletedBlogText = await blogDetailDeleted.text();
  check(
    "deleted blog page renders not-found content",
    (blogDetailDeleted.status === 404 || blogDetailDeleted.status === 200) &&
      deletedBlogText.includes("404 · Post not found"),
    `status ${blogDetailDeleted.status}`,
  );
  check("deleted blog page has no deleted content", !deletedBlogText.includes(blogUpdatedTitle));

  // --- Logs: method/route/status only, no content ---
  check("log: POST /api/contacts -> 201", serverLogs.includes("[api] POST /api/contacts -> 201"));
  check("log: legacy POST /api/contact -> 201", serverLogs.includes("[api] POST /api/contact -> 201"));
  check("log: POST /api/blogs -> 201", serverLogs.includes("[api] POST /api/blogs -> 201"));
  check("log: POST /api/projects -> 201", serverLogs.includes("[api] POST /api/projects -> 201"));
  check("log: PUT /api/projects/:slug -> 200", serverLogs.includes("[api] PUT /api/projects/:slug -> 200"));
  check("log: DELETE /api/projects/:slug -> 200", serverLogs.includes("[api] DELETE /api/projects/:slug -> 200"));
  check("log: DELETE /api/blogs/:id -> 200", serverLogs.includes("[api] DELETE /api/blogs/:id -> 200"));
  check("log: no contact content leaked", !serverLogs.includes(contactName) && !serverLogs.includes(contactEmail));
  check("log: no blog title leaked", !serverLogs.includes(blogTitle));

  // --- zh requests not redirected ---
  const zhApi = await fetch(`${BASE}/api/projects`, {
    headers: { "accept-language": "zh-CN,zh;q=0.9" },
    redirect: "manual",
  });
  check("zh Accept-Language on /api/projects not redirected", zhApi.status === 200);
  const zhManage = await fetch(`${BASE}/zh/manage`, { redirect: "manual" });
  check("zh manage page renders 200", zhManage.status === 200);

  // --- Final real-data integrity ---
  const statsEnd = dataFileStats();
  check(
    "project data untouched at end",
    statsBefore.every((snap, index) => sameSnapshot(snap, statsEnd[index])),
  );

  return failures > 0 ? 1 : 0;
}

main()
  .then(async (code) => {
    await stopServer();
    fs.rmSync(tmpDir, { recursive: true, force: true });
    console.log(code === 0 ? "all CRUD API tests passed" : `${failures} CRUD test(s) failed`);
    process.exit(code);
  })
  .catch(async (error) => {
    console.error("ABORT:", error);
    await stopServer();
    fs.rmSync(tmpDir, { recursive: true, force: true });
    process.exit(1);
  });
