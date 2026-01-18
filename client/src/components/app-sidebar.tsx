import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { useNavigate, useLocation } from "react-router";
import {
  Home01Icon,
  Search01Icon,
  Add01Icon,
  FavouriteIcon,
  Menu01Icon,
  Sun03Icon,
  Moon02Icon,
  Logout01Icon,
  ComputerIcon,
} from "@hugeicons/core-free-icons";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth, useSignout } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";
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
  DialogFooter,
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
        "relative flex items-center justify-center rounded-xl transition-all duration-200",
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
        className="size-6 transition-all duration-200"
        strokeWidth={isActive ? 2.5 : 1.5}
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
  user: any;
  isMobile: boolean;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center justify-center rounded-xl transition-all duration-200",
        isMobile ? "p-2" : "size-12",
        "hover:bg-neutral-100 dark:hover:bg-neutral-800/50",
        isActive
          ? "text-neutral-900 dark:text-white"
          : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300",
      )}
    >
      <Avatar className="size-6">
        <AvatarImage
          src={
            user?.username
              ? `https://github.com/${user.username}.png`
              : undefined
          }
        />
        <AvatarFallback>{user?.username?.[0] ?? "U"}</AvatarFallback>
      </Avatar>
    </button>
  );
}
function MenuButton({
  isMobile,
  onThemeChange,
  onSignout,
}: {
  isMobile: boolean;
  onThemeChange: (theme: "light" | "dark" | "system") => void;
  onSignout: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "relative flex items-center justify-center rounded-xl transition-all duration-200",
          isMobile ? "p-2" : "size-12",
          "hover:bg-neutral-100 dark:hover:bg-neutral-800/50",
          "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300",
        )}
      >
        <HugeiconsIcon
          icon={Menu01Icon}
          className="size-6 transition-all duration-200"
          strokeWidth={1.5}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={isMobile ? "end" : "start"}
        side={isMobile ? "top" : "right"}
        className="w-56 mb-4 ml-2"
      >
        <DropdownMenuItem onClick={() => onThemeChange("light")}>
          <HugeiconsIcon icon={Sun03Icon} className="mr-2 size-4" /> Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onThemeChange("dark")}>
          <HugeiconsIcon icon={Moon02Icon} className="mr-2 size-4" /> Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onThemeChange("system")}>
          <HugeiconsIcon icon={ComputerIcon} className="mr-2 size-4" /> System
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onSignout}
          className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-400/10"
        >
          <HugeiconsIcon icon={Logout01Icon} className="mr-2 size-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
import { CHAMBER_COLORS } from "@/components/chambers/consts";
import { useListChambers } from "@/hooks/use-chamber";
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Query</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-start rounded-xl gap-2 h-10 px-3 text-sm border border-neutral-200 dark:border-neutral-700 bg-background hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                {selectedChamberData ? (
                  <>
                    <div
                      className={cn(
                        "size-3 rounded-full",
                        CHAMBER_COLORS[
                          (selectedChamberData.colorIndex || 0) %
                            CHAMBER_COLORS.length
                        ],
                      )}
                    />
                    {selectedChamberData.name}
                  </>
                ) : (
                  <span className="text-neutral-500">Select a chamber...</span>
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
                  <div className="p-2 text-xs text-neutral-500 text-center">
                    No joined chambers
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Textarea
            placeholder="What's on your mind?"
            className="w-full resize-none bg-transparent focus-visible:ring-0 p-0 text-base border-none rounded-none shadow-none min-h-16 placeholder:text-neutral-400"
            value={draft.content}
            onChange={(e) => updateDraft({ content: e.target.value })}
            autoFocus
          />
        </div>
        <DialogFooter className="flex-row items-center justify-between sm:justify-between">
          {selectedChamberData && (
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <div
                className={cn(
                  "size-3 rounded-full",
                  CHAMBER_COLORS[
                    (selectedChamberData.colorIndex || 0) %
                      CHAMBER_COLORS.length
                  ],
                )}
              />
              Posting to {selectedChamberData.name}
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending || !selectedChamber}
            >
              {isPending ? "Posting..." : "Ask Query"}
            </Button>
          </div>
        </DialogFooter>
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
  const { setTheme } = useTheme();
  const { mutate: signout } = useSignout();
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
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 dark:border-neutral-800 bg-background py-6 px-4">
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
              <MenuButton
                isMobile={true}
                onThemeChange={setTheme}
                onSignout={() => signout()}
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
        <div className="bg-orange-500 rounded-full size-6 shrink-0 shadow-sm" />
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
          <MenuButton
            isMobile={false}
            onThemeChange={setTheme}
            onSignout={() => signout()}
          />
        </nav>
      </aside>
      <CreateQueryDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
