import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { GuestRoute, ProtectedRoute } from "@/components/route-guards";
import { Toaster } from "@/components/ui/toast";
import { ReloadPrompt } from "@/components/reload-prompt";
import { ErrorBoundary } from "@/components/error-boundary";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const Home = lazy(() => import("@/pages/home").then(module => ({ default: module.Home })));
const Profile = lazy(() => import("@/pages/profile").then(module => ({ default: module.Profile })));
const PublicProfile = lazy(() => import("@/pages/public-profile").then(module => ({ default: module.PublicProfile })));
const Explore = lazy(() => import("@/pages/explore").then(module => ({ default: module.Explore })));
const AllChambers = lazy(() => import("@/pages/all-chambers").then(module => ({ default: module.AllChambers })));
const ChamberPage = lazy(() => import("@/pages/chamber").then(module => ({ default: module.ChamberPage })));
const Notifications = lazy(() => import("@/pages/notifications").then(module => ({ default: module.Notifications })));
const Auth = lazy(() => import("@/pages/auth").then(module => ({ default: module.Auth })));
const Landing = lazy(() => import("@/pages/landing").then(module => ({ default: module.Landing })));
const VerifyEmail = lazy(() => import("@/pages/verify-email").then(module => ({ default: module.VerifyEmail })));
const ResetPassword = lazy(() => import("@/pages/reset-password").then(module => ({ default: module.ResetPassword })));
const NotFound = lazy(() => import("@/pages/not-found").then(module => ({ default: module.NotFound })));

function AuthenticatedLayout() {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="w-full flex flex-col items-center md:pl-20">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<Home />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/u/:username" element={<PublicProfile />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/chambers" element={<AllChambers />} />
            <Route path="/chamber/:chamberId" element={<ChamberPage />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
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
              <Route path="/*" element={<AuthenticatedLayout />} />
            </Route>
          </Routes>
        </Suspense>
        <Toaster />
        <ReloadPrompt />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
