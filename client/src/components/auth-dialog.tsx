import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AuthPayload } from "@/api/auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  useSignin,
  useSignup,
  useRequestPasswordReset,
  useResendVerification,
} from "@/hooks/use-auth";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { API_URL } from "@/config";
import { useAuthModal } from "@/hooks/use-auth-modal";

type FormMode = "signin" | "signup" | "forgot" | "forgot-success" | "signup-success";

const MODE_COPY: Record<
  "signin" | "signup" | "forgot",
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

export function AuthDialog() {
  const { isOpen, close, defaultTab } = useAuthModal();
  const [mode, setMode] = useState<FormMode>("signin");

  // Keep state sync with defaultTab when modal opens
  const [lastOpen, setLastOpen] = useState(false);
  if (isOpen !== lastOpen) {
    setLastOpen(isOpen);
    if (isOpen) {
      setMode(defaultTab);
    }
  }

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
    close();
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) close(); }}>
      <DialogContent className="sm:max-w-md bg-background text-neutral-900 dark:text-neutral-100 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800">
        {mode === "forgot-success" ? (
          <div className="text-center space-y-4 py-4">
            <div className="mx-auto size-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <span className="text-2xl">📧</span>
            </div>
            <DialogTitle className="text-lg font-bold text-center">Check your email</DialogTitle>
            <DialogDescription className="text-center text-sm text-neutral-500">
              If an account exists for <strong>{form.email}</strong>, we've sent
              instructions to reset your password.
            </DialogDescription>
            <Button
              variant="outline"
              className="w-full mt-4 rounded-full"
              onClick={() => setMode("signin")}
            >
              Back to Sign In
            </Button>
          </div>
        ) : mode === "signup-success" ? (
          <div className="text-center space-y-4 py-4">
            <div className="mx-auto size-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <span className="text-2xl">✉️</span>
            </div>
            <DialogTitle className="text-lg font-bold text-center">Check your email</DialogTitle>
            <DialogDescription className="text-center text-sm text-neutral-500">
              We've sent a verification link to <strong>{form.email}</strong>.
              Please click the link to verify your account before signing in.
            </DialogDescription>
            <div className="space-y-2 pt-2">
              <Button
                variant="outline"
                className="w-full rounded-full"
                onClick={() => setMode("signin")}
              >
                Back to Sign In
              </Button>
              <Button
                variant="ghost"
                className="w-full text-xs text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full"
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
            </div>
          </div>
        ) : (
          <>
            <DialogHeader className="text-left pb-2">
              <div className="my-2 flex justify-start">
                <div className="size-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  <img
                    src="/echologo.svg"
                    alt="Echo"
                    className="size-7 invert dark:invert-0 opacity-80"
                  />
                </div>
              </div>
              <DialogTitle className="text-lg text-left font-semibold">{copy.title}</DialogTitle>
              <DialogDescription className="text-left text-xs">
                {copy.description}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <form className="space-y-3" onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-destructive/15 text-destructive text-sm px-4 py-3 rounded-lg flex items-center gap-3">
                    <HugeiconsIcon icon={Alert02Icon} size={20} />
                    <span>{error.message}</span>
                  </div>
                )}

                {formMode !== "forgot" && (
                  <Input
                    name="username"
                    type="text"
                    placeholder="Username"
                    autoComplete="username"
                    required
                    className="text-base md:text-sm pl-3 h-10 rounded-xl"
                    value={form.username}
                    onChange={(e) => updateForm({ username: e.target.value })}
                  />
                )}

                {(formMode === "signup" || formMode === "forgot") && (
                  <Input
                    name="email"
                    type="email"
                    placeholder="Email"
                    autoComplete="email"
                    required
                    className="text-base md:text-sm pl-3 h-10 rounded-xl"
                    value={form.email}
                    onChange={(e) => updateForm({ email: e.target.value })}
                  />
                )}

                {formMode !== "forgot" && (
                  <Input
                    name="password"
                    type="password"
                    placeholder={
                      formMode === "signup" ? "Create Password" : "Password"
                    }
                    autoComplete={
                      formMode === "signup" ? "new-password" : "current-password"
                    }
                    required
                    className="text-base md:text-sm pl-3 h-10 rounded-xl"
                    value={form.password}
                    onChange={(e) => updateForm({ password: e.target.value })}
                  />
                )}

                <Button className="w-full h-10 rounded-xl bg-[#ff5a1f] hover:bg-[#e94a12] text-white cursor-pointer" type="submit" disabled={isLoading}>
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

              <div className="space-y-4 text-center">
                {formMode === "signin" && (
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    Forgot your password?
                  </button>
                )}

                {formMode !== "forgot" && (
                  <div className="space-y-4 pt-1">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-neutral-200 dark:border-neutral-800" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-background px-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                          or continue with
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full h-10 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-center gap-2 cursor-pointer"
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
                    if (formMode === "forgot") {
                      setMode("signin");
                    } else if (formMode === "signup") {
                      setMode("signin");
                    } else {
                      setMode("signup");
                    }
                  }}
                  className="mt-5 block w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {formMode === "forgot"
                    ? "Back to Sign In"
                    : formMode === "signup"
                      ? "Already have an account?"
                      : "Don't have an account?"}
                </button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
