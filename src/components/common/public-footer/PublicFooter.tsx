"use client";

const PublicFooter = () => {
    const year = new Date().getFullYear();

    return (
        <footer className="w-full border-t border-white/10 py-4">
            <div className="flex justify-center">
                <p className="text-xs lg:text-sm text-secondary-100 text-center">
                    &copy; {year} HMS by SDP Group. All rights reserved.
                </p>
            </div>
        </footer>
    );
};

export default PublicFooter;
