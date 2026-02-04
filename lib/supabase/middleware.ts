import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  try {
    const isAuthPage =
      request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup';

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
    if (!url || !key) {
      return NextResponse.next({ request });
    }

    let response = NextResponse.next({ request });
    try {
      const supabase = createServerClient(url, key, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      });
      const {
        data: { user },
      } = await supabase.auth.getUser();
      // Allow unauthenticated access to home (/) so users see the login button
      const isHome = request.nextUrl.pathname === '/';
      if (!user && !isAuthPage && !isHome && request.nextUrl.pathname !== '/auth/callback') {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/login';
        response = NextResponse.redirect(redirectUrl);
      } else if (user && isAuthPage) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/';
        response = NextResponse.redirect(redirectUrl);
      }
    } catch {
      return NextResponse.next({ request });
    }
    return response;
  } catch (_err) {
    return NextResponse.next({ request });
  }
}
