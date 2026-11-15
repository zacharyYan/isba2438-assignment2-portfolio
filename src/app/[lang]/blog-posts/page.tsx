import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { hasLocale } from "@/lib/i18n";

export default async function BlogPostsRedirectPage({
  params,
}: PageProps<"/[lang]/blog-posts">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  redirect(`/${lang}/blogs`);
}
