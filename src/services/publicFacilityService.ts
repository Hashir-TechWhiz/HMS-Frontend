import api from '@/lib/api';
import { AxiosError } from 'axios';

/**
 * Query parameters for fetching public facilities
 */
export interface GetPublicFacilitiesParams {
    hotelId?: string;
    facilityType?: FacilityType;
    status?: FacilityStatus;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
}

/**
 * Response structure for paginated facilities
 */
export interface GetPublicFacilitiesResponse {
    facilities: IPublicFacility[];
    pagination: {
        total: number;
        pages: number;
        page: number;
        limit: number;
    };
}

/**
 * Get all public facilities with optional filters and pagination
 * GET /api/public-facilities
 * Public endpoint
 */
export const getPublicFacilities = async (
    params?: GetPublicFacilitiesParams
): Promise<ApiResponse<IPublicFacility[] | GetPublicFacilitiesResponse>> => {
    try {
        const response = await api.get<any>('/public-facilities', {
            params: params || {}
        });

        // If pagination requested, return structured response
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
 * GET /api/public-facilities/hotel/:hotelId
 * Public endpoint
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
 * GET /api/public-facilities/:id
 * Public endpoint
 */
export const getPublicFacilityById = async (facilityId: string): Promise<ApiResponse<IPublicFacility>> => {
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
 * Create a new public facility (Admin only)
 * POST /api/public-facilities
 */
export const createPublicFacility = async (facilityData: {
    hotelId?: string;
    name: string;
    facilityType: FacilityType;
    description?: string;
    capacity: number;
    pricePerHour: number;
    pricePerDay?: number;
    amenities?: string[];
    images: string[];
    operatingHours: {
        start: string;
        end: string;
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
 * Update a public facility (Admin only)
 * PATCH /api/public-facilities/:id
 */
export const updatePublicFacility = async (
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
            start: string;
            end: string;
        };
        status: FacilityStatus;
    }>
): Promise<ApiResponse<IPublicFacility>> => {
    try {
        const response = await api.patch<ApiResponse<IPublicFacility>>(
            `/public-facilities/${facilityId}`,
            facilityData
        );
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        throw error;
    }
};

/**
 * Delete a public facility (Admin only)
 * DELETE /api/public-facilities/:id
 */
export const deletePublicFacility = async (facilityId: string): Promise<ApiResponse<any>> => {
    try {
        const response = await api.delete<ApiResponse<any>>(`/public-facilities/${facilityId}`);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        throw error;
    }
};
