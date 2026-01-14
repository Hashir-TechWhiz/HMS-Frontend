import api from '@/lib/api';
import { AxiosError } from 'axios';

export const generateDailyTasks = async (hotelId: string, date: string): Promise<ApiResponse<any>> => {
    try {
        const response = await api.post<ApiResponse<any>>('/housekeeping/generate', { hotelId, date });
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        return {
            success: false,
            message: 'An unexpected error occurred'
        };
    }
};

export const getTasksByDate = async (params: { hotelId?: string, date: string, shift?: string, status?: string }): Promise<ApiResponse<any[]>> => {
    try {
        const response = await api.get<ApiResponse<any[]>>('/housekeeping/tasks', { params });
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        return {
            success: false,
            message: 'An unexpected error occurred'
        };
    }
};

export const getMyTasks = async (params: { date?: string, shift?: string, status?: string }): Promise<ApiResponse<any[]>> => {
    try {
        const response = await api.get<ApiResponse<any[]>>('/housekeeping/my-tasks', { params });
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        return {
            success: false,
            message: 'An unexpected error occurred'
        };
    }
};

export const updateTaskStatus = async (taskId: string, status: string, notes?: string): Promise<ApiResponse<any>> => {
    try {
        const response = await api.patch<ApiResponse<any>>(`/housekeeping/tasks/${taskId}/status`, { status, notes });
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        return {
            success: false,
            message: 'An unexpected error occurred'
        };
    }
};

export const assignTask = async (taskId: string, staffId: string): Promise<ApiResponse<any>> => {
    try {
        const response = await api.patch<ApiResponse<any>>(`/housekeeping/tasks/${taskId}/assign`, { staffId });
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        return {
            success: false,
            message: 'An unexpected error occurred'
        };
    }
};
