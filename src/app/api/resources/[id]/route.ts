import { NextResponse } from "next/server";
import {
  deleteResource,
  getResourceById,
  ResourceNotFoundError,
  updateResource,
} from "@/lib/resource-store";
import { parseResourceRequest } from "@/lib/resource-request";
import type { ResourceReadingStatus } from "@/lib/resource-validation";
import { logApiRequest } from "@/lib/request-log";

const ROUTE = "/api/resources/:id";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  let record;
  try {
    record = await getResourceById(id);
  } catch {
    logApiRequest("GET", ROUTE, 500);
    return NextResponse.json({ status: "storage-error" }, { status: 500 });
  }
  if (!record) {
    logApiRequest("GET", ROUTE, 404);
    return NextResponse.json({ status: "not-found" }, { status: 404 });
  }
  logApiRequest("GET", ROUTE, 200);
  return NextResponse.json({ status: "success", resource: record });
}

export async function PUT(request: Request, context: Context) {
  const { id } = await context.params;

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

  const parsed = parseResourceRequest(raw);
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

  try {
    const resource = await updateResource(id, {
      title: parsed.values.title.trim(),
      url: parsed.values.url.trim(),
      category: parsed.values.category.trim(),
      notes: parsed.values.notes,
      readingStatus: parsed.values.readingStatus as ResourceReadingStatus,
    });
    logApiRequest("PUT", ROUTE, 200);
    return NextResponse.json({ status: "success", resource });
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      logApiRequest("PUT", ROUTE, 404);
      return NextResponse.json({ status: "not-found" }, { status: 404 });
    }
    logApiRequest("PUT", ROUTE, 500);
    return NextResponse.json({ status: "save-error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: Context) {
  const { id } = await context.params;
  try {
    const removed = await deleteResource(id);
    logApiRequest("DELETE", ROUTE, 200);
    return NextResponse.json({ status: "success", resource: removed });
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      logApiRequest("DELETE", ROUTE, 404);
      return NextResponse.json({ status: "not-found" }, { status: 404 });
    }
    logApiRequest("DELETE", ROUTE, 500);
    return NextResponse.json({ status: "save-error" }, { status: 500 });
  }
}
