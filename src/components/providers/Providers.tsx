'use client';

import { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { HotelProvider } from '@/contexts/HotelContext';

interface ProvidersProps {
    children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
    return (
        <AuthProvider>
            <HotelProvider>
                {children}
                <Toaster position="bottom-right" richColors />
            </HotelProvider>
        </AuthProvider>
    );
}

