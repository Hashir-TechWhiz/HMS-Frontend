import api from '@/lib/api';
import { AxiosError } from 'axios';

/**
 * Room availability check result interface
 */
export interface AvailabilityCheckResult {
    available: boolean;
    roomId: string;
    checkInDate: string;
    checkOutDate: string;
}

/**
 * Payment data for booking creation
 */
export interface BookingPaymentData {
    amount: number;
    paymentMethod: 'card' | 'cash';
    transactionId?: string;
    notes?: string;
}

/**
 * Booking creation data interface
 * Based on backend API specification in README.md
 * 
 * Required fields:
 * - roomId: Room ID to book
 * - checkInDate: Check-in date (ISO string)
 * - checkOutDate: Check-out date (ISO string)
 * 
 * Optional fields:
 * - guestId: Guest ID (only for receptionist/admin booking for existing guest, ignored for guests)
 * - customerDetails: Customer details for walk-in bookings (only for receptionist/admin)
 * - paymentData: Payment data for optional/partial payment at booking
 */
export interface CreateBookingData {
    roomId: string;
    checkInDate: string; // ISO date string
    checkOutDate: string; // ISO date string
    guestId?: string; // Optional, only for receptionist/admin booking for existing guest
    customerDetails?: {
        name: string;
        phone: string;
        email?: string; // Optional
    };
    paymentData?: BookingPaymentData; // Optional payment data
}

/**
 * Check room availability for given dates
 * GET /api/bookings/check-availability
 * 
 * Public endpoint (no authentication required)
 * 
 * @param roomId - Room ID to check
 * @param checkInDate - Check-in date (ISO string)
 * @param checkOutDate - Check-out date (ISO string)
 * @returns Promise with availability status
 */
export const checkAvailability = async (
    roomId: string,
    checkInDate: string,
    checkOutDate: string
): Promise<ApiResponse<AvailabilityCheckResult>> => {
    try {
        const response = await api.get<ApiResponse<AvailabilityCheckResult>>(
            '/bookings/check-availability',
            {
                params: { roomId, checkInDate, checkOutDate }
            }
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
 * Create a new booking
 * POST /api/bookings
 * 
 * Authenticated users only (Guest, Receptionist, Admin)
 * Guests book for themselves, receptionist/admin can book for any guest
 * 
 * @param data - Booking creation data (roomId, checkInDate, checkOutDate, optional guestId)
 * @returns Promise with created booking data
 */
export const createBooking = async (data: CreateBookingData): Promise<ApiResponse<IBooking>> => {
    try {
        const response = await api.post<ApiResponse<IBooking>>('/bookings', data);
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
 * Get single booking by ID
 * GET /api/bookings/:id
 * 
 * @param bookingId - The ID of the booking to fetch
 * @returns Promise with booking details
 */
export const getBookingById = async (bookingId: string): Promise<ApiResponse<IBooking>> => {
    try {
        const response = await api.get<ApiResponse<IBooking>>(`/bookings/${bookingId}`);
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
 * Get all bookings (for receptionist/admin)
 * GET /api/bookings
 * 
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 10)
 * @param filters - Optional filters (from, to)
 * @returns Promise with paginated bookings
 */
export const getAllBookings = async (
    page: number = 1,
    limit: number = 10,
    filters?: { from?: string; to?: string }
): Promise<ApiResponse<PaginatedResponse<IBooking>>> => {
    try {
        const params: any = { page, limit };
        if (filters?.from) params.from = filters.from;
        if (filters?.to) params.to = filters.to;

        const response = await api.get<ApiResponse<PaginatedResponse<IBooking>>>('/bookings', {
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
 * Get my bookings (for guest users)
 * GET /api/bookings/my-bookings
 * 
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 10)
 * @param filters - Optional filters (from, to)
 * @returns Promise with paginated user bookings
 */
export const getMyBookings = async (
    page: number = 1,
    limit: number = 10,
    filters?: { from?: string; to?: string }
): Promise<ApiResponse<PaginatedResponse<IBooking>>> => {
    try {
        const params: any = { page, limit };
        if (filters?.from) params.from = filters.from;
        if (filters?.to) params.to = filters.to;

        const response = await api.get<ApiResponse<PaginatedResponse<IBooking>>>('/bookings/my-bookings', {
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
 * Cancel a booking
 * PATCH /api/bookings/:id/cancel
 * 
 * @param bookingId - The ID of the booking to cancel
 * @param penaltyData - Optional penalty data (for staff cancellations)
 * @returns Promise with updated booking data
 */
export const cancelBooking = async (
    bookingId: string,
    penaltyData?: { cancellationPenalty?: number; cancellationReason?: string }
): Promise<ApiResponse<IBooking>> => {
    try {
        const response = await api.patch<ApiResponse<IBooking>>(
            `/bookings/${bookingId}/cancel`,
            penaltyData || {}
        );
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
 * Confirm a booking
 * PATCH /api/bookings/:id/confirm
 * 
 * @param bookingId - The ID of the booking to confirm
 * @returns Promise with updated booking data
 */
export const confirmBooking = async (bookingId: string): Promise<ApiResponse<IBooking>> => {
    try {
        const response = await api.patch<ApiResponse<IBooking>>(`/bookings/${bookingId}/confirm`);
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
 * Check-in data interface
 */
export interface CheckInData {
    nicPassport: string;
    phoneNumber: string;
    country: string;
}

/**
 * Check-in a booking (manual action by staff or guest)
 * PATCH /api/bookings/:id/check-in
 * 
 * @param bookingId - The ID of the booking to check-in
 * @param data - Check-in detail data
 * @returns Promise with updated booking data
 */
export const checkInBooking = async (bookingId: string, data: CheckInData): Promise<ApiResponse<IBooking>> => {
    try {
        const response = await api.patch<ApiResponse<IBooking>>(`/bookings/${bookingId}/check-in`, data);
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
 * Check-out a booking (manual action by staff)
 * PATCH /api/bookings/:id/check-out
 * 
 * @param bookingId - The ID of the booking to check-out
 * @returns Promise with updated booking data
 */
export const checkOutBooking = async (bookingId: string): Promise<ApiResponse<IBooking>> => {
    try {
        const response = await api.patch<ApiResponse<IBooking>>(`/bookings/${bookingId}/check-out`);
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
