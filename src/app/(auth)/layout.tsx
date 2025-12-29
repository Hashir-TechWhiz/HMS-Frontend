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
            <section className="auth-left-section">

                <div className="auth-container">
                    <div className="auth-logo-container">
                        <Image
                            src="/images/HMSLogo.png"
                            alt="Logo"
                            width={600}
                            height={500}
                            priority
                            className="w-full h-full object-cover rounded-2xl"
                        />
                    </div>

                    <div className="auth-children">
                        {children}
                    </div>

                    <div className="flex flex-col gap-4 w-full text-center mt-5">
                        <Separator />
                        <p className="text-xs lg:text-sm text-secondary-100">
                            &copy; {year} HMS. All rights reserved.
                        </p>
                    </div>
                </div>

            </section>

            <section className="auth-right-section">
                <div className="z-10 relative lg:mt-4 lg:mb-16">
                    <blockquote className="auth-blockquote">
                        A modern hotel management system developed using the MERN stack to support efficient hotel operations.
                    </blockquote>

                    <div>
                        <cite className="auth-testimonial-author">
                            - SDP Group Project
                        </cite>
                        <p className="max-md:text-xs text-gray-500">
                            BSc (Hons) Software Engineering (Top-Up) · 2025
                        </p>
                    </div>

                </div>

                <div className="flex-1 relative">
                    <Image
                        src="/images/AdminDashboard.png"
                        alt="Dashboard Preview"
                        width={1440}
                        height={1150}
                        className="auth-dashboard-preview"
                    />
                </div>
            </section>
        </main>
    );
};

export default AuthLayout;
