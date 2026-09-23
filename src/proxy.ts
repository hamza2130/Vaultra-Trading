import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const PUBLIC_PATHS = ["/login", "/register"];

// Home, Markets, coin detail pages, and the market-data API they poll are
// viewable by anyone, whatever their auth or KYC state — they're
// reference-only market data, not account features. Everything else stays
// gated below.
function isPublicView(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/markets" ||
    pathname.startsWith("/coin/") ||
    pathname.startsWith("/api/market/")
  );
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "127.0.0.1";
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  // IP block check runs before anything else, for every request. If Supabase
  // itself is unreachable (e.g. local dev before `supabase start`), fail
  // open on this check rather than take the whole site down over it.
  try {
    const ip = getClientIp(request);
    const admin = createAdminClient();
    const { data: blocked } = await admin
      .from("blocked_ips")
      .select("ip")
      .eq("ip", ip)
      .maybeSingle();
    if (blocked) {
      return new NextResponse("Access denied.", { status: 403 });
    }
  } catch {
    // Supabase unreachable — continue; the auth check below will still
    // gate protected routes.
  }

  let response = NextResponse.next({ request });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    // Always viewable, regardless of auth/KYC state. getUser() above still
    // ran, so a logged-in visitor's session cookie gets refreshed as normal.
    if (isPublicView(pathname)) return response;

    if (!user) {
      if (isPublicPath) return response;
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("kyc_status, role")
      .eq("id", user.id)
      .maybeSingle();

    // No profile row yet (shouldn't happen post-registration, but fail safe).
    if (!profile) {
      if (isPublicPath) return response;
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (profile.kyc_status === "restricted") {
      if (pathname === "/restricted") return response;
      return NextResponse.redirect(new URL("/restricted", request.url));
    }

    if (profile.kyc_status === "pending") {
      if (pathname === "/pending") return response;
      return NextResponse.redirect(new URL("/pending", request.url));
    }

    // Approved from here on.
    if (isPublicPath || pathname === "/pending") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (pathname.startsWith("/admin") && profile.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return response;
  } catch {
    // Supabase unreachable (e.g. local dev before `supabase start`).
    // Public pages can still render; everything else needs a working
    // backend, so send it to /login rather than 500.
    if (isPublicPath || isPublicView(pathname)) return response;
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
