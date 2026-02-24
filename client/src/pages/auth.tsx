import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AuthPayload } from "@/api/auth";
import { motion } from "motion/react";
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
import { SkeletonHome } from "@/components/skeleton-home";
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
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
        iconClassName="bg-blue-100 dark:bg-blue-900/30"
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
        iconClassName="bg-green-100 dark:bg-green-900/30"
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
    <div className="min-h-screen bg-background relative">
      <SkeletonHome></SkeletonHome>
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full max-w-md mx-4"
        >
          <Card className="w-full shadow-2xl">
            <CardHeader className="text-center pb-2">
              <div className="my-2">
                <div className="size-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  <img
                    src="/echologo.svg"
                    alt="Echo"
                    className="size-7 invert dark:invert-0 opacity-80"
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
                    className="text-base pl-3"
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
                    className="text-base pl-3"
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
                    className="text-base pl-3"
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
              <div className="space-y-2 text-left">
                {mode === "signin" && (
                  <button
                    onClick={() => setMode("forgot")}
                    className="text-xs mt-1 mb-7 ml-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Forgot your password?
                  </button>
                )}

                {mode !== "forgot" && (
                  <>
                    <div className="text-center">or</div>
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
                  </>
                )}
                <button
                  onClick={() => {
                    if (mode === "forgot") {
                      setMode("signin");
                    } else if (mode === "signup") {
                      setMode("signin");
                    } else {
                      setMode("signup");
                    }
                  }}
                  className="block w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {mode === "forgot"
                    ? "Back to Sign In"
                    : mode === "signup"
                      ? "Already have an account?"
                      : "Don't have an account?"}
                </button>
              </div>
              <div className="pt-4 border-t mt-4 border-border">
                <Link to="/landing">
                  <Button variant="outline" className="w-full">
                    Back
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
