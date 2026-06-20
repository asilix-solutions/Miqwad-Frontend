import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateProductMutation, useUpdateProductMutation } from "../hooks/useDealerMutations";
import { productSchema, type ProductFormValues } from "../schemas/productSchema";
import type { Product } from "../types";
import { useToast } from "@shared/components/ui/toastContext";

interface CategoryOption {
  id: string;
  labelAr: string;
  labelEn: string;
}

interface Props {
  mode: "create" | "edit";
  product?: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryOption[];
}

export function ProductFormDialog({ mode, product, open, onOpenChange, categories }: Props) {
  const { t, i18n } = useTranslation();
  const toast = useToast();

  const createMutation = useCreateProductMutation();
  const updateMutation = useUpdateProductMutation();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      nameAr: "",
      nameEn: "",
      sku: "",
      categoryId: "",
      price: 0,
      stockQty: 0,
      condition: "new",
      status: "draft",
      descriptionAr: "",
      descriptionEn: "",
      images: [],
    },
  });

  const categoryId = watch("categoryId");
  const status = watch("status");

  useEffect(() => {
    if (open) {
      if (mode === "edit" && product) {
        reset({
          nameAr: product.nameAr,
          nameEn: product.nameEn,
          sku: product.sku,
          categoryId: product.categoryId,
          price: product.price,
          stockQty: product.stockQty,
          condition: product.condition,
          status: product.status,
          descriptionAr: product.descriptionAr || "",
          descriptionEn: product.descriptionEn || "",
          images: product.images || [],
        });
      } else {
        reset({
          nameAr: "",
          nameEn: "",
          sku: "",
          categoryId: "",
          price: 0,
          stockQty: 0,
          condition: "new",
          status: "active",
          descriptionAr: "",
          descriptionEn: "",
          images: [],
        });
      }
    }
  }, [open, mode, product, reset]);

  const onSubmit = async (data: ProductFormValues) => {
    try {
      if (mode === "create") {
        await createMutation.mutateAsync(data);
        toast.success(t("common.saved", { defaultValue: "Saved successfully" }));
      } else if (mode === "edit" && product) {
        await updateMutation.mutateAsync({
          id: product.id,
          payload: data,
        });
        toast.success(t("common.saved", { defaultValue: "Saved successfully" }));
      }
      onOpenChange(false);
    } catch {
      toast.error(t("common.saveFailed"));
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => !isPending && onOpenChange(val)}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" dir={i18n.dir()}>
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? t("dealer.products.form.createTitle") : t("dealer.products.form.editTitle")}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? t("dealer.products.form.createSubtitle")
              : t("dealer.products.form.editSubtitle")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nameAr">
                {t("dealer.products.form.nameAr")} <span className="text-danger-500">*</span>
              </Label>
              <Input id="nameAr" {...register("nameAr")} disabled={isPending} />
              {errors.nameAr && (
                <p className="text-sm text-danger-500">{t(errors.nameAr.message as string)}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nameEn">
                {t("dealer.products.form.nameEn")} <span className="text-danger-500">*</span>
              </Label>
              <Input id="nameEn" dir="ltr" className="text-left" {...register("nameEn")} disabled={isPending} />
              {errors.nameEn && (
                <p className="text-sm text-danger-500">{t(errors.nameEn.message as string)}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">
                {t("dealer.products.form.sku")} <span className="text-danger-500">*</span>
              </Label>
              <Input id="sku" dir="ltr" className="text-left" {...register("sku")} disabled={isPending} />
              {errors.sku && (
                <p className="text-sm text-danger-500">{t(errors.sku.message as string)}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">
                {t("dealer.products.form.category")} <span className="text-danger-500">*</span>
              </Label>
              <Select
                disabled={isPending}
                value={categoryId ?? ""}
                onValueChange={(val) => setValue("categoryId", val)}
              >
                <SelectTrigger id="categoryId">
                  <SelectValue placeholder={t("common.select")} />
                </SelectTrigger>
                <SelectContent dir={i18n.dir()}>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {i18n.language === "ar" ? c.labelAr : c.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && (
                <p className="text-sm text-danger-500">{t(errors.categoryId.message as string)}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">
                {t("dealer.products.form.price")} (SAR) <span className="text-danger-500">*</span>
              </Label>
              <Input 
                id="price" 
                type="number" 
                step="0.01" 
                dir="ltr" 
                className="text-left" 
                {...register("price", { valueAsNumber: true })} 
                disabled={isPending} 
              />
              {errors.price && (
                <p className="text-sm text-danger-500">{t(errors.price.message as string)}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stockQty">
                {t("dealer.products.form.stock")} <span className="text-danger-500">*</span>
              </Label>
              <Input 
                id="stockQty" 
                type="number" 
                dir="ltr" 
                className="text-left" 
                {...register("stockQty", { valueAsNumber: true })} 
                disabled={isPending} 
              />
              {errors.stockQty && (
                <p className="text-sm text-danger-500">{t(errors.stockQty.message as string)}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">
                {t("dealer.products.form.status")} <span className="text-danger-500">*</span>
              </Label>
              <Select
                disabled={isPending}
                value={status ?? ""}
                onValueChange={(val: any) => setValue("status", val)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder={t("common.select")} />
                </SelectTrigger>
                <SelectContent dir={i18n.dir()}>
                  <SelectItem value="active">{t("dealer.status.product.active")}</SelectItem>
                  <SelectItem value="draft">{t("dealer.status.product.draft")}</SelectItem>
                  <SelectItem value="out_of_stock">{t("dealer.status.product.out_of_stock")}</SelectItem>
                  <SelectItem value="archived">{t("dealer.status.product.archived")}</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-danger-500">{t(errors.status.message as string)}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descriptionAr">
              {t("dealer.products.form.descriptionAr")} ({t("common.optional")})
            </Label>
            <Textarea id="descriptionAr" {...register("descriptionAr")} disabled={isPending} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descriptionEn">
              {t("dealer.products.form.descriptionEn")} ({t("common.optional")})
            </Label>
            <Textarea id="descriptionEn" dir="ltr" className="text-left" {...register("descriptionEn")} disabled={isPending} />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t("common.loading") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
