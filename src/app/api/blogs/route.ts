import { NextResponse } from "next/server";
import {
  createBlogPost,
  DuplicateSlugError,
  readBlogPosts,
} from "@/lib/blog-store";
import { parseBlogRequest } from "@/lib/blog-request";

export async function GET() {
  let posts;
  try {
    posts = await readBlogPosts();
  } catch {
    return NextResponse.json({ status: "storage-error" }, { status: 500 });
  }
  const sorted = [...posts].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  return NextResponse.json({ status: "success", posts: sorted });
}

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

  const parsed = parseBlogRequest(raw);
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
    const post = await createBlogPost({
      title: parsed.values.title.trim(),
      slug: parsed.values.slug.trim(),
      summary: parsed.values.summary.trim(),
      body: parsed.values.body.trim(),
    });
    return NextResponse.json({ status: "success", post }, { status: 201 });
  } catch (error) {
    if (error instanceof DuplicateSlugError) {
      return NextResponse.json({ status: "duplicate-slug" }, { status: 409 });
    }
    return NextResponse.json({ status: "save-error" }, { status: 500 });
  }
}
