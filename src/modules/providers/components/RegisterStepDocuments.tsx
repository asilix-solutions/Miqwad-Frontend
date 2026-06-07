import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { FileUpload, type PickedFile } from "@shared/components/ui/fileUpload";
import type { KycDocumentType, ProviderDocument } from "../types";

interface Props {
  value: ProviderDocument[];
  onChange: (documents: ProviderDocument[]) => void;
  onNext: () => void;
  onBack: () => void;
}

/**
 * Step 4 — KYC documents (optional).
 *
 * The MVP plan explicitly allows providers to skip KYC at signup
 * and complete it later from their profile, so all three uploads
 * are optional. We track only file metadata (name + size) here;
 * the actual file blobs will be sent to the backend's upload
 * endpoint once it exists.
 */
export function RegisterStepDocuments({ value, onChange, onNext, onBack }: Props) {
  const { t } = useTranslation();

  const findByType = (type: KycDocumentType) => {
    const doc = value.find((d) => d.type === type);
    if (!doc) return null;
    return { name: doc.fileName, size: doc.fileSize, uploadedAt: doc.uploadedAt };
  };

  const handlePick =
    (type: KycDocumentType) =>
    (picked: PickedFile): void => {
      onChange([
        ...value.filter((d) => d.type !== type),
        {
          type,
          fileName: picked.name,
          fileSize: picked.size,
          url: `mock://docs/${picked.name}`,
          uploadedAt: new Date().toISOString(),
        },
      ]);
    };

  const handleRemove = (type: KycDocumentType): void => {
    onChange(value.filter((d) => d.type !== type));
  };

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h3 className="font-display text-base font-semibold text-ink-900">
          {t("providers.kyc.title")}
        </h3>
        <p className="text-sm text-ink-500">{t("providers.kyc.subtitle")}</p>
      </header>

      <div className="space-y-3">
        {(["commercial", "tax", "identity"] as KycDocumentType[]).map((type) => (
          <FileUpload
            key={type}
            label={t(`providers.kyc.${type}` as const)}
            picked={findByType(type)}
            onPick={handlePick(type)}
            onRemove={() => handleRemove(type)}
          />
        ))}
      </div>

      <div className="flex flex-col-reverse gap-2 pt-4 border-t border-ink-100 sm:flex-row sm:justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          {t("common.back")}
        </Button>
        <Button type="button" onClick={onNext}>
          {t("common.next")}
        </Button>
      </div>
    </div>
  );
}
