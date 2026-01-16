import api from '@/lib/api';
import { AxiosError } from 'axios';

/**
 * Query parameters for fetching rosters
 */
export interface GetRostersParams {
    hotelId?: string;
    staffId?: string;
    date?: string; // ISO date string
    shiftType?: ShiftType;
    role?: RosterRole;
    from?: string; // ISO date string
    to?: string; // ISO date string
    page?: number;
    limit?: number;
}

/**
 * Data for creating a roster entry
 */
export interface CreateRosterData {
    hotelId: string;
    staffId: string;
    date: string; // ISO date string
    shiftType: ShiftType;
    shiftStartTime: string; // HH:MM format
    shiftEndTime: string; // HH:MM format
    role: RosterRole;
    notes?: string;
}

/**
 * Data for updating a roster entry
 */
export interface UpdateRosterData {
    hotelId?: string;
    staffId?: string;
    date?: string;
    shiftType?: ShiftType;
    shiftStartTime?: string;
    shiftEndTime?: string;
    role?: RosterRole;
    notes?: string;
}

/**
 * Get all roster entries with optional filters
 * GET /rosters
 * 
 * @param params - Optional query parameters for filtering rosters
 * @returns Promise with paginated rosters
 */
export const getRosters = async (params?: GetRostersParams): Promise<ApiResponse<IRoster[]>> => {
    try {
        const response = await api.get<ApiResponse<IRoster[]>>('/rosters', {
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
 * Get roster by ID
 * GET /rosters/:id
 * 
 * @param rosterId - The ID of the roster entry to fetch
 * @returns Promise with roster details
 */
export const getRosterById = async (rosterId: string): Promise<ApiResponse<IRoster>> => {
    try {
        const response = await api.get<ApiResponse<IRoster>>(`/rosters/${rosterId}`);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        throw error;
    }
};

/**
 * Create a new roster entry (Admin only)
 * POST /rosters
 * 
 * @param data - The roster data to create
 * @returns Promise with created roster
 */
export const createRoster = async (data: CreateRosterData): Promise<ApiResponse<IRoster>> => {
    try {
        const response = await api.post<ApiResponse<IRoster>>('/rosters', data);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        throw error;
    }
};

/**
 * Update a roster entry (Admin only)
 * PATCH /rosters/:id
 * 
 * @param rosterId - The ID of the roster entry to update
 * @param data - The updated roster data
 * @returns Promise with updated roster
 */
export const updateRoster = async (rosterId: string, data: UpdateRosterData): Promise<ApiResponse<IRoster>> => {
    try {
        const response = await api.patch<ApiResponse<IRoster>>(`/rosters/${rosterId}`, data);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        throw error;
    }
};

/**
 * Delete a roster entry (Admin only)
 * DELETE /rosters/:id
 * 
 * @param rosterId - The ID of the roster entry to delete
 * @returns Promise with deleted roster
 */
export const deleteRoster = async (rosterId: string): Promise<ApiResponse<IRoster>> => {
    try {
        const response = await api.delete<ApiResponse<IRoster>>(`/rosters/${rosterId}`);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response?.data) {
            return error.response.data as ApiErrorResponse;
        }
        throw error;
    }
};

/**
 * Get roster entries for a specific staff member
 * GET /rosters/staff/:staffId
 * 
 * @param staffId - The ID of the staff member
 * @param params - Optional query parameters (from, to)
 * @returns Promise with staff rosters
 */
export const getStaffRoster = async (staffId: string, params?: { from?: string; to?: string }): Promise<ApiResponse<IRoster[]>> => {
    try {
        const response = await api.get<ApiResponse<IRoster[]>>(`/rosters/staff/${staffId}`, {
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
 * Get my roster (current user - staff only)
 * GET /rosters/my-roster
 * 
 * @param params - Optional query parameters (from, to)
 * @returns Promise with my rosters
 */
export const getMyRoster = async (params?: { from?: string; to?: string }): Promise<ApiResponse<IRoster[]>> => {
    try {
        const response = await api.get<ApiResponse<IRoster[]>>('/rosters/my-roster', {
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
