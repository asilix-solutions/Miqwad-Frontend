/**
 * @file AdminTopbar.tsx
 * @description Admin dashboard top bar. The admin's name/avatar opens a
 * dropdown menu with a link to their profile page and the sanctioned logout
 * action (via useLogout — never re-implemented here).
 */

import type { ReactNode } from "react";
import { LogOut, User, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "@app/store";
import { useLogout } from "@modules/auth/hooks/useLogout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface AdminTopbarProps {
  children?: ReactNode;
}

export function AdminTopbar({ children }: AdminTopbarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const { logout: handleLogout } = useLogout();

  return (
    <header
      className="flex items-center justify-between px-4 sm:px-6 shrink-0"
      style={{
        height: "64px",
        backgroundColor: "var(--color-surface, #FFFFFF)",
        borderBlockEnd: "1px solid var(--color-divider, #E5E7EB)",
      }}
    >
      <div className="flex items-center min-w-0 flex-1">
        {children}
      </div>

      <div className="flex items-center gap-4 ms-auto">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-3 pe-3 ps-1 py-1 rounded-md hover:bg-ink-50 transition-colors"
              >
                <div className="flex-col items-end hidden sm:flex">
                  <span className="text-sm font-medium text-ink-900 leading-tight">
                    {user.fullName}
                  </span>
                  <span className="text-xs text-ink-500 capitalize">
                    {user.role.replace("_", " ")}
                  </span>
                </div>
                <Avatar className="h-9 w-9 bg-brand-100 text-brand-700">
                  <AvatarImage src={user.avatarUrl ?? undefined} alt={user.fullName} />
                  <AvatarFallback>{user.fullName?.charAt(0) ?? "A"}</AvatarFallback>
                </Avatar>
                <ChevronDown className="h-4 w-4 text-ink-500 hidden sm:block" aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user.fullName}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/admin/profile")}>
                <User />
                {t("admin.profileMenuItem")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => void handleLogout()}>
                <LogOut />
                {t("admin.logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </header>
  );
}
