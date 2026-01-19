import { useAuth } from "@/hooks/use-auth";
import { Navigate, Outlet } from "react-router";
import { PageSkeleton } from "@/components/ui/skeletons";

export function ProtectedRoute() {
  const { isLoading, isError } = useAuth();
  if (isLoading) {
    return <PageSkeleton />;
  }
  if (isError) {
    return <Navigate to="/auth" replace />;
  }
  return <Outlet />;
}

export function GuestRoute() {
  const { isSuccess, isLoading } = useAuth();
  if (isLoading) {
    return <PageSkeleton />;
  }
  if (isSuccess) {
    return <Navigate to="/home" replace />;
  }
  return <Outlet />;
}
