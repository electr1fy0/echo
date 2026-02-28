import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AuthPayload } from "@/api/auth";
import { motion } from "motion/react";
import { PageTransition } from "@/components/page-transition";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useSignin,
  useSignup,
  useRequestPasswordReset,
  useResendVerification,
} from "@/hooks/use-auth";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { API_URL } from "@/config";
import {
  clearGoogleOnboardingToken,
  setGoogleOnboardingToken,
  setToken,
} from "@/lib/utils";

type AuthMode =
  | "signin"
  | "signup"
  | "forgot"
  | "signup-success"
  | "forgot-success";

type FormMode = "signin" | "signup" | "forgot";
const lightOnlyClassName =
  "[color-scheme:light] [--background:oklch(1_0_0)] [--foreground:oklch(0.145_0_0)] [--card:oklch(1_0_0)] [--card-foreground:oklch(0.145_0_0)] [--popover:oklch(1_0_0)] [--popover-foreground:oklch(0.145_0_0)] [--primary:oklch(0.646_0.222_41.116)] [--primary-foreground:oklch(0.98_0.016_73.684)] [--secondary:oklch(0.967_0.001_286.375)] [--secondary-foreground:oklch(0.21_0.006_285.885)] [--muted:oklch(0.97_0_0)] [--muted-foreground:oklch(0.556_0_0)] [--accent:oklch(0.97_0_0)] [--accent-foreground:oklch(0.205_0_0)] [--destructive:oklch(0.58_0.22_27)] [--border:oklch(0.922_0_0)] [--input:oklch(0.922_0_0)] [--ring:oklch(0.708_0_0)]";
const pageClassName =
  "relative min-h-dvh overflow-hidden bg-white text-slate-900";
const splitCardClassName =
  "relative mx-auto h-dvh w-full overflow-hidden rounded-none border-0 shadow-none md:h-auto md:max-w-6xl md:aspect-video md:rounded-[2rem] md:border md:border-white/60 md:shadow-[0_16px_40px_-30px_rgba(30,58,138,0.24)]";

const MODE_COPY: Record<
  FormMode,
  { title: string; description: string; submitLabel: string }
> = {
  signin: {
    title: "Welcome back",
    description: "Sign in to access your questions in Echo.",
    submitLabel: "Sign in",
  },
  signup: {
    title: "Create an account",
    description: "Enter your details to start asking questions in Echo.",
    submitLabel: "Create Account",
  },
  forgot: {
    title: "Reset Password",
    description: "Enter your email to receive password reset instructions.",
    submitLabel: "Send Reset Link",
  },
};

