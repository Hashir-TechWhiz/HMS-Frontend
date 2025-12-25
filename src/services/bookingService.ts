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
        throw error;
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
        throw error;
    }
};

