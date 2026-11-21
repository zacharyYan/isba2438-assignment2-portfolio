import { NextResponse } from "next/server";
import {
  BlogPostNotFoundError,
  deleteBlogPost,
  getBlogPostById,
  updateBlogPost,
} from "@/lib/blog-store";
import { parseBlogUpdateRequest } from "@/lib/blog-request";
import { logApiRequest } from "@/lib/request-log";

const ROUTE = "/api/blogs/:id";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  let post;
  try {
    post = await getBlogPostById(id);
  } catch {
    logApiRequest("GET", ROUTE, 500);
    return NextResponse.json({ status: "storage-error" }, { status: 500 });
  }
  if (!post) {
    logApiRequest("GET", ROUTE, 404);
    return NextResponse.json({ status: "not-found" }, { status: 404 });
  }
  logApiRequest("GET", ROUTE, 200);
  return NextResponse.json({ status: "success", post });
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

  const parsed = parseBlogUpdateRequest(raw);
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
    const post = await updateBlogPost(id, {
      title: parsed.values.title.trim(),
      summary: parsed.values.summary.trim(),
      body: parsed.values.body.trim(),
    });
    logApiRequest("PUT", ROUTE, 200);
    return NextResponse.json({ status: "success", post });
  } catch (error) {
    if (error instanceof BlogPostNotFoundError) {
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
    const removed = await deleteBlogPost(id);
    logApiRequest("DELETE", ROUTE, 200);
    return NextResponse.json({ status: "success", post: removed });
  } catch (error) {
    if (error instanceof BlogPostNotFoundError) {
      logApiRequest("DELETE", ROUTE, 404);
      return NextResponse.json({ status: "not-found" }, { status: 404 });
    }
    logApiRequest("DELETE", ROUTE, 500);
    return NextResponse.json({ status: "save-error" }, { status: 500 });
  }
}
