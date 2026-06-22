import { useState } from "react";
import type { User } from "@/types";
import { HugeiconsIcon } from "@hugeicons/react";
import { useNavigate, useLocation, Link } from "react-router";
import {
  Home01Icon,
  Search01Icon,
  Add01Icon,
  FavouriteIcon,
  Message01Icon,
  ArrowDown01Icon,
} from "@hugeicons/core-free-icons";
import { CHAMBER_COLORS } from "@/components/chambers/consts";
import { useListChambers } from "@/hooks/use-chamber";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn, getInitials } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useAuth } from "@/hooks/use-auth";
import { useAuthModal } from "@/hooks/use-auth-modal";
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
import { MentionField } from "@/components/ui/mention-field";
import { Button } from "@/components/ui/button";
import { useQuestionDraft, useCreateQuestion } from "@/hooks/use-questions";
import { validateMentions } from "@/lib/mention-validation";
import { toast } from "@/lib/toast";

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
        "relative flex items-center justify-center rounded-xl transition-all duration-200 active:scale-95 group/nav cursor-pointer",
        isMobile ? "p-2" : "size-10",
        isAction
          ? "bg-[#ff5a1f] text-white hover:bg-[#e94a12]"
          : "hover:bg-neutral-100 dark:hover:bg-neutral-800/50",
        !isAction &&
          (isActive
            ? "text-neutral-900 dark:text-neutral-100"
            : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"),
      )}
    >
      <HugeiconsIcon
        icon={icon}
        className="size-5"
        strokeWidth={isActive ? 2.8 : 2.0}
      />
      {hasBadge && (
        <span
          className={cn(
            "absolute rounded-full bg-red-500 border-2 border-background",
            isMobile ? "top-1 right-1 size-2" : "top-1.5 right-1.5 size-2",
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
        "relative flex items-center justify-center rounded-xl transition-all duration-200 active:scale-95 cursor-pointer",
        isMobile ? "p-2" : "size-10",
        "hover:bg-neutral-100 dark:hover:bg-neutral-800/50",
        isActive
          ? "text-neutral-900 dark:text-white"
          : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300",
      )}
    >
      {user ? (
        <UserAvatar
          src={user.avatar}
          name={user.username}
          className="size-6"
        />
      ) : (
        <div className="size-6 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-neutral-600 dark:text-neutral-400 select-none">
          G
        </div>
      )}
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
  const [isValidating, setIsValidating] = useState(false);
  const [selectedChamber, setSelectedChamber] = useState<string>("");
  const { data: allChambers = [] } = useListChambers();
  const chambers = allChambers.filter((c) => c.isJoined);

  const handleSubmit = async () => {
    if (!draft.content.trim() || !selectedChamber || isPending || isValidating) return;
    setIsValidating(true);
    try {
      const result = await validateMentions(draft.content);
      if (result.missing.length > 0) {
        toast.error(`User not found: ${result.missing.join(", ")}`);
        setIsValidating(false);
        return;
      }
      createQuestion(
        { content: draft.content, chamberUid: selectedChamber, postType: "qna" },
        {
          onSuccess: () => {
            onOpenChange(false);
            setTimeout(() => {
              resetDraft();
              setSelectedChamber("");
            }, 200);
          },
          onSettled: () => {
            setIsValidating(false);
          },
        },
      );
    } catch {
      toast.error("Failed to validate mentions");
      setIsValidating(false);
    }
  };

  const selectedChamberData = chambers.find((c) => c.uid === selectedChamber);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[500px] overflow-hidden p-0 pb-1"
      >
        <DialogHeader>
          <DialogTitle className="pt-6 px-4">New Query</DialogTitle>
        </DialogHeader>
        <div className="pt-4">
          <div className="bg-background transition-colors focus-within:border-neutral-400 dark:focus-within:border-neutral-500">
            <MentionField
              placeholder={
                selectedChamberData
                  ? `Ask in ${selectedChamberData.name}...`
                  : "Select a chamber to ask a question..."
              }
              ariaLabel="Question content"
              className="resize-none h-32 px-4 border-none shadow-none focus-visible:ring-0 bg-transparent text-base"
              value={draft.content}
              onValueChange={(value) => updateDraft({ content: value })}
              multiline
              autoFocus
            />
            <div className="flex items-center justify-between p-2 bg-neutral-50/50 dark:bg-neutral-900/50 border-t border-neutral-100 dark:border-neutral-800">
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-lg gap-2 h-8 px-2.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors focus:outline-none cursor-pointer">
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
                className="font-normal rounded-lg h-9 px-4 bg-[#ff5a1f] hover:bg-[#e94a12] text-white border-none cursor-pointer"
                onClick={handleSubmit}
                disabled={
                  !selectedChamber || !draft.content.trim() || isPending || isValidating
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
  const { open: openAuthModal } = useAuthModal();
  const { data: chambersData = [] } = useListChambers();

  const joinedChambers = chambersData.filter((c) => c.isJoined);

  const navItems: NavItem[] = [
    { icon: Home01Icon, path: "/", label: "Home" },
    { icon: Search01Icon, path: "/explore", label: "Explore" },
    { icon: Add01Icon, label: "Create", isAction: true },
    {
      icon: Message01Icon,
      path: "/dm",
      label: "Messages",
    },
    {
      icon: FavouriteIcon,
      path: "/notifications",
      label: "Notifications",
      hasBadge: true,
    },
  ];

  const navigateTo = (path: string) => {
    if (path === location.pathname) return;
    navigate(path);
  };

  const handleNavClick = (item: NavItem) => {
    if (!user && (item.isAction || item.path === "/notifications")) {
      openAuthModal("signin");
      return;
    }
    if (item.isAction) {
      setCreateOpen(true);
    } else if (item.path) {
      navigateTo(item.path);
    }
  };

  const isActive = (path?: string) => path === location.pathname;

  if (isMobile) {
    return (
      <>
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 dark:border-neutral-800 bg-background pt-3 pb-8 px-2">
          <div className="flex items-center justify-around">
            {/* Home */}
            <NavButton
              icon={navItems[0].icon}
              isActive={isActive(navItems[0].path)}
              isMobile={true}
              onClick={() => handleNavClick(navItems[0])}
            />
            {/* Explore */}
            <NavButton
              icon={navItems[1].icon}
              isActive={isActive(navItems[1].path)}
              isMobile={true}
              onClick={() => handleNavClick(navItems[1])}
            />
            {/* Create (center action) */}
            <NavButton
              icon={navItems[2].icon}
              isAction={true}
              isMobile={true}
              onClick={() => handleNavClick(navItems[2])}
            />
            {/* Messages */}
            <NavButton
              icon={navItems[3].icon}
              isActive={isActive(navItems[3].path)}
              isMobile={true}
              onClick={() => handleNavClick(navItems[3])}
            />
            {/* Notifications */}
            <NavButton
              icon={navItems[4].icon}
              isActive={isActive(navItems[4].path)}
              hasBadge={navItems[4].hasBadge}
              isMobile={true}
              onClick={() => handleNavClick(navItems[4])}
            />
            {/* Profile */}
            <ProfileButton
              user={user}
              isMobile={true}
              isActive={isActive("/profile")}
              onClick={() => {
                if (!user) {
                  openAuthModal("signin");
                } else {
                  navigateTo("/profile");
                }
              }}
            />
          </div>
        </nav>
        <CreateQueryDialog open={createOpen} onOpenChange={setCreateOpen} />
      </>
    );
  }

  return (
    <>
      <aside className="fixed top-0 left-0 h-screen flex flex-col items-center py-6 border-r border-neutral-200 dark:border-neutral-800 bg-background z-40 w-16">
        <Link to="/" className="size-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center cursor-pointer mb-6 shrink-0">
          <img
            src="/echologo.svg"
            alt="Echo"
            className="size-6 invert dark:invert-0 opacity-60"
          />
        </Link>
        
        <nav className="flex-1 flex flex-col items-center justify-between w-full min-h-0">
          {/* Top Actions Block */}
          <div className="flex flex-col items-center gap-3.5 w-full shrink-0">
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
          </div>

          {/* Middle Starred/Joined Discord-style server list */}
          {user && joinedChambers.length > 0 && (
            <div className="flex-1 w-full flex flex-col items-center gap-3.5 my-5 pt-5 pb-2 border-t border-neutral-200 dark:border-neutral-800 overflow-y-auto scrollbar-modern">
              {joinedChambers.map((c) => {
                const color = CHAMBER_COLORS[(c.colorIndex || 0) % CHAMBER_COLORS.length];
                const active = isActive(`/chamber/${c.uid}`);
                const displayInitials = c.courseCode ? c.courseCode.substring(0, 3) : getInitials(c.name);

                return (
                  <Link
                    key={c.uid}
                    to={`/chamber/${c.uid}`}
                    title={c.name}
                    className={cn(
                      "size-8 rounded-xl flex items-center justify-center text-white font-bold text-[10px] shrink-0 transition-all duration-300 hover:rounded-lg select-none shadow-sm cursor-pointer ml-3",
                      color,
                      active 
                        ? "ring-2 ring-[#ff5a1f] ring-offset-2 ring-offset-background scale-105" 
                        : "opacity-85 hover:opacity-100"
                    )}
                  >
                    {displayInitials}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Bottom Actions Block */}
          <div className="flex flex-col items-center pt-4 border-t border-neutral-100 dark:border-neutral-800 w-full shrink-0">
            <ProfileButton
              user={user}
              isMobile={false}
              isActive={isActive("/profile")}
              onClick={() => {
                if (!user) {
                  openAuthModal("signin");
                } else {
                  navigateTo("/profile");
                }
              }}
            />
          </div>
        </nav>
      </aside>
      <CreateQueryDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
