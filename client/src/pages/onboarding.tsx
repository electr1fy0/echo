import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Drawer,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerPanel,
  DrawerPopup,
} from "@/components/ui/drawer";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  clearGoogleOnboardingToken,
  getGoogleOnboardingToken,
} from "@/lib/utils";
import { completeOnboarding, checkUsername } from "@/api/auth";
import { useListChambers, useJoinChamber } from "@/hooks/use-chamber";
import { ChamberAvatar } from "@/components/ui/chamber-avatar";

const RESERVED_USERNAMES = ["anonymous", "admin", "moderator", "system", "opencode"];

const USERNAME_REGEX = /^[a-z][a-z0-9_-]*$/;

function normalizeUsername(value: string) {
  return value.trim().replace(/\s+/g, "_").toLowerCase();
}

function validateClientSide(username: string): string | null {
  if (!username) return null;
  if (username.length < 3) return "username must be at least 3 characters";
  if (username.length > 20) return "username must be at most 20 characters";
  if (!USERNAME_REGEX.test(username)) return "username must start with a letter and contain only letters, numbers, underscores, and hyphens";
  if (RESERVED_USERNAMES.includes(username.toLowerCase())) return "this username is reserved";
  return null;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"username" | "chambers">("username");
  const [username, setUsername] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const onboardingToken = getGoogleOnboardingToken();
  const isMobile = useIsMobile();

  const { data: chambersData, isLoading: chambersLoading } = useListChambers();
  const chambers = chambersData || [];
  const { mutate: joinChamber, isPending: joinPending } = useJoinChamber();

  const nextUsername = normalizeUsername(username);
  const clientError = validateClientSide(nextUsername);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const clientErr = validateClientSide(nextUsername);
    if (!nextUsername || clientErr) {
      setChecking(false);
      setAvailable(null);
      return;
    }

    setChecking(true);
    setAvailable(null);

    debounceRef.current = setTimeout(async () => {
      try {
        const result = await checkUsername(nextUsername);
        setAvailable(result.available);
        setError(result.available ? null : result.error ?? null);
      } catch {
        setAvailable(null);
      } finally {
        setChecking(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [nextUsername]);

  if (!onboardingToken && step !== "chambers") {
    navigate("/", { replace: true });
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nextUsername || clientError || checking || available === false) return;

    setIsPending(true);
    setError(null);
    try {
      await completeOnboarding(onboardingToken!, nextUsername);
      queryClient.refetchQueries({ queryKey: ["auth"] });
      setStep("chambers");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete onboarding");
    } finally {
      setIsPending(false);
    }
  }

  function handleFinish() {
    clearGoogleOnboardingToken();
    queryClient.invalidateQueries({ queryKey: ["questions"] });
    queryClient.invalidateQueries({ queryKey: ["chambers"] });
    navigate("/", { replace: true });
  }

  const canSubmit = nextUsername && !clientError && !checking && available === true;

  function renderUsernameStep() {
    return (
      <div>
        <CardHeader>
          <CardTitle>Pick your username</CardTitle>
          <CardDescription>Choose a unique username to get started on TurnsOut.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="relative">
              <Input
                type="text"
                value={username}
                disabled={isPending}
                onChange={(e) => {
                  setError(null);
                  setUsername(e.target.value);
                }}
                placeholder="Username"
                autoFocus
                required
                className="text-base md:text-sm pr-10"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {checking ? (
                  <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin text-muted-foreground" />
                ) : available === true ? (
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4 text-green-500" />
                ) : available === false ? (
                  <HugeiconsIcon icon={Alert02Icon} className="size-4 text-destructive" />
                ) : null}
              </div>
            </div>
            <div className="min-h-5">
              {clientError && (
                <p className="text-xs text-destructive">{clientError}</p>
              )}
              {available === false && !clientError && (
                <p className="text-xs text-destructive">{error || "username already taken"}</p>
              )}
              {available === true && (
                <p className="text-xs text-green-500">username available</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={!canSubmit || isPending}
            >
              {isPending ? "Saving..." : "Continue"}
            </Button>
          </form>
        </CardContent>
      </div>
    );
  }

  function renderChambersStep() {
    return (
      <div>
        <CardHeader>
          <CardTitle>Join some chambers</CardTitle>
          <CardDescription>Pick communities that match your interests to populate your feed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {chambersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : chambers.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-6">
              No chambers available yet. You can create one later.
            </p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-modern">
              {chambers.map((chamber) => {
                return (
                  <div
                    key={chamber.uid}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
                  >
                    <ChamberAvatar
                      name={chamber.name}
                      picture={chamber.picture}
                      icon={chamber.icon}
                      colorIndex={chamber.colorIndex ?? 0}
                      size="sm"
                      className="!size-9 !rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm text-neutral-900 dark:text-neutral-100 truncate">
                        {chamber.name}
                      </h4>
                      <p className="text-[10px] text-neutral-500">
                        {chamber.memberCount || 0} members
                      </p>
                    </div>
                    <Button
                      variant={chamber.isJoined ? "secondary" : "default"}
                      size="xs"
                      disabled={joinPending}
                      onClick={() => {
                        if (chamber.uid) joinChamber(chamber.uid);
                      }}
                    >
                      {chamber.isJoined ? "Joined" : "Join"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
          <Button className="w-full" onClick={handleFinish}>
            Go to feed
            <HugeiconsIcon icon={ArrowRight01Icon} className="size-4 ml-1" />
          </Button>
          <p className="text-[10px] text-neutral-400 text-center">
            You can always join more chambers later from the Explore page.
          </p>
        </CardContent>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="min-h-dvh bg-background">
        <Drawer open={true} onOpenChange={() => {}}>
          <DrawerPopup
            showCloseButton={false}
            className="max-sm:max-h-[96vh]"
            style={{
              backgroundImage: "radial-gradient(circle at 50% 50%, transparent 40%, hsl(var(--background)) 100%), radial-gradient(circle at 1px 1px, rgb(0 0 0 / 0.08) 1.5px, transparent 0)",
              backgroundSize: "100% 100%, 24px 24px",
            }}
          >
            <DrawerHeader>
              <DrawerTitle>
                {step === "username" ? "Pick your username" : "Join some chambers"}
              </DrawerTitle>
              <DrawerDescription>
                {step === "username"
                  ? "Choose a unique username to get started on TurnsOut."
                  : "Pick communities that match your interests to populate your feed."}
              </DrawerDescription>
            </DrawerHeader>
            <DrawerPanel scrollFade={false}>
              <div className="p-4">
                {step === "username" ? (
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="relative">
                      <Input
                        type="text"
                        value={username}
                        disabled={isPending}
                        onChange={(e) => {
                          setError(null);
                          setUsername(e.target.value);
                        }}
                        placeholder="Username"
                        autoFocus
                        required
                        className="text-base md:text-sm pr-10"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {checking ? (
                          <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin text-muted-foreground" />
                        ) : available === true ? (
                          <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4 text-green-500" />
                        ) : available === false ? (
                          <HugeiconsIcon icon={Alert02Icon} className="size-4 text-destructive" />
                        ) : null}
                      </div>
                    </div>
                    <div className="min-h-5">
                      {clientError && (
                        <p className="text-xs text-destructive">{clientError}</p>
                      )}
                      {available === false && !clientError && (
                        <p className="text-xs text-destructive">{error || "username already taken"}</p>
                      )}
                      {available === true && (
                        <p className="text-xs text-green-500">username available</p>
                      )}
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={!canSubmit || isPending}
                    >
                      {isPending ? "Saving..." : "Continue"}
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    {chambersLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-14 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
                        ))}
                      </div>
                    ) : chambers.length === 0 ? (
                      <p className="text-sm text-neutral-500 text-center py-6">
                        No chambers available yet. You can create one later.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {chambers.map((chamber) => {
                          return (
                            <div
                              key={chamber.uid}
                              className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
                            >
                              <ChamberAvatar
                                name={chamber.name}
                                picture={chamber.picture}
                                icon={chamber.icon}
                                colorIndex={chamber.colorIndex ?? 0}
                                size="sm"
                                className="!size-9 !rounded-lg"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm text-neutral-900 dark:text-neutral-100 truncate">
                                  {chamber.name}
                                </h4>
                                <p className="text-[10px] text-neutral-500">
                                  {chamber.memberCount || 0} members
                                </p>
                              </div>
                              <Button
                                variant={chamber.isJoined ? "secondary" : "default"}
                                size="xs"
                                disabled={joinPending}
                                onClick={() => {
                                  if (chamber.uid) joinChamber(chamber.uid);
                                }}
                              >
                                {chamber.isJoined ? "Joined" : "Join"}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <Button className="w-full" onClick={handleFinish}>
                      Go to feed
                      <HugeiconsIcon icon={ArrowRight01Icon} className="size-4 ml-1" />
                    </Button>
                    <p className="text-[10px] text-neutral-400 text-center">
                      You can always join more chambers later from the Explore page.
                    </p>
                  </div>
                )}
              </div>
            </DrawerPanel>
          </DrawerPopup>
        </Drawer>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh flex items-center justify-center bg-background overflow-hidden p-4">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.15]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1.5px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 50%, transparent 40%, var(--background) 100%)",
        }}
      />
      <Card className="relative w-full max-w-md shadow-2xl">
        {step === "username" ? renderUsernameStep() : renderChambersStep()}
      </Card>
    </div>
  );
}
