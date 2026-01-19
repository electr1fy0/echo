import { useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { AuthPayload } from "@/api/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSignin, useSignup, useRequestPasswordReset } from "@/hooks/use-auth";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon } from "@hugeicons/core-free-icons";
function SkeletonQuestionItem() {
  return (
    <div className="py-4 space-y-3">
      <div className="flex items-start gap-3">
        <Skeleton className="size-8 rounded-full shrink-0 animate-none" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24 animate-none" />
          <Skeleton className="h-4 w-full animate-none" />
          <Skeleton className="h-4 w-3/4 animate-none" />
        </div>
      </div>
    </div>
  );
}

function SkeletonSidebar() {
  return (
    <aside className="hidden md:flex fixed top-0 left-0 h-screen flex-col items-center py-8 border-r border-neutral-200 dark:border-neutral-800 bg-background w-20">
      <div className="size-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
        <img
          src="/echologo.svg"
          alt="Echo"
          className="size-7 invert dark:invert-0 opacity-60"
        />
      </div>
      <nav className="flex-1 flex flex-col items-center justify-center gap-4 w-full">
        <Skeleton className="size-12 rounded-xl animate-none" />
        <Skeleton className="size-12 rounded-xl animate-none" />
        <Skeleton className="size-12 rounded-xl animate-none bg-primary/20" />
        <Skeleton className="size-12 rounded-xl animate-none" />
        <Skeleton className="size-12 rounded-xl animate-none" />
        <Skeleton className="size-12 rounded-xl animate-none" />
      </nav>
    </aside>
  );
}

function SkeletonHome() {
  return (
    <div className="max-w-xl w-full md:mt-20 mt-16 space-y-4 px-4">
      <Skeleton className="h-6 w-16 animate-none" />
      <Skeleton className="h-4 w-40 animate-none" />
      <Skeleton className="h-20 w-full rounded-xl animate-none" />
      <div className="flex justify-end">
        <Skeleton className="h-9 w-24 rounded-full animate-none" />
      </div>
      <div className="mt-20 divide-y divide-border">
        {[...Array(4)].map((_, i) => (
          <SkeletonQuestionItem key={i} />
        ))}
      </div>
    </div>
  );
}
export function Auth() {
  const [isSignUp, setIsSignUp] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const [user, setUser] = useState<AuthPayload>({
    email: "",
    username: "",
    password: "",
  });
  function updateUser(fields: Partial<AuthPayload>) {
    setUser((prev) => {
      return { ...prev, ...fields };
    });
  }
  const {
    mutate: signIn,
    isPending: isInPending,
    error: signInError,
  } = useSignin();
  const {
    mutate: signUp,
    isPending: isUpPending,
    error: signUpError,
  } = useSignup();

  const {
    mutate: requestReset,
    isPending: isResetPending,
    error: resetError,
  } = useRequestPasswordReset();
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isForgotPassword) {
      if (!user.email) return;
      requestReset(user.email, {
        onSuccess: () => setForgotPasswordSuccess(true),
      });
      return;
    }

    if (isSignUp) {
      signUp(
        { ...user, username: user.username.trim(), email: user.email.trim() },
        {
          onSuccess: () => setSignupSuccess(true),
          onError: (err) => console.error(err),
        },
      );
    } else {
      signIn({
        ...user,
        username: user.username.trim(),
        email: user.email.trim(),
      });
    }
  }

  if (forgotPasswordSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto size-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2">
              <span className="text-2xl">📧</span>
            </div>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              If an account exists for <strong>{user.email}</strong>, we've sent instructions to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setForgotPasswordSuccess(false);
                setIsForgotPassword(false);
                setIsSignUp(false);
              }}
            >
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (signupSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto size-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-2">
              <span className="text-2xl">✉️</span>
            </div>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              We've sent a verification link to <strong>{user.email}</strong>.
              Please click the link to verify your account before signing in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setSignupSuccess(false);
                setIsSignUp(false);
              }}
            >
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background relative">
      <div className="flex min-h-screen opacity-70 pointer-events-none">
        <SkeletonSidebar />
        <main className="w-full flex flex-col items-center">
          <SkeletonHome />
        </main>
      </div>
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <Card className="w-full max-w-md mx-4 shadow-2xl">
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
            <CardTitle className="text-lg text-left">
              {isForgotPassword
                ? "Reset Password"
                : isSignUp
                  ? "Create an account"
                  : "Welcome back"}
            </CardTitle>
            <CardDescription className="text-left">
              {isForgotPassword
                ? "Enter your email to receive password reset instructions."
                : isSignUp
                  ? "Enter your details to start asking questions in Echo."
                  : "Sign in to access your questions in Echo."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-3 " onSubmit={handleSubmit}>
              {resetError && isForgotPassword && (
                <div className="bg-destructive/15 text-destructive text-sm px-4 py-3 rounded-lg flex items-center gap-3">
                  <HugeiconsIcon icon={Alert02Icon} size={20} />
                  <span>{resetError.message}</span>
                </div>
              )}
              {signInError && !isSignUp && !isForgotPassword && (
                <div className="bg-destructive/15 text-destructive text-sm  px-4 py-3 rounded-lg flex items-center gap-3">
                  <HugeiconsIcon icon={Alert02Icon} size={20} />
                  <span>{signInError.message}</span>
                </div>
              )}
              {signUpError && isSignUp && !isForgotPassword && (
                <div className="bg-destructive/15 text-destructive text-sm px-4 py-3 rounded-lg flex items-center gap-3">
                  <HugeiconsIcon icon={Alert02Icon} size={20} />
                  <span>{signUpError.message}</span>
                </div>
              )}
              {!isForgotPassword && (
                <Input
                  id="username"
                  type="text"
                  placeholder="Username"
                  aria-label="Username"
                  autoComplete="username"
                  className="text-sm pl-3"
                  onChange={(e) => {
                    updateUser({ username: e.target.value });
                  }}
                />
              )}
              {(isSignUp || isForgotPassword) && (
                <Input
                  id="email"
                  type="email"
                  placeholder="Email"
                  aria-label="Email"
                  autoComplete="email"
                  className="text-sm pl-3"
                  onChange={(e) => {
                    updateUser({ email: e.target.value });
                  }}
                />
              )}
              {!isForgotPassword && (
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  aria-label="Password"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  className="text-sm pl-3"
                  onChange={(e) => {
                    updateUser({ password: e.target.value });
                  }}
                />
              )}
              <Button
                className="w-full"
                type="submit"
                disabled={isInPending || isUpPending || isResetPending}
              >
                {isInPending || isUpPending || isResetPending
                  ? "Loading…"
                  : isForgotPassword
                    ? "Send Reset Link"
                    : isSignUp
                      ? "Create Account"
                      : "Sign in"}
              </Button>
            </form>
            <div className="space-y-2 text-center">
              {!isForgotPassword && !isSignUp && (
                <button
                  onClick={() => setIsForgotPassword(true)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Forgot your password?
                </button>
              )}
              <button
                onClick={() => {
                  if (isForgotPassword) {
                    setIsForgotPassword(false);
                    setIsSignUp(false);
                  } else {
                    setIsSignUp(!isSignUp);
                  }
                }}
                className="block w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isForgotPassword
                  ? "Back to Sign In"
                  : isSignUp
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
      </div>
    </div>
  );
}
