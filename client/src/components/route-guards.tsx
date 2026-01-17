import { useAuth } from "@/hooks/use-auth";
import { Navigate, Outlet } from "react-router";

export function ProtectedRoute() {
  const { isLoading, isError } = useAuth();

  if (isLoading) {
    return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
  }

  if (isError) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
}

export function GuestRoute() {
  const { isSuccess, isLoading } = useAuth();

  if (isLoading) {
     return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
  }

  if (isSuccess) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}
