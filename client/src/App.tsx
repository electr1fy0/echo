import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Link, Outlet, Route, Routes } from "react-router";
import { ErrorBoundary } from "react-error-boundary";
import { AppSidebar } from "@/components/app-sidebar";
import { GuestRoute, ProtectedRoute } from "@/components/route-guards";
import { Toaster } from "@/components/ui/toast";
import { ReloadPrompt } from "@/components/reload-prompt";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

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
const Onboarding = lazy(() => import("@/pages/onboarding"));
const NotFound = lazy(() => import("@/pages/not-found"));

function AuthenticatedLayout() {
  const { data: user } = useAuth();
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="w-full flex flex-col items-center md:pl-20">
        <Outlet />
      </main>
      {!user && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-[#ff5a1f] to-amber-500 text-white py-4 px-6 md:px-12 md:flex hidden flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] animate-in slide-in-from-bottom duration-500">
          <div>
            <h4 className="text-base font-semibold">Don't miss what's happening</h4>
            <p className="text-xs text-white/95 mt-0.5">
              People on Echo are asking questions and sharing answers in real-time. Sign up to join them!
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/auth">
              <Button className="rounded-full bg-white text-[#ff5a1f] hover:bg-neutral-100 font-semibold px-6 py-2 h-9 text-xs cursor-pointer border-none">
                Log in
              </Button>
            </Link>
            <Link to="/auth">
              <Button className="rounded-full bg-neutral-900/40 text-white hover:bg-neutral-900/60 font-semibold px-6 py-2 h-9 text-xs border border-white/30 cursor-pointer">
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      )}
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
            <Route path="/onboarding" element={<Onboarding />} />

            <Route element={<GuestRoute />}>
              <Route path="/" element={<Landing />} />
              <Route path="/landing" element={<Navigate to="/" replace />} />
              <Route path="/auth" element={<Auth />} />
            </Route>

            {/* Public layout routes */}
            <Route element={<AuthenticatedLayout />}>
              <Route path="/home" element={<Home />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/chamber/:chamberId" element={<ChamberPage />} />
              <Route path="/u/:username" element={<PublicProfile />} />
            </Route>

            {/* Protected layout routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AuthenticatedLayout />}>
                <Route path="/profile" element={<Profile />} />
                <Route path="/chambers" element={<AllChambers />} />
                <Route path="/notifications" element={<Notifications />} />
              </Route>
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

