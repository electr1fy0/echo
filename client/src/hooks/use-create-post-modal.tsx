import { createContext, useContext, useState } from "react";

type CreatePostModalContextType = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const CreatePostModalContext = createContext<CreatePostModalContextType | undefined>(undefined);

export function CreatePostModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return (
    <CreatePostModalContext.Provider value={{ isOpen, open, close }}>
      {children}
    </CreatePostModalContext.Provider>
  );
}

export function useCreatePostModal() {
  const context = useContext(CreatePostModalContext);
  if (!context) {
    throw new Error("useCreatePostModal must be used within a CreatePostModalProvider");
  }
  return context;
}
