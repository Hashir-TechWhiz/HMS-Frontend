import api from '@/lib/api';
import { AxiosError } from 'axios';

/**
 * Invoice interface matching backend model
 */
export interface IInvoice {
    _id: string;
    invoiceNumber: string;
    booking: string;
    hotelId: string;
    guest?: string;
    guestDetails: {
        name: string;
        email: string;
        phone?: string;
    };
    hotelDetails: {
        name: string;
        address: string;
        city: string;
        country: string;
        contactEmail: string;
        contactPhone: string;
    };
    stayDetails: {
        roomNumber: string;
        roomType: string;
        checkInDate: string;
        checkOutDate: string;
        numberOfNights: number;
    };
    roomCharges: {
        pricePerNight: number;
        numberOfNights: number;
        subtotal: number;
    };
    serviceCharges: Array<{
        serviceRequestId: string;
        serviceType: string;
        description: string;
        quantity: number;
        unitPrice: number;
        total: number;
    }>;
    summary: {
        roomChargesTotal: number;
        serviceChargesTotal: number;
        subtotal: number;
        tax: number;
        grandTotal: number;
    };
    paymentStatus: 'pending' | 'paid' | 'partially_paid' | 'refunded';
    generatedBy?: string;
    emailSent: boolean;
    emailSentAt?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

/**
 * API response interface
 */
interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}

/**
 * API error response interface
 */
interface ApiErrorResponse {
    success: false;
    message: string;
}

/**
 * Get invoice by booking ID
 * GET /api/invoices/booking/:bookingId
 * 
 * @param bookingId - The ID of the booking
 * @returns Promise with invoice data
 */
export const getInvoiceByBookingId = async (bookingId: string): Promise<ApiResponse<IInvoice>> => {
    try {
        const response = await api.get<ApiResponse<IInvoice>>(`/invoices/booking/${bookingId}`);
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
 * Get invoice by invoice number
 * GET /api/invoices/:invoiceNumber
 * 
 * @param invoiceNumber - The invoice number
 * @returns Promise with invoice data
 */
export const getInvoiceByNumber = async (invoiceNumber: string): Promise<ApiResponse<IInvoice>> => {
    try {
        const response = await api.get<ApiResponse<IInvoice>>(`/invoices/${invoiceNumber}`);
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
 * Download invoice PDF
 * GET /api/invoices/:invoiceId/download
 * 
 * @param invoiceId - The ID of the invoice
 * @param invoiceNumber - The invoice number (for filename)
 * @returns Promise that triggers browser download
 */
export const downloadInvoicePDF = async (invoiceId: string, invoiceNumber: string): Promise<void> => {
    try {
        const response = await api.get(`/invoices/${invoiceId}/download`, {
            responseType: 'blob', // Important for PDF download
        });

        // Create blob from response
        const blob = new Blob([response.data], { type: 'application/pdf' });

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Invoice-${invoiceNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading invoice PDF:', error);
        throw error;
    }
};

/**
 * Resend invoice email (admin/receptionist only)
 * POST /api/invoices/:invoiceId/resend
 * 
 * @param invoiceId - The ID of the invoice
 * @returns Promise with updated invoice data
 */
export const resendInvoiceEmail = async (invoiceId: string): Promise<ApiResponse<IInvoice>> => {
    try {
        const response = await api.post<ApiResponse<IInvoice>>(`/invoices/${invoiceId}/resend`);
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
 * Generate invoice manually (admin/receptionist only)
 * POST /api/invoices/generate/:bookingId
 * 
 * @param bookingId - The ID of the booking
 * @param sendEmail - Whether to send email (default: true)
 * @returns Promise with generated invoice data
 */
export const generateInvoice = async (
    bookingId: string,
    sendEmail: boolean = true
): Promise<ApiResponse<IInvoice>> => {
    try {
        const response = await api.post<ApiResponse<IInvoice>>(
            `/invoices/generate/${bookingId}`,
            { sendEmail }
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
 * Update invoice payment status (admin/receptionist only)
 * PATCH /api/invoices/:invoiceId/payment-status
 * 
 * @param invoiceId - The ID of the invoice
 * @param paymentData - Payment status data
 * @returns Promise with updated invoice data
 */
export const updatePaymentStatus = async (
    invoiceId: string,
    paymentData: { paymentStatus: 'pending' | 'paid' | 'partially_paid' | 'refunded' }
): Promise<ApiResponse<IInvoice>> => {
    try {
        const response = await api.patch<ApiResponse<IInvoice>>(
            `/invoices/${invoiceId}/payment-status`,
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
 * Get all invoices (admin/receptionist only)
 * GET /api/invoices
 * 
 * @param params - Filter and pagination parameters
 * @returns Promise with invoices list
 */
export const getAllInvoices = async (params?: {
    hotelId?: string;
    paymentStatus?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
}): Promise<ApiResponse<{
    invoices: IInvoice[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}>> => {
    try {
        const response = await api.get<ApiResponse<{
            invoices: IInvoice[];
            pagination: {
                total: number;
                page: number;
                limit: number;
                pages: number;
            };
        }>>('/invoices', { params });
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
