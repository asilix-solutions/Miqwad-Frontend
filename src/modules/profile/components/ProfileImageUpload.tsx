/**
 * @file ProfileImageUpload.tsx
 *
 * Circular profile-photo control for {@link ProviderAccountPage}'s identity
 * banner. Self-contained: owns its own query/mutations via
 * `@modules/profile/hooks/useProfileImage` so the page only needs to drop it
 * in and pass a fallback initial for the empty state.
 *
 * States: Loading (shimmer circle), Empty (initial-letter avatar + camera
 * affordance), Error (inline message under the avatar), and the
 * upload/replace/remove actions themselves.
 *
 * Isolated from `@shared/provider-ui/ProviderImageUpload` — that component is
 * for local-only data-URL previews (products form); this one talks to the
 * real /api/profile/image endpoint and must not be conflated with it.
 */
import { useRef, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@shared/components/ui/toastContext";
import { cn } from "@shared/lib/utils";
import { ProviderSkeleton } from "@shared/provider-ui";
import {
  useProfileImageQuery,
  useUploadProfileImage,
  useDeleteProfileImage,
} from "../hooks/useProfileImage";

const MAX_SIZE_MB = 8;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export interface ProfileImageUploadProps {
  /** Single-letter fallback rendered when no image exists. */
  fallbackInitial: string;
}

export function ProfileImageUpload({ fallbackInitial }: ProfileImageUploadProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const imageQuery = useProfileImageQuery();
  const uploadMutation = useUploadProfileImage();
  const deleteMutation = useDeleteProfileImage();

  const imageUrl = imageQuery.data?.url;
  const isBusy = uploadMutation.isPending || deleteMutation.isPending;

  const handleFile = (file: File) => {
    setLocalError(null);

    if (!file.type.startsWith("image/")) {
      setLocalError(t("accountProfile.image.errors.invalidType"));
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setLocalError(t("accountProfile.image.errors.tooLarge", { size: MAX_SIZE_MB }));
      return;
    }

    uploadMutation.mutate(file, {
      onSuccess: () => toast.success(t("accountProfile.image.uploadSuccess")),
      onError: () => toast.error(t("accountProfile.image.uploadFailed")),
    });
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleRemove = () => {
    deleteMutation.mutate(undefined, {
      onSuccess: () => toast.success(t("accountProfile.image.removeSuccess")),
      onError: () => toast.error(t("accountProfile.image.removeFailed")),
    });
  };

  if (imageQuery.isLoading) {
    return <ProviderSkeleton variant="circle" width={64} height={64} />;
  }

  const displayError = localError ?? (imageQuery.isError ? t("accountProfile.image.loadFailed") : undefined);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-full shadow-[var(--shadow-provider-sm)]">
        {imageUrl ? (
          <img src={imageUrl} alt="" aria-hidden className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[var(--color-brand-orange)] text-2xl font-semibold text-white">
            {fallbackInitial}
          </div>
        )}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isBusy}
          aria-label={t("accountProfile.image.change")}
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            "bg-[var(--color-ink-body)]/40 opacity-0",
            "transition-opacity duration-[var(--dur-fast)]",
            "group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none",
            "disabled:cursor-not-allowed",
          )}
        >
          {isBusy ? (
            <Loader2 className="h-5 w-5 animate-spin text-white" aria-hidden />
          ) : (
            <Camera className="h-5 w-5 text-white" aria-hidden />
          )}
        </button>

        {imageUrl && !isBusy && (
          <button
            type="button"
            onClick={handleRemove}
            aria-label={t("accountProfile.image.remove")}
            className="absolute -bottom-0.5 -end-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-danger-500)] text-white shadow-[var(--shadow-provider-sm)]"
          >
            <Trash2 className="h-3 w-3" aria-hidden />
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        tabIndex={-1}
        aria-hidden
      />

      {displayError && (
        <p role="alert" className="max-w-[8rem] text-[10px] leading-tight text-[var(--color-danger-500)]">
          {displayError}
        </p>
      )}
    </div>
  );
}
