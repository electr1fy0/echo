import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { Home } from "@/pages/home";
import { Profile } from "@/pages/profile";
import { PublicProfile } from "@/pages/public-profile";
import { Explore } from "@/pages/explore";
import { AllChambers } from "@/pages/all-chambers";
import { ChamberPage } from "@/pages/chamber";
import { Notifications } from "@/pages/notifications";
import { Auth } from "@/pages/auth";
import { Landing } from "@/pages/landing";
import { VerifyEmail } from "@/pages/verify-email";
import { GuestRoute, ProtectedRoute } from "@/components/route-guards";
function AuthenticatedLayout() {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="w-full flex flex-col items-center md:pl-20">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/u/:username" element={<PublicProfile />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/chambers" element={<AllChambers />} />
          <Route path="/chamber/:chamberId" element={<ChamberPage />} />
          <Route path="/notifications" element={<Notifications />} />
        </Routes>
      </main>
    </div>
  );
}
import { Toaster } from "@/components/ui/sonner";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route element={<GuestRoute />}>
          <Route path="/landing" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/*" element={<AuthenticatedLayout />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
