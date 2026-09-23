/**
 * @file InvoiceQrCode.tsx
 * @description Encode the exact backend payload locally; never use it as a URL.
 */
import { Component, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { QRCodeSVG } from "qrcode.react";

class QrBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function InvoiceQrCode({ payload }: { payload: string }) {
  const { t } = useTranslation();
  const fallback = (
    <p className="text-sm text-[var(--color-muted)]">{t("invoices.qrUnavailable")}</p>
  );
  return (
    <section className="min-w-0 space-y-3">
      <h2 className="font-semibold">{t("invoices.qrTitle")}</h2>
      {payload ? (
        <QrBoundary key={payload} fallback={fallback}>
          <QRCodeSVG
            value={payload}
            size={200}
            marginSize={4}
            level="M"
            title={t("invoices.qrTitle")}
            role="img"
            className="h-auto max-w-full"
          />
        </QrBoundary>
      ) : (
        fallback
      )}
    </section>
  );
}
