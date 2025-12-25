import PublicHeader from "@/components/common/public-header/PublicHeader";
import PublicFooter from "@/components/common/public-footer/PublicFooter";

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col">
            <PublicHeader />

            <main className="flex-1">
                {children}
            </main>

            <PublicFooter />
        </div>
    );
}
