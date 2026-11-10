/**
 * @file AdminTopbar.tsx
 * @description Admin dashboard top bar. The admin's name/avatar opens a
 * dropdown menu with a link to their profile page and the sanctioned logout
 * action (via useLogout — never re-implemented here).
 */

import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import "./adminNavigation.css";
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
      className="admin-topbar shrink-0"
      style={{
        height: "64px",
        backgroundColor: "var(--color-surface, #FFFFFF)",
        borderBlockEnd: "1px solid var(--color-divider, #E5E7EB)",
      }}
    >
      <div className="admin-topbar-leading">{children}</div>

      <WorkspaceSwitcher />

      <div className="admin-topbar-account">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="admin-account-trigger hover:bg-ink-50 rounded-md"
                aria-label={t("admin.workspaces.account", { name: user.fullName })}
              >
                <div className="admin-account-text">
                  <span className="text-ink-900 text-sm leading-tight font-medium">
                    {user.fullName}
                  </span>
                  <span className="text-ink-500 text-xs capitalize">
                    {user.role.replace("_", " ")}
                  </span>
                </div>
                <Avatar className="bg-brand-100 text-brand-700 h-9 w-9">
                  <AvatarImage src={user.avatarUrl ?? undefined} alt={user.fullName} />
                  <AvatarFallback>{user.fullName?.charAt(0) ?? "A"}</AvatarFallback>
                </Avatar>
                <ChevronDown className="admin-account-chevron text-ink-500 h-4 w-4" aria-hidden />
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
