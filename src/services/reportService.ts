import api from '@/lib/api';
import { AxiosError } from 'axios';

/**
 * Report Service
 * Handles fetching reports and statistics from backend
 * Available for Admin and Receptionist roles
 */

/**
 * Get all reports in a single call
 * GET /api/reports/overview
 * 
 * @returns Promise with overview data containing all reports
 */
export const getReportsOverview = async (): Promise<ApiResponse<IReportOverview>> => {
    try {
        const response = await api.get<ApiResponse<IReportOverview>>('/reports/overview');
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        return {
            success: false,
            message: error instanceof AxiosError
                ? error.message || 'Network error occurred'
                : 'An unexpected error occurred'
        };
    }
};

/**
 * Get booking report
 * GET /api/reports/bookings
 * 
 * @returns Promise with booking summary
 */
export const getBookingsReport = async (): Promise<ApiResponse<IBookingReport>> => {
    try {
        const response = await api.get<ApiResponse<IBookingReport>>('/reports/bookings');
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        return {
            success: false,
            message: error instanceof AxiosError
                ? error.message || 'Network error occurred'
                : 'An unexpected error occurred'
        };
    }
};

/**
 * Get room report
 * GET /api/reports/rooms
 * 
 * @returns Promise with room overview
 */
export const getRoomsReport = async (): Promise<ApiResponse<IRoomReport>> => {
    try {
        const response = await api.get<ApiResponse<IRoomReport>>('/reports/rooms');
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        return {
            success: false,
            message: error instanceof AxiosError
                ? error.message || 'Network error occurred'
                : 'An unexpected error occurred'
        };
    }
};

/**
 * Get service request report
 * GET /api/reports/service-requests
 * 
 * @returns Promise with service request overview
 */
export const getServiceRequestsReport = async (): Promise<ApiResponse<IServiceRequestReport>> => {
    try {
        const response = await api.get<ApiResponse<IServiceRequestReport>>('/reports/service-requests');
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        return {
            success: false,
            message: error instanceof AxiosError
                ? error.message || 'Network error occurred'
                : 'An unexpected error occurred'
        };
    }
};

