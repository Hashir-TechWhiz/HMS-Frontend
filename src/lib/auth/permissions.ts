/**
 * Route Permissions Mapping
 * 
 * Defines which user roles can access specific routes
 * Used by middleware for route protection and UI for navigation visibility
 */
export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
    '/dashboard': ['guest', 'receptionist', 'housekeeping', 'admin'],
    '/dashboard/my-requests': ['guest'],
    '/dashboard/bookings': ['guest', 'receptionist', 'admin'],
    '/dashboard/operations': ['receptionist', 'admin'],
    '/dashboard/service-requests': ['receptionist', 'housekeeping', 'admin'],
    '/dashboard/rooms': ['admin'],
    '/dashboard/service-catalog': ['admin'],
    '/dashboard/roster': ['receptionist', 'housekeeping', 'admin'],
    '/dashboard/hotels': ['admin'],
    '/dashboard/guests': ['admin'],
    '/dashboard/reports': ['admin'],
    '/dashboard/users': ['admin'],
    '/dashboard/profile': ['guest', 'receptionist', 'housekeeping', 'admin'],
    '/rooms': ['guest', 'receptionist', 'admin'],
};

/**
 * Public Routes
 * 
 * Routes that don't require authentication
 */
export const PUBLIC_ROUTES: string[] = [
    '/',
    '/login',
    '/sign-up',
    '/forgot-password',
    '/rooms',
    '/services',
    '/about',
    '/contact-us',
];

/**
 * Get allowed roles for a specific route
 * 
 * @param route - The route path
 * @returns Array of roles allowed to access the route, or undefined if not defined
 */
export function getAllowedRoles(route: string): UserRole[] | undefined {
    return ROUTE_PERMISSIONS[route];
}

/**
 * Check if a route is public
 * 
 * @param route - The route path
 * @returns true if route is public, false otherwise
 */
export function isPublicRoute(route: string): boolean {
    return PUBLIC_ROUTES.includes(route);
}

