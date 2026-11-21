import { NextResponse } from "next/server";
import {
  createProject,
  DuplicateSlugError,
  listProjects,
} from "@/lib/project-store";
import { parseProjectCreateRequest } from "@/lib/project-request";
import type { ProjectRecord } from "@/lib/project-validation";
import { logApiRequest } from "@/lib/request-log";

const ROUTE = "/api/projects";

export async function GET() {
  let records;
  try {
    records = await listProjects();
  } catch {
    logApiRequest("GET", ROUTE, 500);
    return NextResponse.json({ status: "storage-error" }, { status: 500 });
  }
  logApiRequest("GET", ROUTE, 200);
  return NextResponse.json({ status: "success", projects: records });
}

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    logApiRequest("POST", ROUTE, 400);
    return NextResponse.json(
      { status: "invalid-request", reason: "invalid-json" },
      { status: 400 },
    );
  }

  const parsed = parseProjectCreateRequest(raw);
  if (!parsed.ok) {
    logApiRequest("POST", ROUTE, 400);
    if (parsed.reason === "invalid-fields") {
      return NextResponse.json(
        { status: "validation-error", errors: parsed.errors },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { status: "invalid-request", reason: parsed.reason },
      { status: 400 },
    );
  }

  const values = parsed.values;
  try {
    const project = await createProject(values.slug.trim(), {
      title: values.title as ProjectRecord["title"],
      summary: values.summary as ProjectRecord["summary"],
      description: values.description as ProjectRecord["description"],
      role: values.role as ProjectRecord["role"],
      techStack: (values.techStack as string[]).map((tech) => tech.trim()),
      year: typeof values.year === "string" ? values.year.trim() : undefined,
      links: Array.isArray(values.links)
        ? (values.links as ProjectRecord["links"])
        : undefined,
      featured: values.featured === true,
    });
    logApiRequest("POST", ROUTE, 201);
    return NextResponse.json({ status: "success", project }, { status: 201 });
  } catch (error) {
    if (error instanceof DuplicateSlugError) {
      logApiRequest("POST", ROUTE, 409);
      return NextResponse.json({ status: "duplicate-slug" }, { status: 409 });
    }
    logApiRequest("POST", ROUTE, 500);
    return NextResponse.json({ status: "save-error" }, { status: 500 });
  }
}
