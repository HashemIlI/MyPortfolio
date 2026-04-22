import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, getExpiredAuthCookieOptions, verifyToken } from '@/lib/auth';


export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow the login page through without auth check
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  // Protect all /admin routes
  if (pathname.startsWith('/admin')) {
    const token = req.cookies.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }

    try {
      const payload = await verifyToken(token);
      if (!payload) {
        throw new Error('Invalid token');
      }
      return NextResponse.next();
    } catch {
      const response = NextResponse.redirect(new URL('/admin/login', req.url));
      response.cookies.set(COOKIE_NAME, '', getExpiredAuthCookieOptions());
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
