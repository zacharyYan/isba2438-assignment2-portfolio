import { NextResponse } from "next/server";
import {
  ContactNotFoundError,
  deleteContactMessage,
  getContactById,
  updateContactMessage,
} from "@/lib/contact-store";
import { parseContactRequest } from "@/lib/contact-request";
import { logApiRequest } from "@/lib/request-log";

const ROUTE = "/api/contacts/:id";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  let message;
  try {
    message = await getContactById(id);
  } catch {
    logApiRequest("GET", ROUTE, 500);
    return NextResponse.json({ status: "storage-error" }, { status: 500 });
  }
  if (!message) {
    logApiRequest("GET", ROUTE, 404);
    return NextResponse.json({ status: "not-found" }, { status: 404 });
  }
  logApiRequest("GET", ROUTE, 200);
  return NextResponse.json({ status: "success", contact: message });
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

  const parsed = parseContactRequest(raw);
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
    const contact = await updateContactMessage(id, {
      name: parsed.values.name.trim(),
      email: parsed.values.email,
      message: parsed.values.message.trim(),
    });
    logApiRequest("PUT", ROUTE, 200);
    return NextResponse.json({ status: "success", contact });
  } catch (error) {
    if (error instanceof ContactNotFoundError) {
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
    const removed = await deleteContactMessage(id);
    logApiRequest("DELETE", ROUTE, 200);
    return NextResponse.json({ status: "success", contact: removed });
  } catch (error) {
    if (error instanceof ContactNotFoundError) {
      logApiRequest("DELETE", ROUTE, 404);
      return NextResponse.json({ status: "not-found" }, { status: 404 });
    }
    logApiRequest("DELETE", ROUTE, 500);
    return NextResponse.json({ status: "save-error" }, { status: 500 });
  }
}
