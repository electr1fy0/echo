import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router";
import { ErrorBoundary } from "react-error-boundary";
import { AppSidebar } from "@/components/app-sidebar";
import { GuestRoute, ProtectedRoute } from "@/components/route-guards";
import { Toaster } from "@/components/ui/toast";
import { ReloadPrompt } from "@/components/reload-prompt";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const Home = lazy(() => import("@/pages/home"));
const Profile = lazy(() => import("@/pages/profile"));
const PublicProfile = lazy(() => import("@/pages/public-profile"));
const Explore = lazy(() => import("@/pages/explore"));
const AllChambers = lazy(() => import("@/pages/all-chambers"));
const ChamberPage = lazy(() => import("@/pages/chamber"));
const Notifications = lazy(() => import("@/pages/notifications"));
const Auth = lazy(() => import("@/pages/auth"));
const Landing = lazy(() => import("@/pages/landing"));
const VerifyEmail = lazy(() => import("@/pages/verify-email"));
const ResetPassword = lazy(() => import("@/pages/reset-password"));
const NotFound = lazy(() => import("@/pages/not-found"));

function AuthenticatedLayout() {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="w-full flex flex-col items-center md:pl-20">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4">
          <p className="text-sm text-muted-foreground">Something went wrong.</p>
        </div>
      }
    >
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route element={<GuestRoute />}>
              <Route path="/" element={<Navigate to="/landing" replace />} />
              <Route path="/landing" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<AuthenticatedLayout />}>
                <Route path="/home" element={<Home />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/u/:username" element={<PublicProfile />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/chambers" element={<AllChambers />} />
                <Route path="/chamber/:chamberId" element={<ChamberPage />} />
                <Route path="/notifications" element={<Notifications />} />
              </Route>
              <Route path="/" element={<Navigate to="/home" replace />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <Toaster />
        <ReloadPrompt />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
