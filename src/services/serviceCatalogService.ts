import api from '@/lib/api';
import { AxiosError } from 'axios';

export const getServiceCatalog = async (hotelId: string): Promise<ApiResponse<IServiceCatalog[]>> => {
    try {
        const response = await api.get<ApiResponse<IServiceCatalog[]>>(`/hotels/${hotelId}/service-catalog`);
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

export const getServiceByType = async (hotelId: string, serviceType: string): Promise<ApiResponse<IServiceCatalog>> => {
    try {
        const response = await api.get<ApiResponse<IServiceCatalog>>(`/hotels/${hotelId}/service-catalog/${serviceType}`);
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
export const upsertServiceCatalog = async (hotelId: string, data: any): Promise<ApiResponse<IServiceCatalog>> => {
    try {
        const response = await api.post<ApiResponse<IServiceCatalog>>(`/hotels/${hotelId}/service-catalog`, data);
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

export const deleteServiceCatalog = async (hotelId: string, id: string): Promise<ApiResponse<any>> => {
    try {
        const response = await api.delete<ApiResponse<any>>(`/hotels/${hotelId}/service-catalog/${id}`);
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
