import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { emailQuotation } from "@/lib/quotations.functions";
import {
  buildQuotationPdf,
  loadSellerSettings,
  validateQuotationForPdf,
} from "@/lib/quotation-pdf";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation: any;
  items: any[];
  onSent?: () => void;
};

export function QuotationEmailDialog({ open, onOpenChange, quotation, items, onSent }: Props) {
  const sendFn = useServerFn(emailQuotation);
  const defaultTo = quotation?.customers?.email ?? "";
  const number = quotation?.quotation_number ?? "quotation";

  const [to, setTo] = useState(defaultTo);
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState(`Quotation ${number} from NEVO Industrial`);
  const [message, setMessage] = useState(
    `Dear ${quotation?.customers?.company_name || quotation?.customers?.name || "customer"},\n\nPlease find attached quotation ${number}. Let us know if you have any questions.\n\nBest regards,\nNEVO Industrial`,
  );

  useEffect(() => {
    if (open) {
      setTo(quotation?.customers?.email ?? "");
      setSubject(`Quotation ${number} from NEVO Industrial`);
      setMessage(
        `Dear ${quotation?.customers?.company_name || quotation?.customers?.name || "customer"},\n\nPlease find attached quotation ${number}. Let us know if you have any questions.\n\nBest regards,\nNEVO Industrial`,
      );
      setCc("");
    }
  }, [open, quotation, number]);

  const send = useMutation({
    mutationFn: async () => {
      const errs = validateQuotationForPdf(quotation, items);
      if (errs.length) throw new Error(errs.join(" · "));
      const { assertDocumentReadyForPdf } = await import(
        "@/lib/document-pdf-validation.functions"
      );
      await assertDocumentReadyForPdf({
        data: { kind: "quotation", id: quotation.id },
      });
      const seller = await loadSellerSettings();
      const { base64, filename } = buildQuotationPdf(quotation, items, seller);
      return sendFn({
        data: {
          id: quotation.id,
          to,
          cc: cc
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          subject,
          message,
          pdf_base64: base64,
          pdf_filename: filename,
        },
      });
    },
    onSuccess: () => {
      toast.success("Quotation emailed");
      onOpenChange(false);
      onSent?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canSend = !!to && !!subject && !send.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Email quotation</DialogTitle>
          <DialogDescription>
            The PDF will be generated and attached automatically. This will mark the quotation as
            sent.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>To *</Label>
            <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="customer@company.com" />
          </div>
          <div>
            <Label>Cc (comma-separated)</Label>
            <Input value={cc} onChange={(e) => setCc(e.target.value)} />
          </div>
          <div>
            <Label>Subject *</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea rows={7} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => send.mutate()} disabled={!canSend}>
            <Send className="h-4 w-4 mr-1" />
            {send.isPending ? "Sending…" : "Send"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
