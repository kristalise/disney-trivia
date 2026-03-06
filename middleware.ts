import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ORIGINS = [
  'https://www.disneytrivia.club',
  'https://disneytrivia.club',
];

if (process.env.NODE_ENV === 'development') {
  ALLOWED_ORIGINS.push('http://localhost:3000');
}

// Allow Vercel deployment/preview URLs
if (process.env.VERCEL_URL) {
  ALLOWED_ORIGINS.push(`https://${process.env.VERCEL_URL}`);
}
if (process.env.VERCEL_BRANCH_URL) {
  ALLOWED_ORIGINS.push(`https://${process.env.VERCEL_BRANCH_URL}`);
}
if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
  ALLOWED_ORIGINS.push(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
}

export function middleware(request: NextRequest) {
  // CSRF protection: verify origin on mutating API requests
  if (
    request.nextUrl.pathname.startsWith('/api/') &&
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)
  ) {
    const origin = request.headers.get('origin');

    // Allow requests with no origin header (same-origin, server-side, curl, etc.)
    if (!origin) return NextResponse.next();

    // Allow if origin matches any allowed origin or the request's own host
    const requestOrigin = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    if (ALLOWED_ORIGINS.includes(origin) || origin === requestOrigin) {
      return NextResponse.next();
    }

    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
