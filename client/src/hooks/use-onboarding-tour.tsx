import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const TOUR_KEY = "turnsout_onboarding_seen";

export interface TourStep {
  id: string;
  targetSelector: string | null;
  title: string;
  description: string;
  descriptionMobile?: string;
  placement: "top" | "bottom" | "left" | "right";
}

const STEPS: TourStep[] = [
  {
    id: "welcome",
    targetSelector: null,
    title: "Welcome to TurnsOut!",
    description: "Let's take a quick tour of the key features to help you get started. It'll only take a moment.",
    placement: "bottom",
  },
  {
    id: "nav-shortcuts",
    targetSelector: "[data-tour='nav-shortcuts']",
    title: "Navigation",
    description: "Navigate instantly: press 1 (Home), 2 (Explore), 3 (Messages), 4 (Activity), 5 (Profile). No clicking needed.",
    descriptionMobile: "Tap the icons below to navigate between Home, Explore, Messages, Activity, and your Profile.",
    placement: "right",
  },
  {
    id: "create-post",
    targetSelector: "[data-tour='create-post']",
    title: "Create Posts",
    description: "Hit c or click the + button to create a post. Choose from Q&A, Partner Finder, Market, or Taxi / Rides.",
    descriptionMobile: "Tap the + button to create a post. Choose from Q&A, Partner Finder, Market, or Taxi / Rides.",
    placement: "right",
  },
  {
    id: "chambers",
    targetSelector: "[data-tour='chambers']",
    title: "Chambers",
    description: "Your joined chambers appear here. Each chamber has channels for different topics — discussions, partners, marketplace, and more.",
    placement: "right",
  },
  {
    id: "explore",
    targetSelector: "[data-tour='explore']",
    title: "Explore",
    description: "Discover chambers, search for users, and find trending posts. Join new communities from the Explore page.",
    placement: "right",
  },
  {
    id: "activity",
    targetSelector: "[data-tour='activity']",
    title: "Activity",
    description: "Replies, upvotes, mentions, and interest in your posts all show up here. Stay in the loop.",
    placement: "right",
  },
  {
    id: "done",
    targetSelector: null,
    title: "You're all set!",
    description: "Happy connecting! You can restart this tour anytime from your Profile settings.",
    placement: "bottom",
  },
];

interface OnboardingTourContextValue {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  step: TourStep;
  next: () => void;
  prev: () => void;
  skip: () => void;
  dismiss: () => void;
  start: () => void;
  hasSeen: boolean;
}

const OnboardingTourContext = createContext<OnboardingTourContextValue | null>(null);

function getSteps(isMobile: boolean): TourStep[] {
  if (isMobile) {
    return STEPS.filter((s) => s.id !== "chambers");
  }
  return STEPS;
}

export function OnboardingTourProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeen, setHasSeen] = useState(true);
  const isMobile = useIsMobile();
  const steps = getSteps(isMobile);

  useEffect(() => {
    const seen = localStorage.getItem(TOUR_KEY) === "true";
    setHasSeen(seen);
  }, []);

  const markSeen = useCallback(() => {
    localStorage.setItem(TOUR_KEY, "true");
    setHasSeen(true);
  }, []);

  const start = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const dismiss = useCallback(() => {
    setIsActive(false);
    if (!hasSeen) {
      markSeen();
    }
  }, [hasSeen, markSeen]);

  const next = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev >= steps.length - 1) {
        setIsActive(false);
        markSeen();
        return prev;
      }
      return prev + 1;
    });
  }, [markSeen, steps.length]);

  const prev = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const skip = useCallback(() => {
    dismiss();
  }, [dismiss]);

  const rawStep = steps[currentStep] || steps[0];
  const step: TourStep = {
    ...rawStep,
    description: isMobile && rawStep.descriptionMobile ? rawStep.descriptionMobile : rawStep.description,
  };

  return (
    <OnboardingTourContext.Provider
      value={{
        isActive,
        currentStep,
        totalSteps: steps.length,
        step,
        next,
        prev,
        skip,
        dismiss,
        start,
        hasSeen,
      }}
    >
      {children}
    </OnboardingTourContext.Provider>
  );
}

export function useOnboardingTour() {
  const ctx = useContext(OnboardingTourContext);
  if (!ctx) throw new Error("useOnboardingTour must be used within OnboardingTourProvider");
  return ctx;
}

export { STEPS };
export type { OnboardingTourContextValue };
