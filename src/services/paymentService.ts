import api from "@/lib/api";

export interface AddPaymentData {
    amount: number;
    paymentMethod: PaymentMethod;
    transactionId?: string;
    notes?: string;
}

export interface PaymentBalanceResponse {
    bookingId: string;
    totalAmount: number;
    totalPaid: number;
    balance: number;
    paymentStatus: PaymentStatus;
}

export interface ServiceDetail {
    serviceType: string;
    description: string;
    price: number;
    completedAt: string;
}

export interface BookingPaymentsResponse {
    bookingId: string;
    bookingStatus: BookingStatus;
    room: IRoom;
    guest?: IUser;
    customerDetails?: {
        name: string;
        phone: string;
        email?: string;
    };
    checkInDate: string;
    checkOutDate: string;
    roomCharges: number;
    serviceCharges: number;
    serviceDetails: ServiceDetail[];
    totalAmount: number;
    totalPaid: number;
    balance: number;
    paymentStatus: PaymentStatus;
    payments: IPayment[];
}

export interface MyPaymentsResponse {
    payments: {
        bookingId: string;
        bookingStatus: BookingStatus;
        room: IRoom;
        checkInDate: string;
        checkOutDate: string;
        roomCharges: number;
        serviceCharges: number;
        serviceDetails: ServiceDetail[];
        totalAmount: number;
        totalPaid: number;
        balance: number;
        paymentStatus: PaymentStatus;
        payments: IPayment[];
        createdAt: string;
    }[];
    pagination: {
        totalBookings: number;
        totalPages: number;
        currentPage: number;
        limit: number;
    };
}

/**
 * Add payment to a booking
 * @param bookingId - Booking ID
 * @param paymentData - Payment data
 * @returns Updated booking
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
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || "Failed to add payment",
        };
    }
};

/**
 * Get all payments for a booking
 * @param bookingId - Booking ID
 * @returns Booking payments
 */
export const getBookingPayments = async (
    bookingId: string
): Promise<ApiResponse<BookingPaymentsResponse>> => {
    try {
        const response = await api.get<ApiResponse<BookingPaymentsResponse>>(
            `/payments/bookings/${bookingId}/payments`
        );
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || "Failed to get booking payments",
        };
    }
};

/**
 * Get all payments for current user's bookings (guest only)
 * @param page - Page number
 * @param limit - Items per page
 * @returns Paginated payments
 */
export const getMyPayments = async (
    page: number = 1,
    limit: number = 10
): Promise<ApiResponse<MyPaymentsResponse>> => {
    try {
        const response = await api.get<ApiResponse<MyPaymentsResponse>>(
            `/payments/my-payments`,
            {
                params: { page, limit },
            }
        );
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || "Failed to get payments",
        };
    }
};

/**
 * Get balance for a booking
 * @param bookingId - Booking ID
 * @returns Balance information
 */
export const getBookingBalance = async (
    bookingId: string
): Promise<ApiResponse<PaymentBalanceResponse>> => {
    try {
        const response = await api.get<ApiResponse<PaymentBalanceResponse>>(
            `/payments/bookings/${bookingId}/balance`
        );
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || "Failed to get booking balance",
        };
    }
};

/**
 * Get all payments (admin/receptionist only)
 * @param filters - Filter options
 * @param page - Page number
 * @param limit - Items per page
 * @returns Paginated payments
 */
export const getAllPayments = async (
    filters: {
        hotelId?: string;
        paymentStatus?: PaymentStatus;
        from?: string;
        to?: string;
    } = {},
    page: number = 1,
    limit: number = 10
): Promise<ApiResponse<MyPaymentsResponse>> => {
    try {
        const response = await api.get<ApiResponse<MyPaymentsResponse>>(
            `/payments`,
            {
                params: { ...filters, page, limit },
            }
        );
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            message: error.response?.data?.message || "Failed to get payments",
        };
    }
};
