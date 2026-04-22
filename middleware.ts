import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const isAuth = !!token;
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard');
  const isAuthPages = request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register';
  const url = request.nextUrl.clone();

  if (isDashboard && !isAuth) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If logged in, prevent visiting login/register; route by role to default dashboard
  if (isAuth && isAuthPages) {
    const role = (token as any)?.role;
    url.pathname = role === 'ADMIN' ? '/dashboard/admin'
      : role === 'DOCTOR' ? '/dashboard/doctor'
      : role === 'PHARMACIST' ? '/dashboard/pharmacist'
      : '/dashboard/patient';
    return NextResponse.redirect(url);
  }

  // Protect profile route
  if (request.nextUrl.pathname.startsWith('/profile') && !isAuth) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*','/login','/register','/profile/:path*'],
}; 