import { useState } from "react";
import type { User } from "@/types";
import { HugeiconsIcon } from "@hugeicons/react";
import { useNavigate, useLocation } from "react-router";
import {
  Home01Icon,
  Search01Icon,
  Add01Icon,
  FavouriteIcon,
  ArrowDown01Icon,
} from "@hugeicons/core-free-icons";
import { CHAMBER_COLORS } from "@/components/chambers/consts";
import { useListChambers } from "@/hooks/use-chamber";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useQuestionDraft, useCreateQuestion } from "@/hooks/use-questions";
interface NavItem {
  icon: typeof Home01Icon;
  path?: string;
  label: string;
  onClick?: () => void;
  isAction?: boolean;
  hasBadge?: boolean;
}
function NavButton({
  icon,
  isActive,
  isAction,
  hasBadge,
  isMobile,
  onClick,
}: {
  icon: typeof Home01Icon;
  isActive?: boolean;
  isAction?: boolean;
  hasBadge?: boolean;
  isMobile: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center justify-center rounded-xl transition-all duration-200 active:scale-95 group/nav",
        isMobile ? "p-2" : "size-12",
        isAction
          ? "bg-primary text-primary-foreground hover:bg-primary/80"
          : "hover:bg-neutral-100 dark:hover:bg-neutral-800/50",
        !isAction &&
          (isActive
            ? "text-neutral-900 dark:text-white"
            : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"),
      )}
    >
      <HugeiconsIcon
        icon={icon}
        className="size-6"
        strokeWidth={isActive ? 2.8 : 2.0}
      />
      {hasBadge && (
        <span
          className={cn(
            "absolute rounded-full bg-red-500 border-2 border-background",
            isMobile ? "top-1 right-1 size-2" : "top-2 right-2 size-2.5",
          )}
        />
      )}
    </button>
  );
}
function ProfileButton({
  user,
  isMobile,
  isActive,
  onClick,
}: {
  user: User | null | undefined;
  isMobile: boolean;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center justify-center rounded-xl transition-all duration-200 active:scale-95",
        isMobile ? "p-2" : "size-12",
        "hover:bg-neutral-100 dark:hover:bg-neutral-800/50",
        isActive
          ? "text-neutral-900 dark:text-white"
          : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300",
      )}
    >
      <UserAvatar
        src={user?.avatar}
        name={user?.username || "U"}
        className="size-6"
      />
    </button>
  );
}

function CreateQueryDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { draft, updateDraft, resetDraft } = useQuestionDraft();
  const { mutate: createQuestion, isPending } = useCreateQuestion();
  const [selectedChamber, setSelectedChamber] = useState<string>("");
  const { data: allChambers = [] } = useListChambers();
  const chambers = allChambers.filter((c) => c.isJoined);
  const handleSubmit = () => {
    if (!draft.content.trim() || !selectedChamber) return;
    createQuestion(
      { content: draft.content, chamberUid: selectedChamber },
      {
        onSuccess: () => {
          onOpenChange(false);
          setTimeout(() => {
            resetDraft();
            setSelectedChamber("");
          }, 200);
        },
      },
    );
  };
  const selectedChamberData = chambers.find((c) => c.uid === selectedChamber);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]   pb-1 p-0     ">
        <DialogHeader>
          <DialogTitle className="pt-6 px-4">New Query</DialogTitle>
        </DialogHeader>
        <div className="pt-4">
          <div
            className="
            bg-background rounded-2xl
            transition-colors
            focus-within:border-neutral-400
            dark:focus-within:border-neutral-500
            overflow-hidden

          "
          >
            <Textarea
              placeholder={
                selectedChamberData
                  ? `Ask in ${selectedChamberData.name}...`
                  : "Select a chamber to ask a question..."
              }
              aria-label="Question content"
              className="resize-none h-32 px-4 border-none shadow-none focus-visible:ring-0 bg-transparent  text-base"
              value={draft.content}
              onChange={(e) => updateDraft({ content: e.target.value })}
              autoFocus
            />
            <div className="flex items-center justify-between p-2 bg-neutral-50/50 dark:bg-neutral-900/50 border-t border-neutral-100 dark:border-neutral-800">
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-lg gap-2 h-8 px-2.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors focus:outline-none">
                  {selectedChamberData ? (
                    <>
                      <div
                        className={cn(
                          "size-2 rounded-full",
                          CHAMBER_COLORS[
                            (selectedChamberData.colorIndex || 0) %
                              CHAMBER_COLORS.length
                          ],
                        )}
                      />
                      {selectedChamberData.name}
                    </>
                  ) : (
                    <>
                      <HugeiconsIcon
                        icon={ArrowDown01Icon}
                        className="size-3.5 text-neutral-500"
                      />
                      Select Chamber
                    </>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {chambers.length > 0 ? (
                    chambers.map((chamber) => (
                      <DropdownMenuItem
                        key={chamber.uid}
                        onClick={() => setSelectedChamber(chamber.uid!)}
                        className="gap-2"
                      >
                        <div
                          className={cn(
                            "size-3 rounded-full",
                            CHAMBER_COLORS[
                              (chamber.colorIndex || 0) % CHAMBER_COLORS.length
                            ],
                          )}
                        />
                        {chamber.name}
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-neutral-500">
                      No chambers joined
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                size="default"
                className="font-normal rounded-lg h-9 px-4"
                onClick={handleSubmit}
                disabled={
                  !selectedChamber || !draft.content.trim() || isPending
                }
              >
                {isPending ? "Asking..." : "Ask"}
                <HugeiconsIcon
                  icon={Add01Icon}
                  strokeWidth={2}
                  className="ml-1.5 size-3.5"
                />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
export function AppSidebar() {
  const isMobile = useIsMobile();
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { data: user } = useAuth();
  const navItems: NavItem[] = [
    { icon: Home01Icon, path: "/home", label: "Home" },
    { icon: Search01Icon, path: "/explore", label: "Explore" },
    { icon: Add01Icon, label: "Create", isAction: true },
    {
      icon: FavouriteIcon,
      path: "/notifications",
      label: "Notifications",
      hasBadge: true,
    },
  ];
  const handleNavClick = (item: NavItem) => {
    if (item.isAction) {
      setCreateOpen(true);
    } else if (item.path) {
      navigate(item.path);
    }
  };
  const isActive = (path?: string) => path === location.pathname;
  if (isMobile) {
    return (
      <>
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 dark:border-neutral-800 bg-background pt-5 pb-10 px-4">
          <div className="flex items-center">
            <div className="flex-1 flex justify-around">
              {navItems.slice(0, 2).map((item) => (
                <NavButton
                  key={item.label}
                  icon={item.icon}
                  isActive={isActive(item.path)}
                  isMobile={true}
                  onClick={() => handleNavClick(item)}
                />
              ))}
            </div>
            <div className="mx-4">
              <NavButton
                icon={navItems[2].icon}
                isAction={true}
                isMobile={true}
                onClick={() => handleNavClick(navItems[2])}
              />
            </div>
            <div className="flex-1 flex justify-around">
              <NavButton
                key="notifications"
                icon={navItems[3].icon}
                isActive={isActive(navItems[3].path)}
                hasBadge={navItems[3].hasBadge}
                isMobile={true}
                onClick={() => handleNavClick(navItems[3])}
              />
              <ProfileButton
                user={user}
                isMobile={true}
                isActive={isActive("/profile")}
                onClick={() => navigate("/profile")}
              />
            </div>
          </div>
        </nav>
        <CreateQueryDialog open={createOpen} onOpenChange={setCreateOpen} />
      </>
    );
  }
  return (
    <>
      <aside className="fixed top-0 left-0 h-screen flex flex-col items-center py-8 border-r border-neutral-200 dark:border-neutral-800 bg-background z-40 w-20">
        <div className="size-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
          <img
            src="/echologo.svg"
            alt="Echo"
            className="size-7 invert dark:invert-0 opacity-60"
          />
        </div>
        <nav className="flex-1 flex flex-col items-center justify-center gap-4 w-full">
          {navItems.map((item) => (
            <NavButton
              key={item.label}
              icon={item.icon}
              isActive={isActive(item.path)}
              isAction={item.isAction}
              hasBadge={item.hasBadge}
              isMobile={false}
              onClick={() => handleNavClick(item)}
            />
          ))}
          <ProfileButton
            user={user}
            isMobile={false}
            isActive={isActive("/profile")}
            onClick={() => navigate("/profile")}
          />
        </nav>
      </aside>
      <CreateQueryDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
