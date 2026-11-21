import { NextResponse } from "next/server";
import {
  createBlogPost,
  DuplicateSlugError,
  readBlogPosts,
} from "@/lib/blog-store";
import { parseBlogRequest } from "@/lib/blog-request";
import { logApiRequest } from "@/lib/request-log";

const ROUTE = "/api/blogs";

export async function GET() {
  let posts;
  try {
    posts = await readBlogPosts();
  } catch {
    logApiRequest("GET", ROUTE, 500);
    return NextResponse.json({ status: "storage-error" }, { status: 500 });
  }
  const sorted = [...posts].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  logApiRequest("GET", ROUTE, 200);
  return NextResponse.json({ status: "success", posts: sorted });
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

  const parsed = parseBlogRequest(raw);
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
    const post = await createBlogPost({
      title: parsed.values.title.trim(),
      slug: parsed.values.slug.trim(),
      summary: parsed.values.summary.trim(),
      body: parsed.values.body.trim(),
    });
    logApiRequest("POST", ROUTE, 201);
    return NextResponse.json({ status: "success", post }, { status: 201 });
  } catch (error) {
    if (error instanceof DuplicateSlugError) {
      logApiRequest("POST", ROUTE, 409);
      return NextResponse.json({ status: "duplicate-slug" }, { status: 409 });
    }
    logApiRequest("POST", ROUTE, 500);
    return NextResponse.json({ status: "save-error" }, { status: 500 });
  }
}
