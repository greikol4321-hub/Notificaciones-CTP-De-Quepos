import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const authOnlyPaths = ["/panel-ausencias"];
const adminPaths = ["/comunicados/admin", "/subir-imagen"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const needsAuth = authOnlyPaths.some((p) => pathname.startsWith(p));
  const needsAdmin = adminPaths.some((p) => pathname.startsWith(p));

  if (!needsAuth && !needsAdmin) return NextResponse.next();

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (needsAdmin) {
    const { data: perfil } = await supabase
      .from("usuarios_perfil")
      .select("rol")
      .eq("user_id", user.id)
      .single();

    const rolesAdmin = ["admin", "docente_guia_admin"];
    if (!perfil || !rolesAdmin.includes(perfil.rol)) {
      const url = request.nextUrl.clone();
      url.pathname = "/panel-ausencias";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
