"use client";

import { useAuth } from "@/contexts/AuthContext";
import AdminServiceRequestsPage from "./AdminServiceRequestsPage";
import HousekeepingServiceRequestsPage from "./HousekeepingServiceRequestsPage";
import ReceptionistServiceRequestsPage from "./ReceptionistServiceRequestsPage";

const ServiceRequestsPage = () => {
    const { role, loading: authLoading } = useAuth();

    if (authLoading) {
        return <div className="p-6">Loading...</div>;
    }

    if (role === "housekeeping") {
        return <HousekeepingServiceRequestsPage />;
    }

    if (role === "receptionist") {
        return <ReceptionistServiceRequestsPage />;
    }

    if (role === "admin") {
        return <AdminServiceRequestsPage />;
    }

    return (
        <div className="p-6">
            <p className="text-gray-400">Access denied. This page is not available for your role.</p>
        </div>
    );
};

export default ServiceRequestsPage;