function AuthSuccessCard({
  icon,
  iconClassName,
  title,
  description,
  children,
}: {
  icon: string;
  iconClassName: string;
  title: string;
  description: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className={`min-h-screen flex items-center justify-center bg-white p-4 ${lightOnlyClassName}`}
    >
      <Card className="w-full max-w-md text-center bg-white text-slate-900">
        <CardHeader>
          <div
            className={`mx-auto size-12 rounded-full flex items-center justify-center mb-2 ${iconClassName}`}
          >
            <span className="text-2xl">{icon}</span>
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>("signup");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState<AuthPayload>({
    email: "",
    username: "",
    password: "",
  });

  const formMode =
    mode === "signin" || mode === "signup" || mode === "forgot"
      ? mode
      : "signin";

  const updateForm = (fields: Partial<AuthPayload>) => {
    setForm((prev) => ({ ...prev, ...fields }));
  };

  const {
    mutateAsync: signIn,
    isPending: isInPending,
    error: signInError,
  } = useSignin();
  const {
    mutateAsync: signUp,
    isPending: isUpPending,
    error: signUpError,
  } = useSignup();
  const {
    mutateAsync: requestReset,
    isPending: isResetPending,
    error: resetError,
  } = useRequestPasswordReset();
  const { mutateAsync: resendVerification, isPending: isResendPending } =
    useResendVerification();

  useEffect(() => {
    const onboarding = searchParams.get("onboarding") === "1";
    const onboardingToken = searchParams.get("onboardingToken");
    if (onboarding && onboardingToken) {
      setGoogleOnboardingToken(onboardingToken);
      navigate("/onboarding", { replace: true });
      return;
    }

    const token = searchParams.get("token");
    if (!token) return;
    clearGoogleOnboardingToken();
    setToken(token);
    navigate("/home", { replace: true });
  }, [navigate, searchParams]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const payload: AuthPayload = {
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
    };

    if (formMode === "forgot") {
      if (!payload.email) return;
      await requestReset(payload.email);
      setMode("forgot-success");
      return;
    }

    if (formMode === "signup") {
      if (!payload.username || !payload.email || !payload.password) return;
      await signUp(payload);
      setMode("signup-success");
      return;
    }

    if (!payload.username || !payload.password) return;
    await signIn(payload);
    navigate("/home");
  }

  async function handleSigninWithGoogle() {
    window.location.href = `${API_URL}/auth/signin-with-google`;
  }
  const error =
    formMode === "forgot"
      ? resetError
      : formMode === "signup"
        ? signUpError
        : formMode === "signin"
          ? signInError
          : null;
  const isLoading = isInPending || isUpPending || isResetPending;
  const copy = MODE_COPY[formMode];

  if (mode === "forgot-success") {
    return (
      <AuthSuccessCard
        icon="📧"
        iconClassName="bg-blue-100"
        title="Check your email"
        description={
          <>
            If an account exists for <strong>{form.email}</strong>, we've sent
            instructions to reset your password.
          </>
        }
      >
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setMode("signin")}
        >
          Back to Sign In
        </Button>
      </AuthSuccessCard>
    );
  }

  if (mode === "signup-success") {
    return (
      <AuthSuccessCard
        icon="✉️"
        iconClassName="bg-green-100"
        title="Check your email"
        description={
          <>
            We've sent a verification link to <strong>{form.email}</strong>.
            Please click the link to verify your account before signing in.
          </>
        }
      >
        <Button
          variant="outline"
          className="w-full mb-2"
          onClick={() => setMode("signin")}
        >
          Back to Sign In
        </Button>
        <Button
          variant="ghost"
          className="w-full text-xs text-muted-foreground"
          disabled={isResendPending}
          onClick={async () => {
            if (!form.email) return;
            try {
              await resendVerification(form.email);
              alert("Verification email resent!");
            } catch {
              alert("Failed to resend email. Please try again.");
            }
          }}
        >
          {isResendPending ? "Sending..." : "Resend Validation Email"}
        </Button>
      </AuthSuccessCard>
    );
  }

  return (
    <PageTransition className={`${pageClassName} ${lightOnlyClassName}`}>
      <main className="relative min-h-dvh px-0 py-0 md:px-8 md:py-10">
        <section className="mx-auto flex min-h-dvh w-full max-w-6xl items-center md:min-h-[calc(100dvh-5rem)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={splitCardClassName}
        >
          <div className="grid h-full grid-cols-1 md:grid-cols-2">
            <div className="relative hidden min-h-[220px] overflow-hidden md:block md:min-h-full">
              <img
                src="/landing_background.png"
                alt="Floral sky background"
                className="absolute inset-0 h-full w-full object-cover object-center md:w-[200%] md:max-w-none md:object-left"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/35 to-white/45" />
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.42] mix-blend-normal"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 18% 22%, rgba(0,0,0,0.26) 0.8px, transparent 1px), radial-gradient(circle at 76% 68%, rgba(0,0,0,0.2) 0.75px, transparent 1px), radial-gradient(circle at 40% 78%, rgba(255,255,255,0.25) 0.6px, transparent 0.95px)",
                  backgroundSize: "4px 4px, 5px 5px, 6px 6px",
                }}
              />
            </div>
            <div className="bg-white/70 backdrop-blur-sm overflow-y-auto md:flex md:items-center">
              <Card className="w-full max-w-md mx-auto my-6 md:my-0 rounded-none border-0 bg-transparent shadow-none ring-0 overflow-visible">
                <CardHeader className="text-center pb-2">
              <div className="my-2">
                <div className="size-9 rounded-lg bg-neutral-100 flex items-center justify-center">
                  <img
                    src="/echologo.svg"
                    alt="Echo"
                    className="size-7 invert opacity-80"
                  />
                </div>
              </div>
              <CardTitle className="text-lg text-left">{copy.title}</CardTitle>
              <CardDescription className="text-left">
                {copy.description}
              </CardDescription>
            </CardHeader>
                <CardContent className="space-y-4">
              <form className="space-y-3" onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-destructive/15 text-destructive text-sm px-4 py-3 rounded-lg flex items-center gap-3">
                    <HugeiconsIcon icon={Alert02Icon} size={20} />
                    <span>{error.message}</span>
                  </div>
                )}

                {mode !== "forgot" && (
                  <Input
                    name="username"
                    type="text"
                    placeholder="Username"
                    autoComplete="username"
                    required
                    className="text-base md:text-sm pl-3"
                    value={form.username}
                    onChange={(e) => updateForm({ username: e.target.value })}
                  />
                )}

                {(mode === "signup" || mode === "forgot") && (
                  <Input
                    name="email"
                    type="email"
                    placeholder="Email"
                    autoComplete="email"
                    required
                    className="text-base md:text-sm pl-3"
                    value={form.email}
                    onChange={(e) => updateForm({ email: e.target.value })}
                  />
                )}

                {mode !== "forgot" && (
                  <Input
                    name="password"
                    type="password"
                    placeholder={
                      mode === "signup" ? "Create Password" : "Password"
                    }
                    autoComplete={
                      mode === "signup" ? "new-password" : "current-password"
                    }
                    required
                    className="text-base md:text-sm pl-3"
                    value={form.password}
                    onChange={(e) => updateForm({ password: e.target.value })}
                  />
                )}

                <Button className="w-full" type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <HugeiconsIcon
                      icon={Loading03Icon}
                      className="size-5 animate-spin"
                    />
                  ) : (
                    copy.submitLabel
                  )}
                </Button>
              </form>
              {/* Footer Controls */}
              <div className="space-y-4 text-left">
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-xs ml-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Forgot your password?
                  </button>
                )}

                {mode !== "forgot" && (
                  <div className="space-y-4 pt-1">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border/80" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-transparent px-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                          or continue with
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full"
                      onClick={handleSigninWithGoogle}
                    >
                      <img
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                        alt=""
                        className="size-4"
                        aria-hidden="true"
                      />
                      Continue with Google
                    </Button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (mode === "forgot") {
                      setMode("signin");
                    } else if (mode === "signup") {
                      setMode("signin");
                    } else {
                      setMode("signup");
                    }
                  }}
                  className="mt-5 block w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {mode === "forgot"
                    ? "Back to Sign In"
                    : mode === "signup"
                      ? "Already have an account?"
                      : "Don't have an account?"}
                </button>
              </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
        </section>
      </main>
    </PageTransition>
  );
}
