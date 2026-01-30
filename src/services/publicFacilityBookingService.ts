import api from '@/lib/api';
import { AxiosError } from 'axios';

/**
 * Facility availability check result interface
 */
export interface FacilityAvailabilityCheckResult {
    available: boolean;
    facilityId: string;
    startDate: string;
    endDate: string;
    startTime?: string;
    endTime?: string;
}

/**
 * Facility booking creation data interface
 */
export interface CreateFacilityBookingData {
    facility: string;
    bookingType: FacilityBookingType;
    startDate: string; // ISO date string
    endDate: string; // ISO date string
    startTime?: string; // HH:MM format for hourly bookings
    endTime?: string; // HH:MM format for hourly bookings
    numberOfGuests: number;
    purpose?: string;
    specialRequests?: string;
    guestId?: string; // Optional, only for receptionist/admin booking for existing guest
    customerDetails?: {
        name: string;
        phone: string;
        email?: string;
    };
}

/**
 * Check facility availability for given date/time
 * GET /api/public-facility-bookings/check-availability
 * Public endpoint
 */
export const checkFacilityAvailability = async (
    facilityId: string,
    startDate: string,
    endDate: string,
    startTime?: string,
    endTime?: string
): Promise<ApiResponse<FacilityAvailabilityCheckResult>> => {
    try {
        const params: any = { facilityId, startDate, endDate };
        if (startTime) params.startTime = startTime;
        if (endTime) params.endTime = endTime;

        const response = await api.get<ApiResponse<FacilityAvailabilityCheckResult>>(
            '/public-facility-bookings/check-availability',
            { params }
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
 * Create a new facility booking
 * POST /api/public-facility-bookings
 * Authenticated users only
 */
export const createFacilityBooking = async (
    data: CreateFacilityBookingData
): Promise<ApiResponse<IPublicFacilityBooking>> => {
    try {
        const response = await api.post<ApiResponse<IPublicFacilityBooking>>(
            '/public-facility-bookings',
            data
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
 * Get all facility bookings
 * GET /api/public-facility-bookings
 * Authenticated users only
 */
export const getAllFacilityBookings = async (
    page: number = 1,
    limit: number = 10,
    filters?: {
        status?: FacilityBookingStatus;
        facilityId?: string;
        from?: string;
        to?: string;
    }
): Promise<ApiResponse<PaginatedResponse<IPublicFacilityBooking>>> => {
    try {
        const params: any = { page, limit };
        if (filters?.status) params.status = filters.status;
        if (filters?.facilityId) params.facilityId = filters.facilityId;
        if (filters?.from) params.from = filters.from;
        if (filters?.to) params.to = filters.to;

        const response = await api.get<ApiResponse<PaginatedResponse<IPublicFacilityBooking>>>(
            '/public-facility-bookings',
            { params }
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
 * Get single facility booking by ID
 * GET /api/public-facility-bookings/:id
 * Authenticated users only
 */
export const getFacilityBookingById = async (
    bookingId: string
): Promise<ApiResponse<IPublicFacilityBooking>> => {
    try {
        const response = await api.get<ApiResponse<IPublicFacilityBooking>>(
            `/public-facility-bookings/${bookingId}`
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
 * Cancel a facility booking
 * PATCH /api/public-facility-bookings/:id/cancel
 * Authenticated users only
 */
export const cancelFacilityBooking = async (
    bookingId: string,
    penaltyData?: { penalty?: number; reason?: string }
): Promise<ApiResponse<IPublicFacilityBooking>> => {
    try {
        const response = await api.patch<ApiResponse<IPublicFacilityBooking>>(
            `/public-facility-bookings/${bookingId}/cancel`,
            penaltyData || {}
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
 * Confirm a facility booking
 * PATCH /api/public-facility-bookings/:id/confirm
 * Receptionist and Admin only
 */
export const confirmFacilityBooking = async (
    bookingId: string
): Promise<ApiResponse<IPublicFacilityBooking>> => {
    try {
        const response = await api.patch<ApiResponse<IPublicFacilityBooking>>(
            `/public-facility-bookings/${bookingId}/confirm`
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
 * Check-in a facility booking
 * PATCH /api/public-facility-bookings/:id/check-in
 * Receptionist and Admin only
 */
export const checkInFacilityBooking = async (
    bookingId: string
): Promise<ApiResponse<IPublicFacilityBooking>> => {
    try {
        const response = await api.patch<ApiResponse<IPublicFacilityBooking>>(
            `/public-facility-bookings/${bookingId}/check-in`
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
 * Check-out a facility booking
 * PATCH /api/public-facility-bookings/:id/check-out
 * Receptionist and Admin only
 */
export const checkOutFacilityBooking = async (
    bookingId: string
): Promise<ApiResponse<IPublicFacilityBooking>> => {
    try {
        const response = await api.patch<ApiResponse<IPublicFacilityBooking>>(
            `/public-facility-bookings/${bookingId}/check-out`
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
 * Add payment to facility booking
 * POST /api/payments/bookings/:bookingId/payments
 * Authenticated users only
 */
export const addFacilityPayment = async (
    bookingId: string,
    paymentData: {
        bookingType: 'facility';
        amount: number;
        paymentMethod: PaymentMethod;
        transactionId?: string;
        notes?: string;
    }
): Promise<ApiResponse<IPublicFacilityBooking>> => {
    try {
        const response = await api.post<ApiResponse<IPublicFacilityBooking>>(
            `/payments/bookings/${bookingId}/payments`,
            paymentData
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
 * Get facility booking payments
 * GET /api/payments/facility-bookings/:bookingId/payments
 * Authenticated users only
 */
export const getFacilityBookingPayments = async (
    bookingId: string
): Promise<ApiResponse<any>> => {
    try {
        const response = await api.get<ApiResponse<any>>(
            `/payments/facility-bookings/${bookingId}/payments`
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
 * Get facility booking balance
 * GET /api/payments/facility-bookings/:bookingId/balance
 * Authenticated users only
 */
export const getFacilityBookingBalance = async (
    bookingId: string
): Promise<ApiResponse<any>> => {
    try {
        const response = await api.get<ApiResponse<any>>(
            `/payments/facility-bookings/${bookingId}/balance`
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
