/**
 * @file TowTruckPlateDisplay.tsx
 * @description Renders a vehicle license plate with strict bidirectional isolation (<bdi>)
 * and an authentic, clean plate frame styling.
 */
import { useTranslation } from "react-i18next";

interface Props {
  plate: string | null | undefined;
  className?: string;
}

export function TowTruckPlateDisplay({ plate, className = "" }: Props) {
  const { t } = useTranslation();

  if (!plate || !plate.trim()) {
    return (
      <span className={`text-xs text-ink-400 italic ${className}`}>
        {t("towTruck.plateMissing")}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded border border-ink-200 bg-ink-50/70 text-ink-800 font-mono text-xs tracking-wider font-semibold shadow-2xs select-all ${className}`}
      title={plate}
    >
      <bdi>{plate.trim()}</bdi>
    </span>
  );
}
