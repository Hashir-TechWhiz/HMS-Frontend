import api from '@/lib/api';
import { AxiosError } from 'axios';

/**
 * Query parameters for fetching rooms
 * Based on backend API specification in README.md
 * 
 * Supported parameters:
 * - roomType: Filter by room type (standard, deluxe, suite, presidential)
 * - status: Filter by room status (available, occupied, maintenance)
 * - minPrice: Filter by minimum price
 * - maxPrice: Filter by maximum price
 */
export interface GetRoomsParams {
    roomType?: RoomType;
    status?: RoomStatus;
    minPrice?: number;
    maxPrice?: number;
}

/**
 * Get all rooms with optional filters
 * GET /rooms
 * 
 * This is a public endpoint that supports filtering by:
 * - Room type (standard, deluxe, suite, presidential)
 * - Status (available, occupied, maintenance)
 * - Price range (minPrice, maxPrice)
 * 
 * @param params - Optional query parameters for filtering rooms
 * @returns Promise with array of rooms
 */
export const getRooms = async (params?: GetRoomsParams): Promise<ApiResponse<IRoom[]>> => {
    try {
        const response = await api.get<ApiResponse<IRoom[]>>('/rooms', {
            params: params || {}
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
 * Get single room by ID
 * GET /rooms/:id
 * 
 * @param roomId - The ID of the room to fetch
 * @returns Promise with room details
 */
export const getRoomById = async (roomId: string): Promise<ApiResponse<IRoom>> => {
    try {
        const response = await api.get<ApiResponse<IRoom>>(`/rooms/${roomId}`);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        throw error;
    }
};

/**
 * Create a new room (Admin only)
 * POST /rooms
 * 
 * @param roomData - Room data to create
 * @returns Promise with created room
 */
export const createRoom = async (roomData: {
    roomNumber: string;
    roomType: RoomType;
    pricePerNight: number;
    capacity: number;
    description?: string;
    images: string[];
    status?: RoomStatus;
}): Promise<ApiResponse<IRoom>> => {
    try {
        const response = await api.post<ApiResponse<IRoom>>('/rooms', roomData);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        throw error;
    }
};

/**
 * Update a room (Admin only)
 * PATCH /rooms/:id
 * 
 * @param roomId - The ID of the room to update
 * @param roomData - Room data to update
 * @returns Promise with updated room
 */
export const updateRoom = async (
    roomId: string,
    roomData: Partial<{
        roomNumber: string;
        roomType: RoomType;
        pricePerNight: number;
        capacity: number;
        description: string;
        images: string[];
        status: RoomStatus;
    }>
): Promise<ApiResponse<IRoom>> => {
    try {
        const response = await api.patch<ApiResponse<IRoom>>(`/rooms/${roomId}`, roomData);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        throw error;
    }
};

/**
 * Delete a room (Admin only)
 * DELETE /rooms/:id
 * 
 * @param roomId - The ID of the room to delete
 * @returns Promise with deleted room
 */
export const deleteRoom = async (roomId: string): Promise<ApiResponse<IRoom>> => {
    try {
        const response = await api.delete<ApiResponse<IRoom>>(`/rooms/${roomId}`);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        throw error;
    }
};

