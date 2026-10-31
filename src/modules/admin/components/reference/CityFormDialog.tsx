/**
 * @file CityFormDialog.tsx
 * @description Compatibility wrapper delegating to CreateCityDialog.
 */

import { CreateCityDialog } from "./CreateCityDialog";

interface Props {
  mode?: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CityFormDialog({ open, onOpenChange }: Props) {
  return <CreateCityDialog open={open} onOpenChange={onOpenChange} />;
}

export { CreateCityDialog };
