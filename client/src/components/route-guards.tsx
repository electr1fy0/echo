import { useAuth } from "@/hooks/use-auth";
import { Navigate, Outlet } from "react-router";
import { PageSkeleton } from "@/components/ui/skeletons";
import { getToken } from "@/lib/utils";

export function ProtectedRoute() {
  const { data: user, isLoading, isError, error } = useAuth();
  const token = getToken();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (isError || !user) {
    if (error instanceof Error && error.message === "rate-limit") {
      return (
        <div className="flex flex-col items-center justify-center min-h-dvh p-4 text-center bg-background text-foreground">
          <div className="max-w-md space-y-3">
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Too many requests</h1>
            <p className="text-sm text-neutral-500">
              The rate limiter is preventing new requests. Please wait a few moments and reload.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow transition-colors cursor-pointer"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return <Navigate to="/" replace />;
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
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
