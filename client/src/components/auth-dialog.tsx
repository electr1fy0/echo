import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  useSendOtp,
  useVerifyOtp,
} from "@/hooks/use-auth";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon } from "@hugeicons/core-free-icons";
import { API_URL } from "@/config";
import { useAuthModal } from "@/hooks/use-auth-modal";
import { useIsMobile } from "@/hooks/use-mobile";
import { ShimmeringText } from "@/components/shimmering-text";
import {
  Drawer,
  DrawerPopup,
} from "@/components/ui/drawer";
import {
  SlideToUnlock,
  SlideToUnlockHandle,
  SlideToUnlockText,
  SlideToUnlockTrack,
} from "@/components/slide-to-unlock";
import {
  OTPField,
  OTPFieldInput,
  OTPFieldSeparator,
} from "@/components/ui/otp-field";

type FormMode = "otp-email" | "otp-code";

export function AuthDialog() {
  const { isOpen, close } = useAuthModal();
  const [mode, setMode] = useState<FormMode>("otp-email");
  const isMobile = useIsMobile();
  const otpValues = useRef<string[]>([]);
  const [otpEmail, setOtpEmail] = useState("");
  const [lastOpen, setLastOpen] = useState(false);

  if (isOpen !== lastOpen) {
    setLastOpen(isOpen);
    if (isOpen) {
      setMode("otp-email");
      setOtpEmail("");
      otpValues.current = [];
    }
  }

  const {
    mutateAsync: sendOtp,
    isPending: isOtpSending,
    error: otpSendError,
  } = useSendOtp();
  const {
    mutateAsync: verifyOtp,
    isPending: isOtpVerifying,
    error: otpVerifyError,
  } = useVerifyOtp();

  async function handleSendOtp() {
    if (!otpEmail) return;
    await sendOtp(otpEmail);
    setMode("otp-code");
  }

  async function handleVerifyOtp() {
    const code = otpValues.current.join("");
    if (code.length !== 6) return;
    await verifyOtp({ email: otpEmail, otp: code });
    close();
  }

  const error = mode === "otp-email" ? (otpSendError ?? null) : (otpVerifyError ?? null);

  const renderContent = () => {
    if (mode === "otp-email") {
      return (
        <div className="space-y-5 px-6 pb-6 pt-8">
          <DialogHeader className="text-left px-0 pt-0 pb-2">
            <div className="flex justify-between items-center">
              <div className="size-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                <img
                  src="/turnsoutlogo.svg"
                  alt="TurnsOut"
                  className="size-7 invert dark:invert-0 opacity-80"
                />
              </div>
            </div>
            <DialogTitle className="text-lg text-left font-semibold">
              Welcome to TurnsOut
            </DialogTitle>
            <DialogDescription className="text-left text-xs">
              Enter your email to get a sign-in code.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-destructive/15 text-destructive text-sm px-4 py-3 rounded-lg flex items-center gap-3">
              <HugeiconsIcon icon={Alert02Icon} size={20} />
              <span>{error.message}</span>
            </div>
          )}

          <Input
            name="email"
            type="email"
            placeholder="Email"
            autoComplete="email"
            required
            className="text-base md:text-sm"
            value={otpEmail}
            onChange={(e) => setOtpEmail(e.target.value)}
          />

          <SlideToUnlock
            onUnlock={handleSendOtp}
            disabled={!otpEmail || isOtpSending}
            className="w-full"
          >
            <SlideToUnlockTrack>
              <SlideToUnlockText>
                {({ isDragging }) => (
                  <ShimmeringText
                    text="Slide to get started"
                    isStopped={isDragging}
                    className="text-sm font-medium [--color:rgba(120,113,108,0.6)] [--shimmering-color:rgb(120,113,108)]"
                  />
                )}
              </SlideToUnlockText>
              <SlideToUnlockHandle className="bg-[var(--brand)] text-white" />
            </SlideToUnlockTrack>
          </SlideToUnlock>

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
        </div>
      );
    }

    return (
      <div className="space-y-5 px-6 pb-6 pt-5">
        <DialogHeader className="text-left px-0 pt-0 pb-2">
          <div className="flex justify-between items-center">
            <div className="size-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
              <img
                src="/turnsoutlogo.svg"
                alt="TurnsOut"
                className="size-7 invert dark:invert-0 opacity-80"
              />
            </div>
          </div>
          <DialogTitle className="text-lg text-left font-semibold">
            Check your email
          </DialogTitle>
          <DialogDescription className="text-left text-xs">
            We sent a code to {otpEmail}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="bg-destructive/15 text-destructive text-sm px-4 py-3 rounded-lg flex items-center gap-3">
              <HugeiconsIcon icon={Alert02Icon} size={20} />
              <span>{error.message}</span>
            </div>
          )}
          <div className="flex justify-center py-2">
            <OTPField
              length={6}
              validationType="numeric"
              onValueChange={(value: string) => {
                otpValues.current = value.split("");
                if (value.length === 6) {
                  handleVerifyOtp();
                }
              }}
            >
              <OTPFieldInput aria-label="Character 1 of 6" />
              <OTPFieldInput aria-label="Character 2 of 6" />
              <OTPFieldInput aria-label="Character 3 of 6" />
              <OTPFieldSeparator />
              <OTPFieldInput aria-label="Character 4 of 6" />
              <OTPFieldInput aria-label="Character 5 of 6" />
              <OTPFieldInput aria-label="Character 6 of 6" />
            </OTPField>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            {isOtpVerifying ? "Verifying..." : "Enter the 6-digit code sent to your email"}
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setMode("otp-email")}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Change email
            </button>
            <span className="text-muted-foreground/30">·</span>
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={isOtpSending}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
            >
              {isOtpSending ? "Sending..." : "Resend code"}
            </button>
          </div>
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
          <div data-base-ui-swipe-ignore>
            {renderContent()}
          </div>
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
      <DialogContent className="sm:max-w-md p-0">
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
