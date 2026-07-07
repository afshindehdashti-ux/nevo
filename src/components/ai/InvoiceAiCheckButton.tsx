import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { checkInvoiceIntegrity } from "@/lib/ai-assistant.functions";
import { toast } from "sonner";

type Finding = {
  severity: "info" | "warning" | "error";
  field: string;
  message: string;
  suggestion?: string | null;
};

export function InvoiceAiCheckButton({ invoiceId }: { invoiceId: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [findings, setFindings] = useState<Finding[] | null>(null);
  const check = useServerFn(checkInvoiceIntegrity);

  async function run() {
    setBusy(true);
    setFindings(null);
    setOpen(true);
    try {
      const res = await check({ data: { invoice_id: invoiceId } });
      setFindings(res.findings as Finding[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI check failed");
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={run}
        className="gap-1.5 border-emerald-600 text-emerald-700 hover:bg-emerald-50"
      >
        <Sparkles className="h-3.5 w-3.5" />
        AI Check
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              Invoice integrity check
            </DialogTitle>
          </DialogHeader>

          {busy ? (
            <div className="flex items-center gap-2 py-8 text-sm text-neutral-600">
              <Loader2 className="h-4 w-4 animate-spin" /> Reviewing invoice…
            </div>
          ) : findings === null ? null : findings.length === 0 ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              No issues found. The invoice fields look complete and internally consistent.
            </div>
          ) : (
            <div className="max-h-[60vh] space-y-2 overflow-auto">
              {findings.map((f, i) => {
                const Icon =
                  f.severity === "error"
                    ? AlertCircle
                    : f.severity === "warning"
                      ? AlertTriangle
                      : Info;
                const tone =
                  f.severity === "error"
                    ? "border-red-200 bg-red-50 text-red-900"
                    : f.severity === "warning"
                      ? "border-amber-200 bg-amber-50 text-amber-900"
                      : "border-sky-200 bg-sky-50 text-sky-900";
                return (
                  <div key={i} className={`rounded-md border p-3 text-sm ${tone}`}>
                    <div className="mb-1 flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <Badge variant="outline" className="uppercase">
                        {f.severity}
                      </Badge>
                      <span className="font-mono text-xs opacity-80">{f.field}</span>
                    </div>
                    <p className="leading-snug">{f.message}</p>
                    {f.suggestion ? (
                      <p className="mt-1 text-xs italic opacity-80">Suggestion: {f.suggestion}</p>
                    ) : null}
                  </div>
                );
              })}
              <p className="pt-2 text-[11px] text-neutral-500">
                AI Check is advisory only. No fields are modified automatically — review each item
                and edit the invoice manually if needed.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button onClick={run} disabled={busy} className="bg-emerald-600 hover:bg-emerald-700">
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Re-run
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
