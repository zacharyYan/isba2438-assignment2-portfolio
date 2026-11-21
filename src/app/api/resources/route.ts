import { NextResponse } from "next/server";
import {
  createResource,
  DuplicateResourceIdError,
  listResources,
} from "@/lib/resource-store";
import { parseResourceRequest } from "@/lib/resource-request";
import type { ResourceReadingStatus } from "@/lib/resource-validation";
import { logApiRequest } from "@/lib/request-log";

const ROUTE = "/api/resources";

export async function GET() {
  let records;
  try {
    records = await listResources();
  } catch {
    logApiRequest("GET", ROUTE, 500);
    return NextResponse.json({ status: "storage-error" }, { status: 500 });
  }
  logApiRequest("GET", ROUTE, 200);
  return NextResponse.json({ status: "success", resources: records });
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

  const parsed = parseResourceRequest(raw);
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

  try {
    const resource = await createResource({
      title: parsed.values.title.trim(),
      url: parsed.values.url.trim(),
      category: parsed.values.category.trim(),
      notes: parsed.values.notes,
      readingStatus: parsed.values.readingStatus as ResourceReadingStatus,
    });
    logApiRequest("POST", ROUTE, 201);
    return NextResponse.json({ status: "success", resource }, { status: 201 });
  } catch (error) {
    if (error instanceof DuplicateResourceIdError) {
      logApiRequest("POST", ROUTE, 409);
      return NextResponse.json({ status: "duplicate-id" }, { status: 409 });
    }
    logApiRequest("POST", ROUTE, 500);
    return NextResponse.json({ status: "save-error" }, { status: 500 });
  }
}
