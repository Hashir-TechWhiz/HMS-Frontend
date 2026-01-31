import api from '@/lib/api';
import { AxiosError } from 'axios';

/**
 * Payment record interface
 */
export interface IPayment {
    amount: number;
    paymentMethod: 'card' | 'cash';
    paymentDate: string;
    processedBy?: {
        _id: string;
        name: string;
        email: string;
        role: string;
    };
    transactionId?: string;
    notes?: string;
}

/**
 * Payment data for adding a new payment
 */
export interface AddPaymentData {
    amount: number;
    paymentMethod: 'card' | 'cash';
    transactionId?: string;
    notes?: string;
}

/**
 * Booking payments response interface
 */
export interface IBookingPayments {
    bookingId: string;
    bookingStatus: string;
    room: {
        roomNumber: string;
        roomType: string;
        pricePerNight: number;
    };
    guest?: {
        name: string;
        email: string;
    };
    customerDetails?: {
        name: string;
        phone: string;
        email?: string;
    };
    checkInDate: string;
    checkOutDate: string;
    roomCharges: number;
    serviceCharges: number;
    serviceDetails?: Array<{
        serviceType: string;
        description: string;
        price: number;
        completedAt: string;
    }>;
    totalAmount: number;
    totalPaid: number;
    balance: number;
    paymentStatus: 'unpaid' | 'partially_paid' | 'paid';
    payments: IPayment[];
}

/**
 * My payments response interface
 */
export interface IMyPayments {
    payments: IBookingPayments[];
    pagination: {
        totalBookings: number;
        totalPages: number;
        currentPage: number;
        limit: number;
    };
}

/**
 * Booking balance response interface
 */
export interface IBookingBalance {
    bookingId: string;
    roomCharges: number;
    serviceCharges: number;
    totalAmount: number;
    totalPaid: number;
    balance: number;
    paymentStatus: 'unpaid' | 'partially_paid' | 'paid';
}

/**
 * Add payment to a booking
 * POST /api/payments/bookings/:bookingId/payments
 * 
 * @param bookingId - Booking ID
 * @param paymentData - Payment data
 * @returns Promise with updated booking
 */
export const addPayment = async (
    bookingId: string,
    paymentData: AddPaymentData
): Promise<ApiResponse<IBooking>> => {
    try {
        const response = await api.post<ApiResponse<IBooking>>(
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
 * Get all payments for a booking
 * GET /api/payments/bookings/:bookingId/payments
 * 
 * @param bookingId - Booking ID
 * @returns Promise with booking payments
 */
export const getBookingPayments = async (
    bookingId: string
): Promise<ApiResponse<IBookingPayments>> => {
    try {
        const response = await api.get<ApiResponse<IBookingPayments>>(
            `/payments/bookings/${bookingId}/payments`
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
 * Get all payments for current user's bookings (guest only)
 * GET /api/payments/my-payments
 * 
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 10)
 * @returns Promise with paginated payments
 */
export const getMyPayments = async (
    page: number = 1,
    limit: number = 10
): Promise<ApiResponse<IMyPayments>> => {
    try {
        const response = await api.get<ApiResponse<IMyPayments>>(
            '/payments/my-payments',
            { params: { page, limit } }
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
 * Get balance for a booking
 * GET /api/payments/bookings/:bookingId/balance
 * 
 * @param bookingId - Booking ID
 * @returns Promise with balance information
 */
export const getBookingBalance = async (
    bookingId: string
): Promise<ApiResponse<IBookingBalance>> => {
    try {
        const response = await api.get<ApiResponse<IBookingBalance>>(
            `/payments/bookings/${bookingId}/balance`
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
