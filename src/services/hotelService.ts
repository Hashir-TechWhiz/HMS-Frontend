import api from '@/lib/api';
import { AxiosError } from 'axios';

/**
 * Hotel Service
 * Handles all hotel-related API calls
 */

/**
 * Query parameters for fetching hotels
 */
export interface GetHotelsParams {
    status?: HotelStatus;
    city?: string;
    country?: string;
    page?: number;
    limit?: number;
}

/**
 * Response structure for paginated hotels
 */
export interface GetHotelsResponse {
    hotels: IHotel[];
    pagination: {
        totalHotels: number;
        totalPages: number;
        currentPage: number;
        limit: number;
    };
}

/**
 * Get all hotels with optional filters and pagination (Admin only)
 * GET /hotels
 */
export const getHotels = async (params?: GetHotelsParams): Promise<ApiResponse<IHotel[] | GetHotelsResponse>> => {
    try {
        const response = await api.get<any>('/hotels', {
            params: params || {}
        });

        // If pagination params provided, return structured response
        if (params?.page !== undefined || params?.limit !== undefined) {
            return {
                success: response.data.success,
                message: response.data.message,
                data: {
                    hotels: response.data.data,
                    pagination: response.data.pagination
                }
            };
        }

        // For backward compatibility: return just the array
        return {
            success: response.data.success,
            message: response.data.message,
            data: response.data.data
        };
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        throw error;
    }
};

/**
 * Get all active hotels (for selection/dropdown)
 * GET /hotels/active
 * Available to all authenticated users
 */
export const getActiveHotels = async (): Promise<ApiResponse<IHotel[]>> => {
    try {
        const response = await api.get<ApiResponse<IHotel[]>>('/hotels/active');
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        throw error;
    }
};

/**
 * Get all active hotels for public browsing (no authentication required)
 * GET /hotels/public/active
 * Used on home page for city/destination selection
 * Available to all users (public access)
 */
export const getPublicActiveHotels = async (): Promise<ApiResponse<IHotel[]>> => {
    try {
        const response = await api.get<ApiResponse<IHotel[]>>('/hotels/public/active');
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        throw error;
    }
};

/**
 * Get single hotel by ID (Admin only)
 * GET /hotels/:id
 */
export const getHotelById = async (hotelId: string): Promise<ApiResponse<IHotel>> => {
    try {
        const response = await api.get<ApiResponse<IHotel>>(`/hotels/${hotelId}`);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        throw error;
    }
};

/**
 * Create a new hotel (Admin only)
 * POST /hotels
 */
export const createHotel = async (hotelData: {
    name: string;
    code: string;
    address: string;
    city: string;
    country: string;
    contactEmail: string;
    contactPhone: string;
    status?: HotelStatus;
}): Promise<ApiResponse<IHotel>> => {
    try {
        const response = await api.post<ApiResponse<IHotel>>('/hotels', hotelData);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        throw error;
    }
};

/**
 * Update a hotel (Admin only)
 * PATCH /hotels/:id
 */
export const updateHotel = async (
    hotelId: string,
    hotelData: Partial<{
        name: string;
        code: string;
        address: string;
        city: string;
        country: string;
        contactEmail: string;
        contactPhone: string;
        status: HotelStatus;
    }>
): Promise<ApiResponse<IHotel>> => {
    try {
        const response = await api.patch<ApiResponse<IHotel>>(`/hotels/${hotelId}`, hotelData);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        throw error;
    }
};

/**
 * Delete a hotel (Admin only)
 * DELETE /hotels/:id
 */
export const deleteHotel = async (hotelId: string): Promise<ApiResponse<IHotel>> => {
    try {
        const response = await api.delete<ApiResponse<IHotel>>(`/hotels/${hotelId}`);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        throw error;
    }
};
