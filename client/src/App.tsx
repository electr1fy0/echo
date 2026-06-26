import { Suspense, lazy, useEffect } from "react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useSearchParams,
  useNavigate,
} from "react-router";
import { ErrorBoundary } from "react-error-boundary";
import { AppSidebar } from "@/components/app-sidebar";
import { ProtectedRoute } from "@/components/route-guards";
import { ToastProvider, AnchoredToastProvider } from "@/components/ui/toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/use-auth";
import { useAnalytics } from "@/hooks/use-analytics";
import { useAccentTheme } from "@/hooks/use-accent-theme";
import { Button } from "@/components/ui/button";
import { useAuthModal } from "@/hooks/use-auth-modal";

import { AuthDialog } from "@/components/auth-dialog";
import { useQueryClient } from "@tanstack/react-query";
import {
  clearGoogleOnboardingToken,
  setGoogleOnboardingToken,
  setToken,
} from "@/lib/utils";
import {
  OnboardingTourProvider,
  useOnboardingTour,
} from "@/hooks/use-onboarding-tour";

const Home = lazy(() => import("@/pages/home"));
const Profile = lazy(() => import("@/pages/profile"));
const PublicProfile = lazy(() => import("@/pages/public-profile"));
const Explore = lazy(() => import("@/pages/explore"));
const AllChambers = lazy(() => import("@/pages/all-chambers"));
const ChamberPage = lazy(() => import("@/pages/chamber"));
const Notifications = lazy(() => import("@/pages/notifications"));
const VerifyEmail = lazy(() => import("@/pages/verify-email"));
const MagicLink = lazy(() => import("@/pages/magic-link"));
const Onboarding = lazy(() => import("@/pages/onboarding"));
const NotFound = lazy(() => import("@/pages/not-found"));
const QuestionDetailPage = lazy(() => import("@/pages/question-detail"));
const DMsPage = lazy(() => import("@/pages/dms"));
const DMConversationPage = lazy(() => import("@/pages/dm-conversation"));
const AnalyticsPage = lazy(() => import("@/pages/analytics"));

import { CreatePostDialog } from "@/components/questions/create-post-dialog";
import { EditPostDialog } from "@/components/questions/edit-post-dialog";

function AutoStartTour() {
  const { data: user, isLoading } = useAuth();
  const { start, hasSeen } = useOnboardingTour();

  useEffect(() => {
    if (!isLoading && user && !hasSeen) {
      const timer = setTimeout(() => start(), 600);
      return () => clearTimeout(timer);
    }
  }, [user, isLoading, hasSeen, start]);

  return null;
}

function AuthenticatedLayout() {
  const { data: user, isLoading } = useAuth();
  const { open: openAuthModal } = useAuthModal();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useAnalytics();

  useEffect(() => {
    const onboarding = searchParams.get("onboarding") === "1";
    const onboardingToken = searchParams.get("onboardingToken");
    if (onboarding && onboardingToken) {
      setGoogleOnboardingToken(onboardingToken);
      navigate("/onboarding", { replace: true });
      return;
    }

    const token = searchParams.get("token");
    if (token) {
      clearGoogleOnboardingToken();
      setToken(token);
      queryClient.refetchQueries({ queryKey: ["auth"] });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["chambers"] });
      navigate("/", { replace: true });
    }
  }, [searchParams, navigate, queryClient]);

  return (
    <OnboardingTourProvider>
      <AutoStartTour />
      <div className="flex min-h-dvh">
        <AppSidebar />
        <main className="w-full flex flex-col items-center md:pl-20 min-h-0">
          <Outlet />
        </main>
        <AuthDialog />
        <CreatePostDialog />
        <EditPostDialog />

        {!user && !isLoading && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 py-4 px-6 md:px-12 md:flex hidden flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-bottom duration-500">
            <div>
              <h4 className="text-sm ">Don't miss what's happening</h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                People on TurnsOut are finding project partners, trading items,
                coordinating rides, and sharing ideas. Sign up to
                join them!
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="default" onClick={() => openAuthModal()}>
                Get started
              </Button>
            </div>
          </div>
        )}
      </div>
    </OnboardingTourProvider>
  );
}

function AccentThemeInitializer() {
  useAccentTheme();
  return null;
}

function ErrorFallback({ error, resetErrorBoundary }: { error: unknown; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 gap-4 bg-background text-foreground">
      <p className="text-sm text-muted-foreground text-center max-w-md">
        {error instanceof Error && error.message === "Loading chunk failed"
          ? "A page chunk failed to load. This can happen after an app update."
          : "Something went wrong."}
      </p>
      <div className="flex gap-3">
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black hover:opacity-90 transition-opacity cursor-pointer"
        >
          Try again
        </button>
        <button
          onClick={() => {
            if ("caches" in window) {
              caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
            }
            window.location.reload();
          }}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 hover:opacity-90 transition-opacity cursor-pointer"
        >
          Clear cache & refresh
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <BrowserRouter>
        <AccentThemeInitializer />
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/auth/magic-link" element={<MagicLink />} />
            <Route path="/onboarding" element={<Onboarding />} />

            {/* Public layout routes */}
            <Route element={<AuthenticatedLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/home" element={<Navigate to="/" replace />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/chambers/:chamberId" element={<ChamberPage />} />
              <Route path="/q/:questionId" element={<QuestionDetailPage />} />
              <Route path="/u/:username" element={<PublicProfile />} />
              <Route path="/auth" element={<LoadingSpinner />} />
            </Route>

            {/* Protected layout routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AuthenticatedLayout />}>
                <Route path="/profile" element={<Profile />} />
                <Route path="/chambers" element={<AllChambers />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/dm" element={<DMsPage />} />
                <Route
                  path="/dm/:conversationId"
                  element={<DMConversationPage />}
                />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <ToastProvider>
          <AnchoredToastProvider />
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
