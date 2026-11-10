import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (/^\/(zh|en)(\/|$)/.test(pathname)) {
    return;
  }
  const acceptLanguage = request.headers.get("accept-language") ?? "";
  const locale = /zh|cn/i.test(acceptLanguage) ? "zh" : "en";
  return NextResponse.redirect(new URL(`/${locale}${pathname}`, request.url));
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
