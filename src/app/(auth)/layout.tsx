import Image from "next/image";
import { ReactNode } from "react";
import { Separator } from "@/components/ui/separator";

const AuthLayout = async ({ children }: { children: ReactNode }) => {

    const Year = new Date().getFullYear();

    return (
        <main className="auth-layout">
            <section className="auth-left-section">

                <div className="auth-container">
                    <div className="auth-logo-container">
                        <Image
                            src="/images/HMSLogo.png"
                            alt="HMS Logo"
                            fill
                            priority
                            className="object-cover"
                        />
                    </div>

                    <div className="auth-children">
                        {children}
                    </div>

                    <div className="flex flex-col gap-4 w-full text-center mt-5">
                        <Separator />
                        <p className="text-xs lg:text-sm text-secondary-100">
                            &copy; {Year} HMS by SDP Group. All rights reserved.
                        </p>
                    </div>
                </div>

            </section>

            <section className="auth-right-section">
                <div className="z-10 relative lg:mt-4 lg:mb-16">
                    <blockquote className="hidden md:block auth-blockquote">
                        A hotel management system developed as part of a Software Development Practice group project.
                    </blockquote>


                    <div>
                        <cite className="auth-testimonial-author">
                            - Software Development Practice Group
                        </cite>
                        <p className="max-md:text-xs text-gray-500">
                            BSc (Hons) in Computer Science - Software Engineering
                        </p>
                    </div>
                </div>

                <div className="flex-1 relative">
                    <Image
                        src="/images/SampleHotel.jpg"
                        alt="Hotel Image Preview"
                        width={1440}
                        height={1150}
                        className="auth-dashboard-preview"
                    />
                </div>
            </section>
        </main>
    );
}

export default AuthLayout;
