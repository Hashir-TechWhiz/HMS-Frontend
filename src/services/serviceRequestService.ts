import api from '@/lib/api';
import { AxiosError } from 'axios';

/**
 * Service Request creation data interface
 * Based on backend API specification in README.md
 * 
 * Required fields:
 * - bookingId: Booking ID to create service request for
 * - serviceType: Type of service requested
 * 
 * Optional fields:
 * - notes: Additional notes/details about the request
 */
export interface CreateServiceRequestData {
    bookingId: string;
    serviceType: ServiceType;
    notes?: string;
}

/**
 * Create a new service request
 * POST /api/service-requests
 * 
 * Guest users only - create service request for own booking
 * 
 * @param data - Service request creation data
 * @returns Promise with created service request data
 */
export const createServiceRequest = async (data: CreateServiceRequestData): Promise<ApiResponse<IServiceRequest>> => {
    try {
        const response = await api.post<ApiResponse<IServiceRequest>>('/service-requests', data);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        // Handle network errors, auth errors, or any other errors gracefully
        return {
            success: false,
            message: error instanceof AxiosError
                ? error.message || 'Network error occurred'
                : 'An unexpected error occurred'
        };
    }
};

/**
 * Get single service request by ID
 * GET /api/service-requests/:id
 * 
 * @param serviceRequestId - The ID of the service request to fetch
 * @returns Promise with service request details
 */
export const getServiceRequestById = async (serviceRequestId: string): Promise<ApiResponse<IServiceRequest>> => {
    try {
        const response = await api.get<ApiResponse<IServiceRequest>>(`/service-requests/${serviceRequestId}`);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        // Handle network errors, auth errors, or any other errors gracefully
        return {
            success: false,
            message: error instanceof AxiosError
                ? error.message || 'Network error occurred'
                : 'An unexpected error occurred'
        };
    }
};

/**
 * Get my service requests (for guest users)
 * GET /api/service-requests/my-requests
 * 
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 10)
 * @param filters - Optional filters (from, to)
 * @returns Promise with paginated user service requests
 */
export const getMyServiceRequests = async (
    page: number = 1,
    limit: number = 10,
    filters?: { from?: string; to?: string }
): Promise<ApiResponse<PaginatedResponse<IServiceRequest>>> => {
    try {
        const params: any = { page, limit };
        if (filters?.from) params.from = filters.from;
        if (filters?.to) params.to = filters.to;

        const response = await api.get<ApiResponse<PaginatedResponse<IServiceRequest>>>('/service-requests/my-requests', {
            params
        });
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        // Handle network errors, auth errors, or any other errors gracefully
        return {
            success: false,
            message: error instanceof AxiosError
                ? error.message || 'Network error occurred'
                : 'An unexpected error occurred'
        };
    }
};

/**
 * Get all service requests (for admin and receptionist)
 * GET /api/service-requests
 * 
 * Admin and Receptionist only - view all service requests with optional filters
 * 
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 10)
 * @param filters - Optional filters (status, serviceType, assignedRole, roomId, from, to)
 * @returns Promise with paginated service requests
 */
export const getAllServiceRequests = async (
    page: number = 1,
    limit: number = 10,
    filters?: {
        status?: ServiceStatus;
        serviceType?: ServiceType;
        assignedRole?: string;
        roomId?: string;
        from?: string;
        to?: string;
    }
): Promise<ApiResponse<PaginatedResponse<IServiceRequest>>> => {
    try {
        const response = await api.get<ApiResponse<PaginatedResponse<IServiceRequest>>>('/service-requests', {
            params: { page, limit, ...filters }
        });
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
 * Get assigned service requests (for housekeeping)
 * GET /api/service-requests/assigned
 * 
 * Housekeeping only - view service requests assigned to housekeeping role
 * 
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 10)
 * @param filters - Optional filters (from, to)
 * @returns Promise with paginated assigned service requests
 */
export const getAssignedServiceRequests = async (
    page: number = 1,
    limit: number = 10,
    filters?: { from?: string; to?: string }
): Promise<ApiResponse<PaginatedResponse<IServiceRequest>>> => {
    try {
        const params: any = { page, limit };
        if (filters?.from) params.from = filters.from;
        if (filters?.to) params.to = filters.to;

        const response = await api.get<ApiResponse<PaginatedResponse<IServiceRequest>>>('/service-requests/assigned', {
            params
        });
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
 * Assign service request to a staff member
 * PATCH /api/service-requests/:id/assign
 * 
 * Admin only - assign service request to a housekeeping staff member
 * 
 * @param serviceRequestId - The ID of the service request to assign
 * @param staffId - The ID of the staff member to assign
 * @returns Promise with updated service request
 */
export const assignServiceRequest = async (
    serviceRequestId: string,
    staffId: string
): Promise<ApiResponse<IServiceRequest>> => {
    try {
        const response = await api.patch<ApiResponse<IServiceRequest>>(
            `/service-requests/${serviceRequestId}/assign`,
            { staffId }
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

/**
 * Update service request status
 * PATCH /api/service-requests/:id/status
 * 
 * Housekeeping and Admin only - update service request status
 * 
 * @param serviceRequestId - The ID of the service request to update
 * @param status - New status (pending, in_progress, completed)
 * @returns Promise with updated service request
 */
export const updateServiceRequestStatus = async (
    serviceRequestId: string,
    status: ServiceStatus
): Promise<ApiResponse<IServiceRequest>> => {
    try {
        const response = await api.patch<ApiResponse<IServiceRequest>>(
            `/service-requests/${serviceRequestId}/status`,
            { status }
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

