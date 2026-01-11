'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getActiveHotels } from '@/services/hotelService';

/**
 * Hotel Context
 * 
 * Provides global hotel selection state management
 * - For admin: allows selecting which hotel to manage
 * - For receptionist/housekeeping: automatically sets their assigned hotel
 * - For guest: allows selecting hotel for booking
 */

interface HotelContextType {
    selectedHotel: IHotel | null;
    availableHotels: IHotel[];
    loading: boolean;
    setSelectedHotel: (hotel: IHotel | null) => void;
    refreshHotels: () => Promise<void>;
}

const HotelContext = createContext<HotelContextType | undefined>(undefined);

interface HotelProviderProps {
    children: ReactNode;
}

export const HotelProvider = ({ children }: HotelProviderProps) => {
    const { user, role, isAuthenticated } = useAuth();
    const [selectedHotel, setSelectedHotelState] = useState<IHotel | null>(null);
    const [availableHotels, setAvailableHotels] = useState<IHotel[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    /**
     * Fetch available hotels
     */
    const fetchHotels = async () => {
        if (!isAuthenticated) {
            setAvailableHotels([]);
            setSelectedHotelState(null);
            return;
        }

        try {
            setLoading(true);
            const response = await getActiveHotels();

            if (response.success && response.data) {
                setAvailableHotels(response.data);

                // Auto-select hotel based on user role
                if (role === 'receptionist' || role === 'housekeeping') {
                    // Staff users: auto-select their assigned hotel
                    if (user?.hotelId) {
                        const hotelIdString = typeof user.hotelId === 'string' ? user.hotelId : user.hotelId._id;
                        const userHotel = response.data.find((h) => h._id === hotelIdString);
                        if (userHotel) {
                            setSelectedHotelState(userHotel);
                        }
                    }
                } else if (role === 'admin') {
                    // Admin: select first hotel by default or restore from session
                    const savedHotelId = sessionStorage.getItem('selectedHotelId');
                    if (savedHotelId) {
                        const savedHotel = response.data.find((h) => h._id === savedHotelId);
                        if (savedHotel) {
                            setSelectedHotelState(savedHotel);
                        } else if (response.data.length > 0) {
                            setSelectedHotelState(response.data[0]);
                        }
                    } else if (response.data.length > 0) {
                        setSelectedHotelState(response.data[0]);
                    }
                }
                // Guest: no auto-selection, they choose when booking
            }
        } catch (error) {
            console.error('Failed to fetch hotels:', error);
            setAvailableHotels([]);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Set selected hotel and persist to session storage
     */
    const setSelectedHotel = (hotel: IHotel | null) => {
        setSelectedHotelState(hotel);
        if (hotel) {
            sessionStorage.setItem('selectedHotelId', hotel._id);
        } else {
            sessionStorage.removeItem('selectedHotelId');
        }
    };

    /**
     * Refresh hotels list
     */
    const refreshHotels = async () => {
        await fetchHotels();
    };

    // Fetch hotels when user authentication state changes
    useEffect(() => {
        if (isAuthenticated) {
            fetchHotels();
        } else {
            setAvailableHotels([]);
            setSelectedHotelState(null);
        }
    }, [isAuthenticated, user]);

    const value: HotelContextType = {
        selectedHotel,
        availableHotels,
        loading,
        setSelectedHotel,
        refreshHotels,
    };

    return <HotelContext.Provider value={value}>{children}</HotelContext.Provider>;
};

/**
 * Custom hook to use Hotel Context
 * Throws error if used outside HotelProvider
 */
export const useHotel = (): HotelContextType => {
    const context = useContext(HotelContext);

    if (context === undefined) {
        throw new Error('useHotel must be used within a HotelProvider');
    }

    return context;
};
