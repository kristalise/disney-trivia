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

export function proxy(request: NextRequest) {
  // CSRF protection: verify origin on mutating API requests
  if (
    request.nextUrl.pathname.startsWith('/api/') &&
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)
  ) {
    const origin = request.headers.get('origin');

    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
