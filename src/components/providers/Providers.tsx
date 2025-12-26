'use client';

import { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';

interface ProvidersProps {
    children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
    return (
        <AuthProvider>
            {children}
            <Toaster position="top-right" richColors />
        </AuthProvider>
    );
}

