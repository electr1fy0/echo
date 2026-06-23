import { createContext, useContext, useState } from "react";

type CreatePostModalContextType = {
  isOpen: boolean;
  open: (chamberId?: string, channelId?: string) => void;
  close: () => void;
  defaultChamberId?: string;
  defaultChannelId?: string;
  activeChamberId?: string;
  activeChannelId?: string;
  setActiveChamberId: (id?: string) => void;
  setActiveChannelId: (id?: string) => void;
};

const CreatePostModalContext = createContext<CreatePostModalContextType | undefined>(undefined);

export function CreatePostModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultChamberId, setDefaultChamberId] = useState<string | undefined>(undefined);
  const [defaultChannelId, setDefaultChannelId] = useState<string | undefined>(undefined);
  const [activeChamberId, setActiveChamberId] = useState<string | undefined>(undefined);
  const [activeChannelId, setActiveChannelId] = useState<string | undefined>(undefined);

  const open = (chamberId?: string, channelId?: string) => {
    setDefaultChamberId(chamberId);
    setDefaultChannelId(channelId);
    setIsOpen(true);
  };
  const close = () => {
    setDefaultChamberId(undefined);
    setDefaultChannelId(undefined);
    setIsOpen(false);
  };

  return (
    <CreatePostModalContext.Provider
      value={{
        isOpen,
        open,
        close,
        defaultChamberId,
        defaultChannelId,
        activeChamberId,
        activeChannelId,
        setActiveChamberId,
        setActiveChannelId,
      }}
    >
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
