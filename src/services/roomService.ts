import api from '@/lib/api';
import { AxiosError } from 'axios';

/**
 * Query parameters for fetching rooms
 * Based on backend API specification in README.md
 * 
 * Supported parameters:
 * - hotelId: Filter by hotel ID
 * - roomType: Filter by room type (standard, deluxe, suite, presidential)
 * - status: Filter by room status (available, occupied, maintenance)
 * - minPrice: Filter by minimum price
 * - maxPrice: Filter by maximum price
 * - page: Page number for pagination (default: 1)
 * - limit: Number of items per page (default: 10)
 */
export interface GetRoomsParams {
    hotelId?: string;
    roomType?: RoomType;
    status?: RoomStatus;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
}

/**
 * Response structure for paginated rooms
 */
export interface GetRoomsResponse {
    rooms: IRoom[];
    pagination: {
        totalRooms: number;
        totalPages: number;
        currentPage: number;
        limit: number;
    };
}

/**
 * Get all rooms with optional filters and pagination
 * GET /rooms
 * 
 * This is a public endpoint that supports filtering by:
 * - Room type (standard, deluxe, suite, presidential)
 * - Status (available, occupied, maintenance)
 * - Price range (minPrice, maxPrice)
 * - Pagination (page, limit)
 * 
 * @param params - Optional query parameters for filtering and pagination
 * @returns Promise with paginated rooms response or array of rooms (backward compatible)
 */
export const getRooms = async (params?: GetRoomsParams): Promise<ApiResponse<IRoom[] | GetRoomsResponse>> => {
    try {
        const response = await api.get<any>('/rooms', {
            params: params || {}
        });

        // Backend always returns: { success, count, pagination, data }
        // If caller requested pagination (page/limit params), return structured response
        if (params?.page !== undefined || params?.limit !== undefined) {
            return {
                success: response.data.success,
                message: response.data.message,
                data: {
                    rooms: response.data.data,
                    pagination: response.data.pagination
                }
            };
        }

        // For backward compatibility: return just the array for non-paginated calls
        return {
            success: response.data.success,
            message: response.data.message,
            data: response.data.data
        };
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

