import { createContext, useContext, useState } from "react";

type AuthModalContextType = {
  isOpen: boolean;
  open: (tab?: string) => void;
  close: () => void;
};

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = (_tab?: string) => setIsOpen(true);
  const close = () => setIsOpen(false);

  return (
    <AuthModalContext.Provider value={{ isOpen, open, close }}>
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
