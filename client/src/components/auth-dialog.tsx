import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useSignin, useSignup } from "@/hooks/use-auth";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon } from "@hugeicons/core-free-icons";
import { API_URL } from "@/config";
import { useAuthModal } from "@/hooks/use-auth-modal";
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerPopup } from "@/components/ui/drawer";

type FormMode = "signin" | "signup";

export function AuthDialog() {
  const { isOpen, close } = useAuthModal();
  const [mode, setMode] = useState<FormMode>("signin");
  const isMobile = useIsMobile();
  const [lastOpen, setLastOpen] = useState(false);

  // Form states
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (isOpen !== lastOpen) {
    setLastOpen(isOpen);
    if (isOpen) {
      setMode("signin");
      setUsername("");
      setEmail("");
      setPassword("");
      setErrorMsg(null);
    }
  }

  const { mutateAsync: signinMutate, isPending: isSigninPending } = useSignin();
  const { mutateAsync: signupMutate, isPending: isSignupPending } = useSignup();

  const isPending = isSigninPending || isSignupPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      if (mode === "signin") {
        await signinMutate({ username, email: "", password });
        close();
      } else {
        await signupMutate({ username, email, password });
        close();
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Authentication failed");
    }
  };

  const toggleMode = () => {
    setErrorMsg(null);
    setMode((prev) => (prev === "signin" ? "signup" : "signin"));
  };

  const renderContent = () => {
    return (
      <div className="space-y-5 px-6 pb-6 pt-6">
        <DialogHeader className="text-left px-0 pt-0 pb-1">
          <div className="flex justify-between items-center mb-2">
            <div className="size-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
              <img
                src="/turnsoutlogo.svg"
                alt="TurnsOut"
                className="size-7 invert dark:invert-0 opacity-80"
              />
            </div>
          </div>
          <DialogTitle className="text-lg text-left font-semibold">
            {mode === "signin" ? "Welcome back to TurnsOut" : "Create your account"}
          </DialogTitle>
          <DialogDescription className="text-left text-xs">
            {mode === "signin"
              ? "Sign in with your username or email to continue."
              : "Enter your details below to get started."}
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="bg-destructive/15 text-destructive text-sm px-4 py-3 rounded-lg flex items-center gap-3">
            <HugeiconsIcon icon={Alert02Icon} size={20} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signin" ? (
            <div>
              <Input
                name="username"
                type="text"
                placeholder="Username or email"
                autoComplete="username"
                required
                className="text-base md:text-sm"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          ) : (
            <>
              <div>
                <Input
                  name="username"
                  type="text"
                  placeholder="Username"
                  autoComplete="username"
                  required
                  className="text-base md:text-sm"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <Input
                  name="email"
                  type="email"
                  placeholder="Email address"
                  autoComplete="email"
                  required
                  className="text-base md:text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </>
          )}

          <div>
            <Input
              name="password"
              type="password"
              placeholder="Password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              className="text-base md:text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full mt-2" disabled={isPending}>
            {isPending
              ? mode === "signin"
                ? "Signing in..."
                : "Creating account..."
              : mode === "signin"
                ? "Sign in"
                : "Create account"}
          </Button>
        </form>

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

        <button
          type="button"
          onClick={() => {
            window.location.href = `${API_URL}/auth/signin-with-google`;
          }}
          className="w-full flex items-center justify-center gap-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt=""
            className="size-4"
            aria-hidden="true"
          />
          Continue with Google
        </button>

        <div className="text-center pt-1">
          <button
            type="button"
            onClick={toggleMode}
            className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors cursor-pointer"
          >
            {mode === "signin"
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    );
  };

  if (isMobile) {
    return (
      <Drawer
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <DrawerPopup className="p-0">
          <div data-base-ui-swipe-ignore>{renderContent()}</div>
        </DrawerPopup>
      </Drawer>
    );
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent className="sm:max-w-md p-0">{renderContent()}</DialogContent>
    </Dialog>
  );
}
