import Image from "next/image";
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { isAuthenticated } from "@/lib/session";

const AuthLayout = async ({ children }: { children: ReactNode }) => {
    // Redirect authenticated users to dashboard
    const authenticated = await isAuthenticated();
    if (authenticated) {
        redirect('/dashboard');
    }

    const year = new Date().getFullYear();

    return (
        <main className="auth-layout">

            <div className="absolute inset-0 bg-black/10" />

            <div className="auth-container">
                {/* Logo */}
                <div className="auth-logo-container">
                    <Image
                        src="/images/HMSLogo.png"
                        alt="HMS Logo"
                        fill
                        priority
                        className="object-cover"
                    />
                </div>

                {/* Form */}
                <div className="auth-children">
                    {children}
                </div>

                {/* Footer */}
                <div className="flex flex-col gap-4 w-full text-center mt-5">
                    <Separator />
                    <p className="text-xs lg:text-sm text-secondary-100">
                        &copy; {year} HMS by SDP Group. All rights reserved.
                    </p>
                </div>
            </div>
        </main>
    );
};

export default AuthLayout;
