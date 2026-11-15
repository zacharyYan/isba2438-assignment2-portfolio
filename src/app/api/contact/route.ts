import { NextResponse } from "next/server";
import { appendContactMessage } from "@/lib/contact-store";
import { parseContactRequest } from "@/lib/contact-request";

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { status: "invalid-request", reason: "invalid-json" },
      { status: 400 },
    );
  }

  const parsed = parseContactRequest(raw);
  if (!parsed.ok) {
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
    await appendContactMessage({
      name: parsed.values.name.trim(),
      email: parsed.values.email,
      message: parsed.values.message.trim(),
    });
  } catch {
    return NextResponse.json({ status: "save-error" }, { status: 500 });
  }

  return NextResponse.json({ status: "success" }, { status: 201 });
}
