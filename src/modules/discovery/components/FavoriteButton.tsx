import { useTranslation } from "react-i18next";
import { Heart } from "lucide-react";
import { cn } from "@shared/lib/utils";
import { useAppDispatch, useAppSelector } from "@app/store";
import {
  addFavoriteLocal,
  removeFavoriteLocal,
} from "../store/discoverySlice";
import {
  useAddFavoriteMutation,
  useRemoveFavoriteMutation,
} from "../hooks/useDiscoveryQueries";

interface Props {
  providerId: number;
  /** Optional, defaults to a square button with just the heart icon. */
  variant?: "icon" | "labeled";
  /** Compact (`sm`) for cards, `md` for the details hero. */
  size?: "sm" | "md";
  className?: string;
}

/**
 * Heart button used on provider cards and details page.
 *
 * Performs **optimistic local state updates** so the UI never feels laggy;
 * if the server call fails the Redux state is rolled back.
 *
 * Visual states:
 *  - inactive: outlined heart, neutral colour
 *  - active:   filled heart, brand colour, subtle shadow
 *
 * Auth state isn't checked here — the surrounding route already enforces
 * authentication. If/when the backend rejects the call (e.g. session
 * expired) the optimistic update is reverted.
 */
export function FavoriteButton({
  providerId,
  variant = "icon",
  size = "sm",
  className,
}: Props) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const favoriteIds = useAppSelector((s) => s.discovery.favoriteIds);
  const isFavorite = favoriteIds.includes(providerId);

  const addMut = useAddFavoriteMutation();
  const removeMut = useRemoveFavoriteMutation();
  const pending = addMut.isPending || removeMut.isPending;

  const toggle = () => {
    if (pending) return;
    if (isFavorite) {
      // Optimistic — roll back on failure.
      dispatch(removeFavoriteLocal(providerId));
      removeMut.mutate(providerId, {
        onError: () => dispatch(addFavoriteLocal(providerId)),
      });
    } else {
      dispatch(addFavoriteLocal(providerId));
      addMut.mutate(providerId, {
        onError: () => dispatch(removeFavoriteLocal(providerId)),
      });
    }
  };

  const label = isFavorite ? t("discovery.removeFromFavorites") : t("discovery.addToFavorites");
  const iconSize = size === "md" ? "h-5 w-5" : "h-4 w-4";
  const padding = size === "md" ? "h-11 w-11" : "h-9 w-9";

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle();
        }}
        aria-pressed={isFavorite}
        aria-label={label}
        title={label}
        disabled={pending}
        className={cn(
          "inline-flex items-center justify-center rounded-full border transition-all shrink-0",
          padding,
          isFavorite
            ? "bg-brand-50 border-brand-200 text-brand-600 hover:bg-brand-100"
            : "bg-white border-ink-200 text-ink-500 hover:border-brand-300 hover:text-brand-500",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className,
        )}
      >
        <Heart className={cn(iconSize, isFavorite && "fill-current")} aria-hidden />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
      aria-pressed={isFavorite}
      disabled={pending}
      className={cn(
        "inline-flex items-center gap-2 rounded-[var(--radius-sm)] border h-10 px-4 text-sm font-medium transition-all",
        isFavorite
          ? "bg-brand-50 border-brand-200 text-brand-600 hover:bg-brand-100"
          : "bg-white border-ink-200 text-ink-700 hover:border-brand-300",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
    >
      <Heart className={cn(iconSize, isFavorite && "fill-current")} aria-hidden />
      <span>{label}</span>
    </button>
  );
}
