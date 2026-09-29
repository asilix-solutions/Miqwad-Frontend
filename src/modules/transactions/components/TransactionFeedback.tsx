import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { transactionErrorKey, transactionValidationMessages } from "../lib/transactionPresentation";
export function TransactionFeedback({ error, retry }: { error: unknown; retry?: () => void }) {
  const { t } = useTranslation();
  return (
    <div
      role="alert"
      className="space-y-2 rounded-md border border-[var(--color-divider)] p-4 text-sm"
    >
      <p>{t(transactionErrorKey(error))}</p>
      {transactionValidationMessages(error).map((message) => (
        <p key={message} className="break-words">
          {message}
        </p>
      ))}
      {retry && (
        <Button variant="outline" size="sm" onClick={retry}>
          {t("common.retry")}
        </Button>
      )}
    </div>
  );
}
