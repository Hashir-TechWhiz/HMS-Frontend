"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";

import { PUBLIC_HEADER_NAVIGATION } from "@/constants";

interface NavLinksProps {
    pathname: string;
    onClick?: () => void;
}

const NavLinks = ({ pathname, onClick }: NavLinksProps) => {
    return (
        <>
            {PUBLIC_HEADER_NAVIGATION.map((item) => (
                <Link
                    key={item.id}
                    href={item.link}
                    onClick={onClick}
                    className={cn(
                        "text-[15px] font-medium transition-colors",
                        pathname === item.link
                            ? "text-primary-100"
                            : "text-gray-500 hover:text-primary-200"
                    )}
                >
                    {item.name}
                </Link>
            ))}
        </>
    );
};

const PublicHeader = () => {
    const pathname = usePathname();
    const { isAuthenticated } = useAuth();
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line
        setMounted(true);
    }, []);

    return (
        <header className="fixed inset-x-0 top-0 z-50 backdrop-blur-md py-2">
            <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-2">

                {/* Logo */}
                <Link href="/" className="flex items-center">
                    <div className="relative h-36 w-44">
                        <Image
                            src="/images/HMSLogoFull.png"
                            alt="HMS Logo"
                            fill
                            priority
                            className="object-contain -ml-3 md:-ml-2"
                        />
                    </div>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden lg:flex items-center gap-10 rounded-full border border-white/15 bg-Header-gradient px-6 py-2.5 text-sm font-medium">
                    <NavLinks pathname={pathname} />
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3">
                    {/* Desktop CTA */}
                    {isAuthenticated ? (
                        <Link href="/dashboard">
                            <Button variant="outline" className="hidden lg:inline-flex w-[200px] rounded-full cursor-pointer">
                                Go to Dashboard
                            </Button>
                        </Link>
                    ) : (
                        <Link href="/login">
                            <Button variant="outline" className="hidden lg:inline-flex w-[200px] rounded-full cursor-pointer">
                                Login
                            </Button>
                        </Link>
                    )}

                    {/* Mobile Menu */}
                    {mounted ? (
                        <Drawer open={open} onOpenChange={setOpen} direction="left">
                            <DrawerTrigger asChild>
                                <button
                                    aria-label="Toggle menu"
                                    className="lg:hidden rounded-md p-2 transition hover:bg-white/10"
                                >
                                    {open ? (
                                        <X className="h-6 w-6 text-white" />
                                    ) : (
                                        <Menu className="h-6 w-6 text-white" />
                                    )}
                                </button>
                            </DrawerTrigger>

                            {/* Drawer */}
                            <DrawerContent className="flex h-full flex-col px-6 pb-6">
                                <DrawerHeader className="px-0">
                                    <DrawerTitle className="text-lg font-semibold">
                                        Menu
                                    </DrawerTitle>
                                </DrawerHeader>

                                {/* Navigation */}
                                <div className="mt-6 flex flex-col gap-4 text-base font-medium">
                                    <NavLinks
                                        pathname={pathname}
                                        onClick={() => setOpen(false)}
                                    />
                                </div>

                                {/* Footer Action */}
                                {isAuthenticated ? (
                                    <Link href="/dashboard" className="mt-auto" onClick={() => setOpen(false)}>
                                        <Button variant="outline" className="w-full">
                                            Go to Dashboard
                                        </Button>
                                    </Link>
                                ) : (
                                    <Link href="/login" className="mt-auto" onClick={() => setOpen(false)}>
                                        <Button variant="outline" className="w-full">
                                            Login
                                        </Button>
                                    </Link>
                                )}
                            </DrawerContent>
                        </Drawer>
                    ) : (
                        <button
                            aria-label="Toggle menu"
                            className="lg:hidden rounded-md p-2 transition hover:bg-white/10"
                            disabled
                        >
                            <Menu className="h-6 w-6 text-white" />
                        </button>
                    )}
                </div>
            </nav>
        </header>
    );
};

export default PublicHeader;
