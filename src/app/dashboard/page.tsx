'use client';

import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { user, loading } = useAuth();

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        {loading ? (
          <>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-primary-200">
              Welcome back, {user?.name || 'Guest'}!
            </h1>
          </>
        )}
      </div>

      {/* Dashboard Content */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-muted/50 aspect-video rounded-xl" />
        <div className="bg-muted/50 aspect-video rounded-xl" />
        <div className="bg-muted/50 aspect-video rounded-xl" />
      </div>
    </div>
  );
}
