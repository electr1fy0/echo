import type { User } from "@/types";
import { HugeiconsIcon } from "@hugeicons/react";
import { useNavigate, useLocation, Link } from "react-router";
import {
  Home01Icon,
  Search01Icon,
  FavouriteIcon,
  Message01Icon,
} from "@hugeicons/core-free-icons";
import { CHAMBER_COLORS } from "@/components/chambers/consts";
import { useListChambers } from "@/hooks/use-chamber";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn, getInitials } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useAuth } from "@/hooks/use-auth";
import { useAuthModal } from "@/hooks/use-auth-modal";

interface NavItem {
  icon: typeof Home01Icon;
  path?: string;
  label: string;
  hasBadge?: boolean;
}

function NavButton({
  icon,
  isActive,
  hasBadge,
  isMobile,
  onClick,
}: {
  icon: typeof Home01Icon;
  isActive?: boolean;
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
        "hover:bg-neutral-100 dark:hover:bg-neutral-800/50",
        isActive
          ? "text-neutral-900 dark:text-neutral-100"
          : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300",
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
  isLoading,
  isMobile,
  isActive,
  onClick,
}: {
  user: User | null | undefined;
  isLoading?: boolean;
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
      {isLoading ? (
        <div className="size-6 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
      ) : user ? (
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

export function AppSidebar() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: user, isLoading } = useAuth();
  const { open: openAuthModal } = useAuthModal();
  const { data: chambersData = [] } = useListChambers();

  const joinedChambers = chambersData.filter((c) => c.isJoined);

  const navItems: NavItem[] = [
    { icon: Home01Icon, path: "/", label: "Home" },
    { icon: Search01Icon, path: "/explore", label: "Explore" },
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
    if (!user && item.path === "/notifications") {
      openAuthModal("signin");
      return;
    }
    if (item.path) {
      navigateTo(item.path);
    }
  };

  const isActive = (path?: string) => path === location.pathname;

  if (isMobile) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 dark:border-neutral-800 bg-background pt-3 pb-8 px-2">
        <div className="flex items-center justify-around">
          {navItems.map((item) => (
            <NavButton
              key={item.label}
              icon={item.icon}
              isActive={isActive(item.path)}
              hasBadge={item.hasBadge}
              isMobile={true}
              onClick={() => handleNavClick(item)}
            />
          ))}
          <ProfileButton
            user={user}
            isLoading={isLoading}
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
    );
  }

  return (
    <aside className="fixed top-0 left-0 h-screen flex flex-col items-center py-6 border-r border-neutral-200 dark:border-neutral-800 bg-background z-40 w-16">
      <Link to="/" className="size-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center cursor-pointer mb-6 shrink-0">
        <img
            src="/turnsoutlogo.svg"
            alt="TurnsOut"
          className="size-6 invert dark:invert-0 opacity-60"
        />
      </Link>
      
      <nav className="flex-1 flex flex-col items-center justify-between w-full min-h-0">
        <div className="flex flex-col items-center gap-3.5 w-full shrink-0">
          {navItems.map((item) => (
            <NavButton
              key={item.label}
              icon={item.icon}
              isActive={isActive(item.path)}
              hasBadge={item.hasBadge}
              isMobile={false}
              onClick={() => handleNavClick(item)}
            />
          ))}
        </div>

        {user && joinedChambers.length > 0 && (
          <div className="flex-1 w-full flex flex-col items-center gap-3.5 my-5 pt-5 pb-2 border-t border-neutral-200 dark:border-neutral-800 overflow-y-auto scrollbar-modern">
            {joinedChambers.map((c) => {
              const color = CHAMBER_COLORS[(c.colorIndex || 0) % CHAMBER_COLORS.length];
              const active = isActive(`/chamber/${c.uid}`);
              const displayInitials = getInitials(c.name);

              return (
                <Link
                  key={c.uid}
                  to={`/chamber/${c.uid}`}
                  title={c.name}
                  className={cn(
                    "size-8 rounded-xl flex items-center justify-center text-white font-bold text-[10px] shrink-0 transition-all duration-300 hover:rounded-lg select-none shadow-sm cursor-pointer",
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

        <div className="flex flex-col items-center pt-4 border-t border-neutral-100 dark:border-neutral-800 w-full shrink-0">
          <ProfileButton
            user={user}
            isLoading={isLoading}
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
  );
}
