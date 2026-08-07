import { Copy, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CsvExportAuditRecord } from "@/lib/invoice-purge-audit.functions";
import type { VerifyResult } from "@/lib/purge-csv-preamble";

export interface BlockedVerification {
  filename: string;
  row: CsvExportAuditRecord;
  result: VerifyResult;
}

export interface BlockedVerificationDialogProps {
  blocked: BlockedVerification | null;
  onClose: () => void;
}

/**
 * Pure builder for the "Copy verification report" clipboard payload.
 *
 * Exposed as a named export so a snapshot test can lock the exact text —
 * including the "Expected SHA-256" and "Computed SHA-256" fields — that
 * ends up on the operator's clipboard. Any future edit to the layout that
 * would drop, rename or reorder those fields breaks the snapshot on
 * purpose: this text is what auditors paste into tickets.
 */
export function buildVerificationReport(blocked: BlockedVerification): string {
  const { result, filename, row } = blocked;
  const isMalformed = result.status === "malformed";
  const embeddedSha = "embeddedSha" in result ? result.embeddedSha : undefined;
  const embeddedTs = "embeddedExportedAt" in result ? result.embeddedExportedAt : undefined;
  const hasMarker = isMalformed ? result.hasMarker : true;
  const expected = "expected" in result ? result.expected : row.sha256;
  const computed = "computedSha" in result ? result.computedSha : undefined;
  return [
    `Verification: ${isMalformed ? "MALFORMED" : "MISMATCH"}`,
    `Selected file: ${filename}`,
    `Audit filename: ${row.filename}`,
    `Payload marker present: ${hasMarker}`,
    `Embedded SHA-256: ${embeddedSha ?? "(missing)"}`,
    `Embedded timestamp: ${embeddedTs ?? "(missing)"}`,
    `Expected SHA-256: ${expected}`,
    `Computed SHA-256: ${computed ?? "(not computed)"}`,
    isMalformed ? `Issues: ${result.issues.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Details dialog shown when the Verify & open flow refuses to open a file.
 *
 * Renders side-by-side "Expected (from audit record)" and "Computed (from
 * selected file's payload)" SHA-256 values so the operator can see WHY
 * verification failed — mismatch or malformed structure — without ever
 * opening the untrusted file.
 */
export function BlockedVerificationDialog({ blocked, onClose }: BlockedVerificationDialogProps) {
  return (
    <Dialog
      open={!!blocked}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-5 w-5" />
            Download blocked — verification failed
          </DialogTitle>
          <DialogDescription>
            The file you selected did not pass integrity verification against the recorded audit
            entry. It was not opened.
          </DialogDescription>
        </DialogHeader>
        {blocked &&
          (() => {
            const { result, filename, row } = blocked;
            const isMalformed = result.status === "malformed";
            const isMismatch = result.status === "mismatch";
            const embeddedSha = "embeddedSha" in result ? result.embeddedSha : undefined;
            const embeddedTs =
              "embeddedExportedAt" in result ? result.embeddedExportedAt : undefined;
            const hasMarker = isMalformed ? result.hasMarker : true;
            const expected = "expected" in result ? result.expected : row.sha256;
            const computed = "computedSha" in result ? result.computedSha : undefined;
            return (
              <div className="space-y-3 text-sm">
                <Alert variant="destructive">
                  <AlertTitle>
                    {isMalformed ? "CSV structure is malformed" : "SHA-256 mismatch"}
                  </AlertTitle>
                  <AlertDescription>
                    {isMalformed
                      ? result.messages.join(" · ")
                      : "The computed payload hash does not match the audit record. The file may have been modified after export."}
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-[160px_1fr] gap-y-2">
                  <span className="text-muted-foreground">Selected file</span>
                  <span className="font-mono text-xs break-all">{filename}</span>
                  <span className="text-muted-foreground">Audit filename</span>
                  <span className="font-mono text-xs break-all">{row.filename}</span>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-1">CSV structure</div>
                  <div className="rounded-md border bg-muted/40 p-2 text-xs space-y-1">
                    <div>
                      Payload marker <code className="font-mono">"--- PAYLOAD BELOW ---"</code>:{" "}
                      <span className={hasMarker ? "text-emerald-600" : "text-destructive"}>
                        {hasMarker ? "present" : "missing"}
                      </span>
                    </div>
                    <div>
                      Embedded SHA row:{" "}
                      <span className={embeddedSha ? "text-emerald-600" : "text-destructive"}>
                        {embeddedSha ? "present" : "missing"}
                      </span>
                    </div>
                    <div>
                      Embedded timestamp row:{" "}
                      <span className={embeddedTs ? "text-emerald-600" : "text-destructive"}>
                        {embeddedTs ? "present" : "missing"}
                      </span>
                    </div>
                    {isMalformed && result.issues.length > 0 && (
                      <ul className="list-disc pl-5 pt-1 text-destructive">
                        {result.messages.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground mb-1">SHA-256 comparison</div>
                  <div
                    data-testid="sha-comparison"
                    className="rounded-md border bg-muted/40 p-2 text-xs space-y-2"
                  >
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Expected (from audit record)
                      </div>
                      <div data-testid="sha-expected" className="font-mono break-all">
                        {expected}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Computed (from selected file's payload)
                      </div>
                      <div
                        data-testid="sha-computed"
                        className={`font-mono break-all ${isMismatch ? "text-destructive" : ""}`}
                      >
                        {computed ?? "— (not computed: structure invalid)"}
                      </div>
                    </div>
                    {embeddedSha && (
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          Embedded in preamble
                        </div>
                        <div
                          className={`font-mono break-all ${
                            embeddedSha !== expected ? "text-destructive" : ""
                          }`}
                        >
                          {embeddedSha}
                          {embeddedSha !== expected && (
                            <span className="ml-2 not-italic">(drift vs audit record)</span>
                          )}
                        </div>
                      </div>
                    )}
                    {embeddedTs && (
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          Embedded export timestamp
                        </div>
                        <div className="font-mono break-all">{embeddedTs}</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const text = buildVerificationReport(blocked);
                      void navigator.clipboard
                        .writeText(text)
                        .then(() => toast.success("Verification report copied"))
                        .catch((err) =>
                          toast.error("Copy failed", {
                            description: err instanceof Error ? err.message : String(err),
                          }),
                        );
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy verification report
                  </Button>
                  <Button size="sm" onClick={onClose}>
                    Close
                  </Button>
                </div>
              </div>
            );
          })()}
      </DialogContent>
    </Dialog>
  );
}
