import api from '@/lib/api';
import { AxiosError } from 'axios';

export const generateInvoice = async (bookingId: string): Promise<ApiResponse<IInvoice>> => {
    try {
        const response = await api.post<ApiResponse<IInvoice>>(`/invoices/generate/${bookingId}`);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        return {
            success: false,
            message: 'An unexpected error occurred'
        };
    }
};

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
            message: 'An unexpected error occurred'
        };
    }
};

export const updatePaymentStatus = async (
    invoiceId: string,
    data: { paidAmount?: number, paymentStatus?: string }
): Promise<ApiResponse<IInvoice>> => {
    try {
        const response = await api.patch<ApiResponse<IInvoice>>(`/invoices/${invoiceId}/payment`, data);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        return {
            success: false,
            message: 'An unexpected error occurred'
        };
    }
};

export const getAllInvoices = async (
    page: number = 1,
    limit: number = 10,
    filters?: { paymentStatus?: string, from?: string, to?: string }
): Promise<ApiResponse<PaginatedResponse<IInvoice>>> => {
    try {
        const params: any = { page, limit, ...filters };
        const response = await api.get<ApiResponse<PaginatedResponse<IInvoice>>>('/invoices', { params });
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        return {
            success: false,
            message: 'An unexpected error occurred'
        };
    }
};
