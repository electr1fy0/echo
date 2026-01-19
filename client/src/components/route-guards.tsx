import { useAuth } from "@/hooks/use-auth";
import { Navigate, Outlet } from "react-router";
import { PageSkeleton } from "@/components/ui/skeletons";
import { getToken } from "@/lib/utils";

export function ProtectedRoute() {
  const { isLoading, isError } = useAuth();
  const token = getToken();

  if (!token) {
    return <Navigate to="/auth" replace />;
  }

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
  const token = getToken();

  if (!token) {
    return <Outlet />;
  }

  if (isLoading) {
    return <PageSkeleton />;
  }
  if (isSuccess) {
    return <Navigate to="/home" replace />;
  }
  return <Outlet />;
}
