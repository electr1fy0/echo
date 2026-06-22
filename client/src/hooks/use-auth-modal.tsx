import { createContext, useContext, useState } from "react";

type AuthModalContextType = {
  isOpen: boolean;
  open: (defaultTab?: "signin" | "signup" | "forgot") => void;
  close: () => void;
  defaultTab: "signin" | "signup" | "forgot";
};

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState<"signin" | "signup" | "forgot">("signin");

  const open = (tab: "signin" | "signup" | "forgot" = "signin") => {
    setDefaultTab(tab);
    setIsOpen(true);
  };
  const close = () => setIsOpen(false);

  return (
    <AuthModalContext.Provider value={{ isOpen, open, close, defaultTab }}>
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error("useAuthModal must be used within an AuthModalProvider");
  }
  return context;
}
