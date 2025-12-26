'use client';

import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminDashboard } from "@/components/page-components/dashboard/AdminDashboard";
import { ReceptionistDashboard } from "@/components/page-components/dashboard/ReceptionistDashboard";
import { HousekeepingDashboard } from "@/components/page-components/dashboard/HousekeepingDashboard";
import { GuestDashboard } from "@/components/page-components/dashboard/GuestDashboard";

export default function Dashboard() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  // Render role-specific dashboard
  switch (role) {
    case 'admin':
      return <AdminDashboard />;
    case 'receptionist':
      return <ReceptionistDashboard />;
    case 'housekeeping':
      return <HousekeepingDashboard />;
    case 'guest':
      return <GuestDashboard />;
    default:
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, {user?.name || 'Guest'}!
            </h1>
            <p className="text-muted-foreground">
              Your dashboard is loading...
            </p>
          </div>
        </div>
      );
  }
}
