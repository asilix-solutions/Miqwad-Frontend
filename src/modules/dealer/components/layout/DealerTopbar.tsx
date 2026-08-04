import type { ReactNode } from "react";
import { LogOut, Languages, User as UserIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@app/store";
import { useLogout } from "@modules/auth/hooks/useLogout";
import i18n from "@app/i18n";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface DealerTopbarProps {
  children?: ReactNode;
}

export function DealerTopbar({ children }: DealerTopbarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const { logout: handleLogout } = useLogout();

  const toggleLang = () => {
    void i18n.changeLanguage(i18n.language === "ar" ? "en" : "ar");
  };

  return (
    <header
      className="flex items-center justify-between px-4 sm:px-6 shrink-0"
      style={{
        height: "64px",
        backgroundColor: "var(--color-surface, #FFFFFF)",
        borderBlockEnd: "1px solid var(--color-divider, #E5E7EB)",
      }}
    >
      <div className="flex items-center min-w-0 flex-1">{children}</div>

      <div className="flex items-center gap-4 ms-auto">
        <button
          onClick={toggleLang}
          className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-ink-600 hover:text-ink-900 hover:bg-ink-50 transition-colors text-sm font-medium"
        >
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline-block">
            {i18n.language === "ar" ? "English" : "العربية"}
          </span>
        </button>

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-3 pe-3 ps-1 py-1 rounded-md hover:bg-ink-50 transition-colors"
              >
                <div className="flex-col items-end hidden sm:flex">
                  <span className="text-sm font-medium text-ink-900 leading-tight">
                    {user.fullName || user.phoneNumber}
                  </span>
                  <span className="text-xs text-ink-500">{user.phoneNumber}</span>
                </div>
                <Avatar className="h-9 w-9 bg-brand-100 text-brand-700">
                  <AvatarImage src={user.avatarUrl ?? undefined} alt={user.fullName} />
                  <AvatarFallback>{user.fullName?.charAt(0) ?? "D"}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user.fullName}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/provider/account")}>
                <UserIcon />
                {t("accountProfile.menuItem")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => void handleLogout()}>
                <LogOut />
                {t("auth.logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </header>
  );
}
