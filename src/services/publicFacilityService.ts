import api from '@/lib/api';
import { AxiosError } from 'axios';

/**
 * Query parameters for fetching public facilities
 * Based on backend API specification
 * 
 * Supported parameters:
 * - hotelId: Filter by hotel ID
 * - facilityType: Filter by facility type
 * - status: Filter by facility status (available, unavailable, maintenance)
 * - minPricePerHour: Filter by minimum hourly price
 * - maxPricePerHour: Filter by maximum hourly price
 * - minPricePerDay: Filter by minimum daily price
 * - maxPricePerDay: Filter by maximum daily price
 * - page: Page number for pagination (default: 1)
 * - limit: Number of items per page (default: 10)
 */
export interface GetFacilitiesParams {
    hotelId?: string;
    facilityType?: FacilityType;
    status?: FacilityStatus;
    minPricePerHour?: number;
    maxPricePerHour?: number;
    minPricePerDay?: number;
    maxPricePerDay?: number;
    page?: number;
    limit?: number;
}

/**
 * Response structure for paginated facilities
 */
export interface GetFacilitiesResponse {
    facilities: IPublicFacility[];
    pagination: {
        totalFacilities: number;
        totalPages: number;
        currentPage: number;
        limit: number;
    };
}

/**
 * Get all public facilities with optional filters and pagination
 * GET /public-facilities
 * 
 * This is a public endpoint that supports filtering by:
 * - Facility type (Event Hall, Pool, Gym, etc.)
 * - Status (available, unavailable, maintenance)
 * - Price range
 * - Pagination (page, limit)
 * 
 * @param params - Optional query parameters for filtering and pagination
 * @returns Promise with paginated facilities response or array of facilities
 */
export const getFacilities = async (params?: GetFacilitiesParams): Promise<ApiResponse<IPublicFacility[] | GetFacilitiesResponse>> => {
    try {
        const response = await api.get<any>('/public-facilities', {
            params: params || {}
        });

        // If caller requested pagination, return structured response
        if (params?.page !== undefined || params?.limit !== undefined) {
            return {
                success: response.data.success,
                message: response.data.message,
                data: {
                    facilities: response.data.data,
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
 * Get facilities by hotel ID
 * GET /public-facilities/hotel/:hotelId
 * 
 * @param hotelId - The ID of the hotel
 * @returns Promise with facilities for the hotel
 */
export const getFacilitiesByHotel = async (hotelId: string): Promise<ApiResponse<IPublicFacility[]>> => {
    try {
        const response = await api.get<ApiResponse<IPublicFacility[]>>(`/public-facilities/hotel/${hotelId}`);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        throw error;
    }
};

/**
 * Get single facility by ID
 * GET /public-facilities/:id
 * 
 * @param facilityId - The ID of the facility to fetch
 * @returns Promise with facility details
 */
export const getFacilityById = async (facilityId: string): Promise<ApiResponse<IPublicFacility>> => {
    try {
        const response = await api.get<ApiResponse<IPublicFacility>>(`/public-facilities/${facilityId}`);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        throw error;
    }
};

/**
 * Create a new facility (Admin only)
 * POST /public-facilities
 * 
 * @param facilityData - Facility data to create
 * @returns Promise with created facility
 */
export const createFacility = async (facilityData: {
    name: string;
    facilityType: FacilityType;
    description?: string;
    capacity: number;
    pricePerHour?: number;
    pricePerDay?: number;
    amenities?: string[];
    images: string[];
    operatingHours?: {
        open: string;
        close: string;
    };
    status?: FacilityStatus;
}): Promise<ApiResponse<IPublicFacility>> => {
    try {
        const response = await api.post<ApiResponse<IPublicFacility>>('/public-facilities', facilityData);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        throw error;
    }
};

/**
 * Update a facility (Admin only)
 * PATCH /public-facilities/:id
 * 
 * @param facilityId - The ID of the facility to update
 * @param facilityData - Facility data to update
 * @returns Promise with updated facility
 */
export const updateFacility = async (
    facilityId: string,
    facilityData: Partial<{
        name: string;
        facilityType: FacilityType;
        description: string;
        capacity: number;
        pricePerHour: number;
        pricePerDay: number;
        amenities: string[];
        images: string[];
        operatingHours: {
            open: string;
            close: string;
        };
        status: FacilityStatus;
    }>
): Promise<ApiResponse<IPublicFacility>> => {
    try {
        const response = await api.patch<ApiResponse<IPublicFacility>>(`/public-facilities/${facilityId}`, facilityData);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        throw error;
    }
};

/**
 * Delete a facility (Admin only)
 * DELETE /public-facilities/:id
 * 
 * @param facilityId - The ID of the facility to delete
 * @returns Promise with deleted facility
 */
export const deleteFacility = async (facilityId: string): Promise<ApiResponse<IPublicFacility>> => {
    try {
        const response = await api.delete<ApiResponse<IPublicFacility>>(`/public-facilities/${facilityId}`);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        throw error;
    }
};
