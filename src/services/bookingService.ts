import api from '@/lib/api';
import { AxiosError } from 'axios';

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
}

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
 * @returns Promise with updated booking data
 */
export const cancelBooking = async (bookingId: string): Promise<ApiResponse<IBooking>> => {
    try {
        const response = await api.patch<ApiResponse<IBooking>>(`/bookings/${bookingId}/cancel`);
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

