'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getCurrentUser, logout as logoutService } from '@/services/authService';

/**
 * Authentication Context
 * 
 * Provides global authentication state management
 * - Fetches current user on initial load
 * - Stores user, role, authentication status
 * - Provides methods to refresh user data and logout
 */

interface AuthContextType {
    user: IUser | null;
    role: UserRole | null;
    isAuthenticated: boolean;
    loading: boolean;
    refreshUser: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<IUser | null>(null);
    const [role, setRole] = useState<UserRole | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    /**
     * Fetch current user from backend
     * Called on initial load and when refreshUser() is invoked
     */
    const fetchCurrentUser = async () => {
        try {
            setLoading(true);
            const response = await getCurrentUser();

            if (response.success && response.data) {
                setUser(response.data);
                setRole(response.data.role);
                setIsAuthenticated(true);
            } else {
                // User is not authenticated
                setUser(null);
                setRole(null);
                setIsAuthenticated(false);
            }
        } catch {
            // Silently handle auth check failure (user not logged in)
            setUser(null);
            setRole(null);
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Refresh user data
     * Can be called after login or when user data needs to be updated
     */
    const refreshUser = async () => {
        await fetchCurrentUser();
    };

    /**
     * Logout user
     * Clears user state and calls backend logout
     */
    const logout = async () => {
        try {
            await logoutService();

            // Clear user state
            setUser(null);
            setRole(null);
            setIsAuthenticated(false);
        } catch {
            // Even if backend logout fails, clear local state
            setUser(null);
            setRole(null);
            setIsAuthenticated(false);
        }
    };

    // Fetch current user on mount
    useEffect(() => {
        fetchCurrentUser();
    }, []);

    const value: AuthContextType = {
        user,
        role,
        isAuthenticated,
        loading,
        refreshUser,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use Auth Context
 * Throws error if used outside AuthProvider
 */
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
};

