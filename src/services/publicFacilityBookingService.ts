import api from '@/lib/api';
import { AxiosError } from 'axios';

/**
 * Query parameters for fetching facility bookings
 */
export interface GetFacilityBookingsParams {
    status?: FacilityBookingStatus;
    facilityId?: string;
    facilityType?: FacilityType;
    bookingType?: FacilityBookingType;
    from?: string; // ISO date string
    to?: string; // ISO date string
    page?: number;
    limit?: number;
}

/**
 * Response structure for paginated facility bookings
 */
export interface GetFacilityBookingsResponse {
    bookings: IPublicFacilityBooking[];
    pagination: {
        totalBookings: number;
        totalPages: number;
        currentPage: number;
        limit: number;
    };
}

/**
 * Check facility availability
 * GET /public-facility-bookings/check-availability
 * 
 * @param params - Availability check parameters
 * @returns Promise with availability status
 */
export const checkFacilityAvailability = async (params: IFacilityAvailabilityParams): Promise<ApiResponse<{ available: boolean; message?: string }>> => {
    try {
        const response = await api.get<ApiResponse<{ available: boolean; message?: string }>>('/public-facility-bookings/check-availability', {
            params
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
 * Create a new facility booking
 * POST /public-facility-bookings
 * 
 * @param bookingData - Booking data to create
 * @returns Promise with created booking
 */
export const createFacilityBooking = async (bookingData: {
    facilityId: string;
    customerDetails?: {
        name: string;
        phone: string;
        email?: string;
    };
    bookingType: FacilityBookingType;
    numberOfGuests?: number; // Optional, defaults to 1 on backend
    bookingDate?: string; // For hourly bookings (will be converted to startDate/endDate)
    startTime?: string; // For hourly bookings
    endTime?: string; // For hourly bookings
    startDate?: string; // For daily bookings
    endDate?: string; // For daily bookings
}): Promise<ApiResponse<IPublicFacilityBooking>> => {
    try {
        const response = await api.post<ApiResponse<IPublicFacilityBooking>>('/public-facility-bookings', bookingData);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        throw error;
    }
};

/**
 * Get all facility bookings with optional filters
 * GET /public-facility-bookings
 * 
 * @param params - Optional query parameters for filtering
 * @returns Promise with bookings
 */
export const getFacilityBookings = async (params?: GetFacilityBookingsParams): Promise<ApiResponse<IPublicFacilityBooking[] | GetFacilityBookingsResponse>> => {
    try {
        const response = await api.get<any>('/public-facility-bookings', {
            params: params || {}
        });

        // If caller requested pagination, return structured response
        if (params?.page !== undefined || params?.limit !== undefined) {
            return {
                success: response.data.success,
                message: response.data.message,
                data: {
                    bookings: response.data.data,
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
 * Get single facility booking by ID
 * GET /public-facility-bookings/:id
 * 
 * @param bookingId - The ID of the booking to fetch
 * @returns Promise with booking details
 */
export const getFacilityBookingById = async (bookingId: string): Promise<ApiResponse<IPublicFacilityBooking>> => {
    try {
        const response = await api.get<ApiResponse<IPublicFacilityBooking>>(`/public-facility-bookings/${bookingId}`);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        throw error;
    }
};

/**
 * Cancel a facility booking
 * PATCH /public-facility-bookings/:id/cancel
 * 
 * @param bookingId - The ID of the booking to cancel
 * @param reason - Optional cancellation reason
 * @param penalty - Optional cancellation penalty (staff only)
 * @returns Promise with cancelled booking
 */
export const cancelFacilityBooking = async (
    bookingId: string,
    reason?: string,
    penalty?: number
): Promise<ApiResponse<IPublicFacilityBooking>> => {
    try {
        const response = await api.patch<ApiResponse<IPublicFacilityBooking>>(
            `/public-facility-bookings/${bookingId}/cancel`,
            { reason, penalty }
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
 * Confirm a facility booking (Receptionist/Admin only)
 * PATCH /public-facility-bookings/:id/confirm
 * 
 * @param bookingId - The ID of the booking to confirm
 * @returns Promise with confirmed booking
 */
export const confirmFacilityBooking = async (bookingId: string): Promise<ApiResponse<IPublicFacilityBooking>> => {
    try {
        const response = await api.patch<ApiResponse<IPublicFacilityBooking>>(
            `/public-facility-bookings/${bookingId}/confirm`
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
 * Check-in a facility booking (Receptionist/Admin only)
 * PATCH /public-facility-bookings/:id/check-in
 * 
 * @param bookingId - The ID of the booking to check-in
 * @returns Promise with checked-in booking
 */
export const checkInFacilityBooking = async (bookingId: string): Promise<ApiResponse<IPublicFacilityBooking>> => {
    try {
        const response = await api.patch<ApiResponse<IPublicFacilityBooking>>(
            `/public-facility-bookings/${bookingId}/check-in`
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
 * Check-out a facility booking (Receptionist/Admin only)
 * PATCH /public-facility-bookings/:id/check-out
 * 
 * @param bookingId - The ID of the booking to check-out
 * @param additionalCharges - Optional additional charges
 * @returns Promise with checked-out booking
 */
export const checkOutFacilityBooking = async (
    bookingId: string,
    additionalCharges?: number
): Promise<ApiResponse<IPublicFacilityBooking>> => {
    try {
        const response = await api.patch<ApiResponse<IPublicFacilityBooking>>(
            `/public-facility-bookings/${bookingId}/check-out`,
            { additionalCharges }
        );
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        throw error;
    }
};
