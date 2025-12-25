import { cookies } from "next/headers";
import { jwtVerify } from "jose";

/**
 * Session Management - Server-Side Only
 * 
 * Centralized authentication logic for Next.js App Router
 * Used in layouts, server components, and server actions
 */

/**
 * JWT Payload structure from backend
 */
export interface SessionPayload {
    userId: string;
    role: UserRole;
    iat?: number;
    exp?: number;
}

/**
 * Get JWT secret as Uint8Array for jose
 */
function getJWTSecret(): Uint8Array {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    return new TextEncoder().encode(secret);
}

/**
 * Get current user session from JWT cookie
 * 
 * @returns Session payload if authenticated, null otherwise
 * 
 * @example
 * const session = await getSession();
 * if (session) {
 *   console.log(session.userId, session.role);
 * }
 */
export async function getSession(): Promise<SessionPayload | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return null;
        }

        const secret = getJWTSecret();
        const { payload } = await jwtVerify(token, secret);

        return {
            userId: payload.userId as string,
            role: payload.role as UserRole,
            iat: payload.iat,
            exp: payload.exp,
        };
    } catch {
        return null;
    }
}

/**
 * Check if user is authenticated
 * 
 * @returns true if user has valid JWT, false otherwise
 * 
 * @example
 * const authenticated = await isAuthenticated();
 * if (!authenticated) {
 *   redirect('/login');
 * }
 */
export async function isAuthenticated(): Promise<boolean> {
    const session = await getSession();
    return session !== null;
}

/**
 * Get current user's role
 * 
 * @returns User role if authenticated, null otherwise
 * 
 * @example
 * const role = await getUserRole();
 * if (role === 'admin') {
 *   // Show admin features
 * }
 */
export async function getUserRole(): Promise<UserRole | null> {
    const session = await getSession();
    return session?.role || null;
}

/**
 * Check if user has permission for a specific role
 * 
 * @param allowedRoles - Array of roles that have permission
 * @returns true if user has one of the allowed roles, false otherwise
 * 
 * @example
 * const hasPermission = await hasRolePermission(['admin', 'receptionist']);
 * if (!hasPermission) {
 *   redirect('/unauthorized');
 * }
 */
export async function hasRolePermission(allowedRoles: UserRole[]): Promise<boolean> {
    const role = await getUserRole();
    if (!role) return false;
    return allowedRoles.includes(role);
}

