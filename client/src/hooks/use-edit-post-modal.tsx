import { createContext, useContext, useState } from "react";
import type { Question } from "@/types";

type EditPostModalContextType = {
  isOpen: boolean;
  open: (question: Question) => void;
  close: () => void;
  editingQuestion: Question | null;
};

const EditPostModalContext = createContext<EditPostModalContextType | undefined>(undefined);

export function EditPostModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const open = (question: Question) => {
    setEditingQuestion(question);
    setIsOpen(true);
  };
  const close = () => {
    setEditingQuestion(null);
    setIsOpen(false);
  };

  return (
    <EditPostModalContext.Provider
      value={{
        isOpen,
        open,
        close,
        editingQuestion,
      }}
    >
      {children}
    </EditPostModalContext.Provider>
  );
}

export function useEditPostModal() {
  const context = useContext(EditPostModalContext);
  if (!context) {
    throw new Error("useEditPostModal must be used within a EditPostModalProvider");
  }
  return context;
}
