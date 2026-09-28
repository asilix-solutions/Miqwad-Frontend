import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { MoreHorizontal, Eye, Pencil, Power, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { usePermissions } from "@shared/auth/usePermissions";
import type { Coupon } from "../types";

export type CouponAction = "detail" | "edit" | "toggle" | "delete";
export function CouponActions({
  coupon,
  disabled,
  onAction,
}: {
  coupon: Coupon;
  disabled: boolean;
  onAction: (action: CouponAction, trigger: HTMLButtonElement | null) => void;
}) {
  const { t, i18n } = useTranslation();
  const { can } = usePermissions();
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <DropdownMenu dir={i18n.dir()}>
      <DropdownMenuTrigger asChild>
        <Button
          ref={trigger}
          variant="ghost"
          size="icon"
          disabled={disabled}
          aria-label={t("coupons.actionsFor", { code: coupon.code ?? t("coupons.notSet") })}
        >
          <MoreHorizontal className="size-5" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onAction("detail", trigger.current)}>
          <Eye aria-hidden />
          {t("coupons.details")}
        </DropdownMenuItem>
        {can("coupons.edit") && (
          <DropdownMenuItem onSelect={() => onAction("edit", trigger.current)}>
            <Pencil aria-hidden />
            {t("common.edit")}
          </DropdownMenuItem>
        )}
        {can("coupons.toggle") && (
          <DropdownMenuItem onSelect={() => onAction("toggle", trigger.current)}>
            <Power aria-hidden />
            {t(coupon.isActive ? "coupons.deactivate" : "coupons.activate")}
          </DropdownMenuItem>
        )}
        {can("coupons.delete") && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-[var(--color-danger-500)]"
              onSelect={() => onAction("delete", trigger.current)}
            >
              <Trash2 aria-hidden />
              {t("common.delete")}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
