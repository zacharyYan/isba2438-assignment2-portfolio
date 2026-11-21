import { NextResponse } from "next/server";
import { readContactMessages } from "@/lib/contact-store";
import { logApiRequest } from "@/lib/request-log";

const ROUTE = "/api/contacts";

export { POST } from "../contact/route";

export async function GET() {
  let messages;
  try {
    messages = await readContactMessages();
  } catch {
    logApiRequest("GET", ROUTE, 500);
    return NextResponse.json({ status: "storage-error" }, { status: 500 });
  }
  logApiRequest("GET", ROUTE, 200);
  return NextResponse.json({ status: "success", contacts: messages });
}
