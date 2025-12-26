"use client";

import { useAuth } from "@/contexts/AuthContext";
import HousekeepingServiceRequestsPage from "./HousekeepingServiceRequestsPage";
import ReceptionistServiceRequestsPage from "./ReceptionistServiceRequestsPage";
import AdminServiceRequestsPage from "./AdminServiceRequestsPage";

const ServiceRequestsPage = () => {
    const { role, loading: authLoading } = useAuth();

    if (authLoading) {
        return <div className="p-6">Loading...</div>;
    }

    // Render appropriate component based on role
    if (role === "housekeeping") {
        return <HousekeepingServiceRequestsPage />;
    }

    if (role === "receptionist") {
        return <ReceptionistServiceRequestsPage />;
    }

    if (role === "admin") {
        return <AdminServiceRequestsPage />;
    }

    // Fallback - should not reach here due to middleware
    return (
        <div className="p-6">
            <p className="text-gray-400">Access denied. This page is not available for your role.</p>
        </div>
    );
};

export default ServiceRequestsPage;

