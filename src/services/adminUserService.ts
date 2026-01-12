import api from '@/lib/api';
import { AxiosError } from 'axios';

/**
 * Query parameters for fetching users
 * Based on backend API specification in README.md
 * 
 * Supported parameters:
 * - role: Filter by role (guest, receptionist, housekeeping, admin)
 * - isActive: Filter by status (true/false)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 */
export interface GetUsersParams {
    role?: UserRole;
    isActive?: boolean;
    page?: number;
    limit?: number;
}

/**
 * Get all users with optional filters (Admin only)
 * GET /admin/users
 * 
 * @param params - Optional query parameters for filtering users
 * @returns Promise with paginated users or array of users
 */
export const getUsers = async (params?: GetUsersParams): Promise<ApiResponse<PaginatedResponse<IUser> | IUser[]>> => {
    try {
        const response = await api.get<ApiResponse<PaginatedResponse<IUser> | IUser[]>>('/admin/users', {
            params: params || {}
        });
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        throw error;
    }
};

/**
 * Get single user by ID (Admin only)
 * GET /admin/users/:id
 * 
 * @param userId - The ID of the user to fetch
 * @returns Promise with user details
 */
export const getUserById = async (userId: string): Promise<ApiResponse<IUser>> => {
    try {
        const response = await api.get<ApiResponse<IUser>>(`/admin/users/${userId}`);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        throw error;
    }
};

/**
 * Create a new user with role assignment (Admin only)
 * POST /auth/users
 * 
 * @param userData - User data to create (name, email, password, role)
 * @returns Promise with created user
 */
export const createUser = async (userData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
}): Promise<ApiResponse<IUser>> => {
    try {
        const response = await api.post<ApiResponse<IUser>>('/auth/users', userData);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        throw error;
    }
};

/**
 * Update user details (Admin only)
 * PATCH /admin/users/:id
 * 
 * @param userId - The ID of the user to update
 * @param userData - User data to update (name, role)
 * @returns Promise with updated user
 */
export const updateUser = async (
    userId: string,
    userData: Partial<{
        name: string;
        role: UserRole;
    }>
): Promise<ApiResponse<IUser>> => {
    try {
        const response = await api.patch<ApiResponse<IUser>>(`/admin/users/${userId}`, userData);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        throw error;
    }
};

/**
 * Activate or deactivate user account (Admin only)
 * PATCH /admin/users/:id/status
 * 
 * @param userId - The ID of the user to update
 * @param isActive - New active status (true/false)
 * @returns Promise with updated user
 */
export const updateUserStatus = async (
    userId: string,
    isActive: boolean
): Promise<ApiResponse<IUser>> => {
    try {
        const response = await api.patch<ApiResponse<IUser>>(`/admin/users/${userId}/status`, {
            isActive
        });
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        throw error;
    }
};

/**
 * Get user statistics (Admin only)
 * GET /admin/users/statistics
 * 
 * @returns Promise with user statistics
 */
export const getUserStatistics = async (): Promise<ApiResponse<{
    total: number;
    active: number;
    byRole: Record<UserRole, number>;
}>> => {
    try {
        const response = await api.get<ApiResponse<{
            total: number;
            active: number;
            byRole: Record<UserRole, number>;
        }>>('/admin/users/statistics');
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        throw error;
    }
};

/**
 * Get all housekeeping staff for a specific hotel
 * GET /admin/users?role=housekeeping&isActive=true
 * 
 * @param hotelId - The hotel ID to filter housekeeping staff
 * @returns Promise with housekeeping staff array
 */
export const getHousekeepingStaff = async (hotelId: string): Promise<ApiResponse<IUser[]>> => {
    try {
        const response = await api.get<ApiResponse<IUser[]>>('/admin/users', {
            params: {
                role: 'housekeeping',
                isActive: true,
                hotelId: hotelId
            }
        });
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        return {
            success: false,
            message: 'Failed to fetch housekeeping staff'
        };
    }
};

