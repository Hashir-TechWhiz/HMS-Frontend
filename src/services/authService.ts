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

/**
 * Update current user profile
 * PATCH /auth/me
 * 
 * @param data - Profile data to update (name, email)
 * @returns Promise with updated user data
 */
export const updateProfile = async (data: { name?: string; email?: string }): Promise<ApiResponse<IUser>> => {
    try {
        const response = await api.patch<ApiResponse<IUser>>('/auth/me', data);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        throw error;
    }
};

/**
 * Request password reset OTP
 * POST /auth/forgot-password
 * 
 * @param email - User's registered email address
 * @returns Promise with success/error response
 */
export const forgotPassword = async (email: string): Promise<ApiResponse> => {
    try {
        const response = await api.post<ApiResponse>('/auth/forgot-password', { email });
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        throw error;
    }
};

/**
 * Verify password reset OTP
 * POST /auth/verify-reset-otp
 * 
 * @param email - User's email address
 * @param otp - 6-digit OTP sent to email
 * @returns Promise with success/error response
 */
export const verifyResetOtp = async (email: string, otp: string): Promise<ApiResponse> => {
    try {
        const response = await api.post<ApiResponse>('/auth/verify-reset-otp', { email, otp });
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        throw error;
    }
};

/**
 * Reset password using verified OTP
 * POST /auth/reset-password
 * 
 * @param email - User's email address
 * @param otp - Verified 6-digit OTP
 * @param newPassword - New password to set
 * @returns Promise with success/error response
 */
export const resetPassword = async (email: string, otp: string, newPassword: string): Promise<ApiResponse> => {
    try {
        const response = await api.post<ApiResponse>('/auth/reset-password', { email, otp, newPassword });
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        throw error;
    }
};

