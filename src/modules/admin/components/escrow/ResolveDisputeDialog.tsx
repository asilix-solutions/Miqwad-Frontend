import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useResolveDisputeMutation } from "@modules/admin/hooks/useAdminQueries";
import { resolveDisputeSchema, type ResolveDisputeFormValues } from "@modules/admin/schemas/admin.schemas";
import { formatCurrency } from "@shared/lib/formatCurrency";

interface ResolveDisputeDialogProps {
  disputeId: string;
  orderId: string;
  amount: number;
  openedByName: string;
  providerName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResolveDisputeDialog({
  disputeId,
  orderId,
  amount,
  providerName = "المزود",
  open,
  onOpenChange,
}: ResolveDisputeDialogProps) {
  const { t, i18n } = useTranslation();
  const resolveDispute = useResolveDisputeMutation();

  const form = useForm<ResolveDisputeFormValues>({
    resolver: zodResolver(resolveDisputeSchema),
    defaultValues: {
      decision: "release_to_provider",
      note: "",
    },
  });

  const decision = useWatch({
    control: form.control,
    name: "decision",
  });

  const partialAmount = useWatch({
    control: form.control,
    name: "partialAmount",
  });

  const onSubmit = (data: ResolveDisputeFormValues) => {
    resolveDispute.mutate(
      { id: disputeId, payload: data },
      {
        onSuccess: () => {
          toast.success(t("superAdmin.escrow.resolve.success"));
          onOpenChange(false);
          form.reset();
        },
        onError: () => {
          toast.error(t("common.errorTitle"));
        },
      }
    );
  };

  const getLiveSummary = () => {
    switch (decision) {
      case "release_to_provider":
        return t("superAdmin.escrow.resolve.summary.release", {
          amount: formatCurrency(amount, i18n.language),
          provider: providerName,
        });
      case "refund_to_customer":
        return t("superAdmin.escrow.resolve.summary.refund", {
          amount: formatCurrency(amount, i18n.language),
        });
      case "partial_refund":
        const partial = partialAmount || 0;
        return t("superAdmin.escrow.resolve.summary.partial", {
          partialAmount: formatCurrency(partial, i18n.language),
          remainingAmount: formatCurrency(Math.max(0, amount - partial), i18n.language),
          provider: providerName,
        });
      default:
        return "";
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && resolveDispute.isPending) return;
        if (!v) form.reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("superAdmin.escrow.resolve.title", { orderId })}</DialogTitle>
          <DialogDescription>
            {t("superAdmin.escrow.resolve.description")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
            <FormField
              control={form.control}
              name="decision"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>{t("superAdmin.escrow.resolve.decisionLabels")}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-x-reverse space-y-0">
                        <FormControl>
                          <RadioGroupItem value="release_to_provider" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          {t("superAdmin.escrow.resolve.releaseToProvider")}
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-x-reverse space-y-0">
                        <FormControl>
                          <RadioGroupItem value="refund_to_customer" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          {t("superAdmin.escrow.resolve.refundToCustomer")}
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-x-reverse space-y-0">
                        <FormControl>
                          <RadioGroupItem value="partial_refund" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          {t("superAdmin.escrow.resolve.partialRefund")}
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {decision === "partial_refund" && (
              <FormField
                control={form.control}
                name="partialAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("superAdmin.escrow.resolve.partialAmountLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min={0.01}
                        max={amount}
                        placeholder={t("superAdmin.escrow.resolve.partialAmountPlaceholder", { max: formatCurrency(amount, i18n.language) })}
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("superAdmin.escrow.resolve.noteLabel")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("superAdmin.escrow.resolve.notePlaceholder")}
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-[var(--color-surface-2)] p-4 rounded-md border border-[var(--color-border)]">
              <p className="text-[14px] font-medium text-[var(--color-ink-body)] leading-relaxed">
                {getLiveSummary()}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={resolveDispute.isPending}
              >
                {t("superAdmin.escrow.resolve.cancel")}
              </Button>
              <Button
                type="submit"
                className="bg-[var(--color-brand-orange)] text-white hover:bg-[var(--color-brand-orange-dark)]"
                disabled={resolveDispute.isPending}
              >
                {resolveDispute.isPending
                  ? t("common.loading")
                  : t("superAdmin.escrow.resolve.confirm")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
