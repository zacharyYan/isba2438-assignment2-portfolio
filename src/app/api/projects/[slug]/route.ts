import { NextResponse } from "next/server";
import {
  deleteProject,
  getProjectBySlug,
  ProjectNotFoundError,
  updateProject,
} from "@/lib/project-store";
import { parseProjectUpdateRequest } from "@/lib/project-request";
import type { ProjectRecord } from "@/lib/project-validation";
import { logApiRequest } from "@/lib/request-log";

const ROUTE = "/api/projects/:slug";

type Context = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: Context) {
  const { slug } = await context.params;
  let record;
  try {
    record = await getProjectBySlug(slug);
  } catch {
    logApiRequest("GET", ROUTE, 500);
    return NextResponse.json({ status: "storage-error" }, { status: 500 });
  }
  if (!record) {
    logApiRequest("GET", ROUTE, 404);
    return NextResponse.json({ status: "not-found" }, { status: 404 });
  }
  logApiRequest("GET", ROUTE, 200);
  return NextResponse.json({ status: "success", project: record });
}

export async function PUT(request: Request, context: Context) {
  const { slug } = await context.params;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    logApiRequest("PUT", ROUTE, 400);
    return NextResponse.json(
      { status: "invalid-request", reason: "invalid-json" },
      { status: 400 },
    );
  }

  const parsed = parseProjectUpdateRequest(raw);
  if (!parsed.ok) {
    logApiRequest("PUT", ROUTE, 400);
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
    const project = await updateProject(slug, {
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
    logApiRequest("PUT", ROUTE, 200);
    return NextResponse.json({ status: "success", project });
  } catch (error) {
    if (error instanceof ProjectNotFoundError) {
      logApiRequest("PUT", ROUTE, 404);
      return NextResponse.json({ status: "not-found" }, { status: 404 });
    }
    logApiRequest("PUT", ROUTE, 500);
    return NextResponse.json({ status: "save-error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: Context) {
  const { slug } = await context.params;
  try {
    const removed = await deleteProject(slug);
    logApiRequest("DELETE", ROUTE, 200);
    return NextResponse.json({ status: "success", project: removed });
  } catch (error) {
    if (error instanceof ProjectNotFoundError) {
      logApiRequest("DELETE", ROUTE, 404);
      return NextResponse.json({ status: "not-found" }, { status: 404 });
    }
    logApiRequest("DELETE", ROUTE, 500);
    return NextResponse.json({ status: "save-error" }, { status: 500 });
  }
}
