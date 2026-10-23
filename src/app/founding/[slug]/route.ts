import { NextResponse } from "next/server";
import {
  FOUNDING_COOKIE,
  FOUNDING_COOKIE_MAX_AGE,
  FOUNDING_LINK_SLUG,
  FOUNDING_UI_COOKIE,
  signFoundingMarker,
} from "@/lib/founding";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /founding/<slug> — the private founding-shop link. A wrong slug goes
// to the homepage, so the route reveals nothing about the offer.
export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const url = new URL(req.url);

  if (slug !== FOUNDING_LINK_SLUG) {
    return NextResponse.redirect(new URL("/", url));
  }

  const marker = signFoundingMarker();
  const res = NextResponse.redirect(new URL("/get-started", url));
  if (!marker) return res;

  const secure = url.protocol === "https:";
  res.cookies.set(FOUNDING_COOKIE, marker, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: FOUNDING_COOKIE_MAX_AGE,
  });
  res.cookies.set(FOUNDING_UI_COOKIE, "1", {
    httpOnly: false,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: FOUNDING_COOKIE_MAX_AGE,
  });
  return res;
}
