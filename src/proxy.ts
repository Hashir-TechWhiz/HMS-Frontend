import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { ROUTE_PERMISSIONS, PUBLIC_ROUTES } from '@/lib/auth/permissions';


/**
 * Verify JWT token and extract user data
 */
async function verifyToken(token: string): Promise<{ userId: string; role: UserRole } | null> {
    try {
        const secret = new TextEncoder().encode(
            process.env.JWT_SECRET
        );

        const { payload } = await jwtVerify(token, secret);

        return {
            userId: payload.userId as string,
            role: payload.role as UserRole,
        };
    } catch {
        return null;
    }
}

/**
 * Check if user has permission to access route
 */
function hasPermission(userRole: UserRole, pathname: string): boolean {
    // Check exact match first
    if (ROUTE_PERMISSIONS[pathname]) {
        return ROUTE_PERMISSIONS[pathname].includes(userRole);
    }

    // Check if route starts with any protected route prefix
    for (const [route, roles] of Object.entries(ROUTE_PERMISSIONS)) {
        if (pathname.startsWith(route) && route !== '/dashboard') {
            return roles.includes(userRole);
        }
    }

    // If it's under /dashboard but not specifically defined, allow all authenticated users
    if (pathname.startsWith('/dashboard')) {
        return true;
    }

    return false;
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public routes
    if (PUBLIC_ROUTES.includes(pathname) || pathname.startsWith('/_next') || pathname.startsWith('/api')) {
        return NextResponse.next();
    }

    // Get token from HttpOnly cookie
    const token = request.cookies.get('token')?.value;

    // Redirect to login if no token and trying to access protected route
    if (!token && pathname.startsWith('/dashboard')) {
        const url = new URL('/login', request.url);
        return NextResponse.redirect(url);
    }

    // Verify token if present
    if (token) {
        const userData = await verifyToken(token);

        // If token is invalid, clear cookie and redirect to login
        if (!userData) {
            const response = NextResponse.redirect(new URL('/login', request.url));
            response.cookies.delete('token');
            return response;
        }

        // Check if user has permission to access the route
        if (pathname.startsWith('/dashboard')) {
            if (!hasPermission(userData.role, pathname)) {
                // Redirect to unauthorized page or dashboard home
                const url = new URL('/dashboard', request.url);
                return NextResponse.redirect(url);
            }
        }

        // Allow access
        return NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};

