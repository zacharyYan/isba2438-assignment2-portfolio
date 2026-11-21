import { NextResponse } from "next/server";
import { appendContactMessage } from "@/lib/contact-store";
import { parseContactRequest } from "@/lib/contact-request";
import { logApiRequest } from "@/lib/request-log";

// The route is served under both /api/contact and /api/contacts (alias);
// log the pathname actually requested.
export async function POST(request: Request) {
  const route = new URL(request.url).pathname;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    logApiRequest("POST", route, 400);
    return NextResponse.json(
      { status: "invalid-request", reason: "invalid-json" },
      { status: 400 },
    );
  }

  const parsed = parseContactRequest(raw);
  if (!parsed.ok) {
    logApiRequest("POST", route, 400);
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
    const contact = await appendContactMessage({
      name: parsed.values.name.trim(),
      email: parsed.values.email,
      message: parsed.values.message.trim(),
    });
    logApiRequest("POST", route, 201);
    return NextResponse.json({ status: "success", contact }, { status: 201 });
  } catch {
    logApiRequest("POST", route, 500);
    return NextResponse.json({ status: "save-error" }, { status: 500 });
  }
}
