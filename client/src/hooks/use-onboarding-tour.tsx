import {
  createContext,
  useCallback,
  useContext,
  type ReactNode,
} from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateProfile } from "@/hooks/use-profile";
import { useQueryClient } from "@tanstack/react-query";

interface OnboardingTourContextValue {
  hasSeen: boolean;
  start: () => void;
}

const OnboardingTourContext = createContext<OnboardingTourContextValue | null>(
  null,
);

export function OnboardingTourProvider({ children }: { children: ReactNode }) {
  const { data: user } = useAuth();
  const { mutate: updateProfile } = useUpdateProfile();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const hasSeen = user?.tourSeen ?? true;

  const start = useCallback(() => {
    const markSeen = () => {
      updateProfile(
        { tourSeen: true },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["auth"] });
          },
        },
      );
    };

    const allSteps = [
      {
        popover: {
          title: "Welcome to TurnsOut!",
          description:
            "Let's take a quick tour of the key features to help you get started. It'll only take a moment.",
        },
      },
      {
        element: "[data-tour='nav-shortcuts']",
        popover: {
          title: "Navigation",
          description: isMobile
            ? "Tap the icons below to navigate between Home, Explore, Messages, Activity, and your Profile."
            : "Navigate instantly: press 1 (Home), 2 (Explore), 3 (Messages), 4 (Activity), 5 (Profile). No clicking needed.",
          side: "right" as const,
        },
      },
      {
        element: "[data-tour='create-post']",
        popover: {
          title: "Create Posts",
          description: isMobile
            ? "Tap the + button to create a post. Choose from Q&A, Partner Finder, Market, or Taxi / Rides."
            : "Hit c or click the + button to create a post. Choose from Q&A, Partner Finder, Market, or Taxi / Rides.",
          side: "right" as const,
        },
      },
      ...(!isMobile
        ? [
            {
              element: "[data-tour='chambers']",
              popover: {
                title: "Chambers",
                description:
                  "Your joined chambers appear here. Each chamber has channels for different topics — discussions, partners, marketplace, and more.",
                side: "right" as const,
              },
            },
          ]
        : []),
      {
        element: "[data-tour='explore']",
        popover: {
          title: "Explore",
          description:
            "Discover chambers, search for users, and find trending posts. Join new communities from the Explore page.",
          side: "right" as const,
        },
      },
      {
        element: "[data-tour='activity']",
        popover: {
          title: "Activity",
          description:
            "Replies, upvotes, mentions, and interest in your posts all show up here. Stay in the loop.",
          side: "right" as const,
        },
      },
      {
        popover: {
          title: "You're all set!",
          description:
            "Happy connecting! You can restart this tour anytime from your Profile settings.",
        },
      },
    ];

    const driverObj = driver({
      showProgress: true,
      steps: allSteps,
      onDestroyed: markSeen,
    });
    driverObj.drive();
  }, [isMobile]);

  return (
    <OnboardingTourContext.Provider value={{ hasSeen, start }}>
      {children}
    </OnboardingTourContext.Provider>
  );
}

export function useOnboardingTour() {
  const ctx = useContext(OnboardingTourContext);
  if (!ctx)
    throw new Error(
      "useOnboardingTour must be used within OnboardingTourProvider",
    );
  return ctx;
}
