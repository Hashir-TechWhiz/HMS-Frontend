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

/**
 * Get detailed booking report with pagination
 * GET /api/reports/bookings/detailed
 * 
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 10)
 * @param dateFilter - Optional date range filter { from, to }
 * @param status - Optional status filter
 * @returns Promise with paginated booking data
 */
export const getDetailedBookingReport = async (
    page: number = 1,
    limit: number = 10,
    dateFilter?: { from?: string; to?: string },
    status?: string
): Promise<ApiResponse<PaginatedResponse<IDetailedBookingReport>>> => {
    try {
        let url = `/reports/bookings/detailed?page=${page}&limit=${limit}`;
        if (dateFilter?.from) url += `&from=${dateFilter.from}`;
        if (dateFilter?.to) url += `&to=${dateFilter.to}`;
        if (status) url += `&status=${status}`;

        const response = await api.get<ApiResponse<PaginatedResponse<IDetailedBookingReport>>>(url);
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
 * Get detailed payment report with pagination
 * GET /api/reports/payments/detailed
 * 
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 10)
 * @param dateFilter - Optional date range filter { from, to }
 * @param status - Optional status filter
 * @returns Promise with paginated payment data
 */
export const getDetailedPaymentReport = async (
    page: number = 1,
    limit: number = 10,
    dateFilter?: { from?: string; to?: string },
    status?: string
): Promise<ApiResponse<PaginatedResponse<IPaymentReport>>> => {
    try {
        let url = `/reports/payments/detailed?page=${page}&limit=${limit}`;
        if (dateFilter?.from) url += `&from=${dateFilter.from}`;
        if (dateFilter?.to) url += `&to=${dateFilter.to}`;
        if (status) url += `&status=${status}`;

        const response = await api.get<ApiResponse<PaginatedResponse<IPaymentReport>>>(url);
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
 * Get detailed room utilization report with pagination
 * GET /api/reports/rooms/detailed
 * 
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 10)
 * @param status - Optional status filter
 * @returns Promise with paginated room data
 */
export const getDetailedRoomReport = async (
    page: number = 1,
    limit: number = 10,
    status?: string
): Promise<ApiResponse<PaginatedResponse<IRoomUtilizationReport>>> => {
    try {
        let url = `/reports/rooms/detailed?page=${page}&limit=${limit}`;
        if (status) url += `&status=${status}`;

        const response = await api.get<ApiResponse<PaginatedResponse<IRoomUtilizationReport>>>(url);
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
 * Get detailed service request report with pagination
 * GET /api/reports/service-requests/detailed
 * 
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 10)
 * @param dateFilter - Optional date range filter { from, to }
 * @param status - Optional status filter
 * @returns Promise with paginated service request data
 */
export const getDetailedServiceRequestReport = async (
    page: number = 1,
    limit: number = 10,
    dateFilter?: { from?: string; to?: string },
    status?: string
): Promise<ApiResponse<PaginatedResponse<IDetailedServiceRequestReport>>> => {
    try {
        let url = `/reports/service-requests/detailed?page=${page}&limit=${limit}`;
        if (dateFilter?.from) url += `&from=${dateFilter.from}`;
        if (dateFilter?.to) url += `&to=${dateFilter.to}`;
        if (status) url += `&status=${status}`;

        const response = await api.get<ApiResponse<PaginatedResponse<IDetailedServiceRequestReport>>>(url);
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
 * Get detailed guest report with pagination
 * GET /api/reports/guests/detailed
 * 
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 10)
 * @returns Promise with paginated guest data
 */
export const getDetailedGuestReport = async (
    page: number = 1,
    limit: number = 10
): Promise<ApiResponse<PaginatedResponse<IGuestReport>>> => {
    try {
        const response = await api.get<ApiResponse<PaginatedResponse<IGuestReport>>>(
            `/reports/guests/detailed?page=${page}&limit=${limit}`
        );
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
