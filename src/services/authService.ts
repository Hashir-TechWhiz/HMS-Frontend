import api from '@/lib/api';
import { AxiosError } from 'axios';

// Login credentials interface
interface LoginCredentials {
    email: string;
    password: string;
}

// Guest registration data interface
interface GuestRegistrationData {
    name: string;
    email: string;
    password: string;
}

// Login response data interface
interface LoginResponseData {
    token: string;
    user: IUser;
}

/**
 * Login user with email and password
 * POST /auth/login
 * 
 * @param credentials - User email and password
 * @returns Promise with login response including token and user data
 */
export const login = async (credentials: LoginCredentials): Promise<ApiResponse<LoginResponseData>> => {
    try {
        const response = await api.post<ApiResponse<LoginResponseData>>('/auth/login', credentials);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        throw error;
    }
};

/**
 * Logout current user
 * POST /auth/logout
 * 
 * Clears authentication cookie on the server
 * @returns Promise with logout response
 */
export const logout = async (): Promise<ApiResponse> => {
    try {
        const response = await api.post<ApiResponse>('/auth/logout');
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        throw error;
    }
};

/**
 * Get current authenticated user
 * GET /auth/me
 * 
 * @returns Promise with current user data
 */
export const getCurrentUser = async (): Promise<ApiResponse<IUser>> => {
    try {
        const response = await api.get<ApiResponse<IUser>>('/auth/me');
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        throw error;
    }
};

/**
 * Register a new guest user
 * POST /auth/register
 * 
 * @param data - Guest registration data (name, email, password)
 * @returns Promise with registration response
 */
export const registerGuest = async (data: GuestRegistrationData): Promise<ApiResponse<LoginResponseData>> => {
    try {
        const response = await api.post<ApiResponse<LoginResponseData>>('/auth/register', data);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        throw error;
    }
};

