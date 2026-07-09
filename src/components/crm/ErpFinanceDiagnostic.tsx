import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  runErpQa,
  runErpFinanceTest,
  runProformaE2eIsolated,
  runProformaTriggerRecomputeTest,
} from "@/lib/erp-qa.functions";
import {
  assertLatestProformaPdf,
  type PdfE2eReport,
} from "@/lib/proforma-pdf-e2e";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, XCircle, AlertTriangle, Loader2, Play, FlaskConical, FileCheck2, Calculator } from "lucide-react";

type Check = {
  key: string;
  category: string;
  label: string;
  status: "pass" | "fail" | "warn";
  message: string;
  why?: string;
  fix?: string;
  details?: any;
};

type QaReport = {
  startedAt: string;
  finishedAt: string;
  passed: number;
  failed: number;
  warned: number;
  total: number;
  results: Check[];
};

type FinanceStep = {
  key: string;
  label: string;
  status: "pass" | "fail" | "warn";
  message: string;
  details?: any;
};

type FinanceReport = {
  startedAt: string;
  finishedAt: string;
  passed: number;
  failed: number;
  warned: number;
  total: number;
  steps: FinanceStep[];
};

function StatusBadge({ status }: { status: "pass" | "fail" | "warn" }) {
  if (status === "pass")
    return (
      <Badge className="bg-emerald-600 hover:bg-emerald-600">
        <CheckCircle2 className="mr-1 h-3 w-3" /> PASS
      </Badge>
    );
  if (status === "warn")
    return (
      <Badge className="bg-amber-500 hover:bg-amber-500">
        <AlertTriangle className="mr-1 h-3 w-3" /> WARNING
      </Badge>
    );
  return (
    <Badge variant="destructive">
      <XCircle className="mr-1 h-3 w-3" /> FAIL
    </Badge>
  );
}

type IsoStep = {
  key: string;
  label: string;
  status: "pass" | "fail" | "warn";
  message: string;
  details?: any;
};
type IsoReport = {
  startedAt: string;
  finishedAt: string;
  runId: string;
  marker: string;
  passed: number;
  failed: number;
  warned: number;
  total: number;
  steps: IsoStep[];
};

export function ErpFinanceDiagnostic() {
  const runQa = useServerFn(runErpQa);
  const runTest = useServerFn(runErpFinanceTest);
  const runIso = useServerFn(runProformaE2eIsolated);
  const runTrig = useServerFn(runProformaTriggerRecomputeTest);
  const [qa, setQa] = useState<QaReport | null>(null);
  const [test, setTest] = useState<FinanceReport | null>(null);
  const [pdfReport, setPdfReport] = useState<PdfE2eReport | null>(null);
  const [iso, setIso] = useState<IsoReport | null>(null);
  const [trig, setTrig] = useState<
    (IsoReport & { expected: Record<string, number> }) | null
  >(null);
  const [qaLoading, setQaLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [isoLoading, setIsoLoading] = useState(false);
  const [trigLoading, setTrigLoading] = useState(false);

  async function onRunQa() {
    setQaLoading(true);
    try {
      const r = (await runQa()) as QaReport;
      setQa(r);
      toast.success(`Diagnostic complete: ${r.passed} pass · ${r.warned} warn · ${r.failed} fail`);
    } catch (e) {
      toast.error(`Diagnostic failed: ${(e as Error).message}`);
    } finally {
      setQaLoading(false);
    }
  }

  async function onRunTest() {
    setTestLoading(true);
    try {
      const r = (await runTest()) as FinanceReport;
      setTest(r);
      const failed = r.failed;
      if (failed > 0) toast.error(`Finance test: ${failed} failing steps`);
      else toast.success("Finance test passed end-to-end");
    } catch (e) {
      toast.error(`Finance test failed: ${(e as Error).message}`);
    } finally {
      setTestLoading(false);
    }
  }

  async function onRunPdfE2e() {
    setPdfLoading(true);
    try {
      const r = await assertLatestProformaPdf();
      setPdfReport(r);
      if (r.pass) {
        toast.success(
          `Proforma PDF e2e passed for ${r.proformaNumber ?? r.proformaId.slice(0, 8)}`,
        );
      } else {
        const failed = r.assertions.filter((a) => !a.found).length;
        toast.error(`Proforma PDF e2e: ${failed} assertion(s) failed`);
      }
    } catch (e) {
      toast.error(`Proforma PDF e2e failed: ${(e as Error).message}`);
    } finally {
      setPdfLoading(false);
    }
  }

  async function onRunIsolated() {
    setIsoLoading(true);
    try {
      const r = (await runIso()) as IsoReport;
      setIso(r);
      if (r.failed > 0) toast.error(`Isolated proforma e2e: ${r.failed} failing steps`);
      else toast.success(`Isolated proforma e2e passed (run ${r.runId.slice(0, 8)})`);
    } catch (e) {
      toast.error(`Isolated proforma e2e failed: ${(e as Error).message}`);
    } finally {
      setIsoLoading(false);
    }
  }

  async function onRunTrigger() {
    setTrigLoading(true);
    try {
      const r = (await runTrig()) as IsoReport & { expected: Record<string, number> };
      setTrig(r);
      if (r.failed > 0)
        toast.error(`Trigger recompute test: ${r.failed} failing assertion(s)`);
      else toast.success("Trigger recompute test passed (vat_rate, discount_amount, grand_total)");
    } catch (e) {
      toast.error(`Trigger recompute test failed: ${(e as Error).message}`);
    } finally {
      setTrigLoading(false);
    }
  }

  const failedChecks = qa?.results.filter((r) => r.status === "fail") ?? [];
  const warnChecks = qa?.results.filter((r) => r.status === "warn") ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            ERP Finance Diagnostic
          </CardTitle>
          <CardDescription>
            Live checks against the real database: schema, relations, numbering, storage, and end-to-end
            workflow. No mock results.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={onRunQa} disabled={qaLoading}>
              {qaLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              Run diagnostic
            </Button>
            <Button variant="secondary" onClick={onRunTest} disabled={testLoading}>
              {testLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FlaskConical className="mr-2 h-4 w-4" />
              )}
              Run ERP Finance Test
            </Button>
            <Button variant="outline" onClick={onRunPdfE2e} disabled={pdfLoading}>
              {pdfLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileCheck2 className="mr-2 h-4 w-4" />
              )}
              Run Proforma PDF e2e
            </Button>
            <Button variant="outline" onClick={onRunIsolated} disabled={isoLoading}>
              {isoLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FlaskConical className="mr-2 h-4 w-4" />
              )}
              Run Isolated Proforma e2e
            </Button>
          </div>

          {qa && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="text-emerald-600 font-medium">{qa.passed} PASS</span>
                <span className="text-amber-500 font-medium">{qa.warned} WARN</span>
                <span className="text-red-600 font-medium">{qa.failed} FAIL</span>
                <span className="text-muted-foreground">
                  · finished {new Date(qa.finishedAt).toLocaleTimeString()}
                </span>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                {qa.results.map((r) => (
                  <div
                    key={r.key}
                    className="rounded-md border p-3 space-y-1"
                    data-status={r.status}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium text-sm">{r.label}</div>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="text-xs text-muted-foreground break-words">{r.message}</div>
                    {r.status !== "pass" && (r.why || r.fix) && (
                      <div className="mt-2 text-xs space-y-1 border-t pt-2">
                        {r.why && (
                          <div>
                            <span className="font-medium">Why: </span>
                            {r.why}
                          </div>
                        )}
                        {r.fix && (
                          <div>
                            <span className="font-medium">Fix: </span>
                            {r.fix}
                          </div>
                        )}
                      </div>
                    )}
                    {r.details && r.status !== "pass" && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-xs text-muted-foreground">
                          Details
                        </summary>
                        <pre className="mt-1 overflow-x-auto rounded bg-muted p-2 text-xs">
                          {JSON.stringify(r.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {test && (
        <Card>
          <CardHeader>
            <CardTitle>End-to-end Finance Test Steps</CardTitle>
            <CardDescription>
              Al Noor Construction LLC · draft quotation · 3 line items · totals · edit · PDF · file link ·
              activity log · cleanup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="text-emerald-600 font-medium">{test.passed} PASS</span>
              <span className="text-amber-500 font-medium">{test.warned} WARN</span>
              <span className="text-red-600 font-medium">{test.failed} FAIL</span>
            </div>
            <ol className="space-y-2">
              {test.steps.map((s, i) => (
                <li key={s.key} className="flex items-start gap-3 rounded-md border p-3">
                  <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-muted text-center text-xs leading-5">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium text-sm">{s.label}</div>
                      <StatusBadge status={s.status} />
                    </div>
                    <div className="text-xs text-muted-foreground">{s.message}</div>
                    {s.details && (
                      <pre className="mt-1 overflow-x-auto rounded bg-muted p-2 text-xs">
                        {JSON.stringify(s.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {pdfReport && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck2 className="h-5 w-5" />
              Proforma PDF e2e — {pdfReport.proformaNumber ?? pdfReport.proformaId.slice(0, 8)}
              <StatusBadge status={pdfReport.pass ? "pass" : "fail"} />
            </CardTitle>
            <CardDescription>
              Real PDF generated ({pdfReport.pageCount} page{pdfReport.pageCount === 1 ? "" : "s"},{" "}
              {(pdfReport.fileSize / 1024).toFixed(1)} KB) and text-extracted with pdfjs. Asserts
              that VAT rate%, VAT amount, grand total, and the payment status stamp are all
              present.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 text-xs md:grid-cols-4">
              <div className="rounded border p-2">
                <div className="text-muted-foreground">VAT rate</div>
                <div className="font-medium">{pdfReport.vatRate}%</div>
              </div>
              <div className="rounded border p-2">
                <div className="text-muted-foreground">VAT amount</div>
                <div className="font-medium">
                  {pdfReport.currency} {pdfReport.vatAmount.toFixed(2)}
                </div>
              </div>
              <div className="rounded border p-2">
                <div className="text-muted-foreground">Grand total</div>
                <div className="font-medium">
                  {pdfReport.currency} {pdfReport.grandTotal.toFixed(2)}
                </div>
              </div>
              <div className="rounded border p-2">
                <div className="text-muted-foreground">Payment status</div>
                <div className="font-medium">{pdfReport.paymentStatus}</div>
              </div>
            </div>
            <ul className="space-y-1">
              {pdfReport.assertions.map((a) => (
                <li
                  key={a.key}
                  className="flex items-center justify-between gap-3 rounded-md border p-2 text-sm"
                >
                  <div>
                    <div className="font-medium">{a.label}</div>
                    <div className="text-xs text-muted-foreground">
                      Expected in PDF: <code>{a.expected}</code>
                    </div>
                  </div>
                  <StatusBadge status={a.found ? "pass" : "fail"} />
                </li>
              ))}
            </ul>
            <details>
              <summary className="cursor-pointer text-xs text-muted-foreground">
                PDF text preview
              </summary>
              <pre className="mt-1 max-h-48 overflow-auto rounded bg-muted p-2 text-xs whitespace-pre-wrap">
                {pdfReport.textPreview}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}

      {iso && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Isolated Proforma e2e
              <StatusBadge status={iso.failed === 0 ? "pass" : "fail"} />
            </CardTitle>
            <CardDescription>
              Run <code>{iso.runId.slice(0, 8)}</code> · marker <code>{iso.marker}</code> ·
              creates unique customer + proforma + items, always cleans up, then verifies zero
              orphaned <code>proforma_invoice_items</code> remain.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="text-emerald-600 font-medium">{iso.passed} PASS</span>
              <span className="text-amber-500 font-medium">{iso.warned} WARN</span>
              <span className="text-red-600 font-medium">{iso.failed} FAIL</span>
            </div>
            <ol className="space-y-2">
              {iso.steps.map((s, i) => (
                <li key={s.key} className="flex items-start gap-3 rounded-md border p-3">
                  <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-muted text-center text-xs leading-5">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium text-sm">{s.label}</div>
                      <StatusBadge status={s.status} />
                    </div>
                    <div className="text-xs text-muted-foreground break-words">{s.message}</div>
                    {s.details && (
                      <pre className="mt-1 overflow-x-auto rounded bg-muted p-2 text-xs">
                        {JSON.stringify(s.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}




      {qa && (failedChecks.length > 0 || warnChecks.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Report — next fixes</CardTitle>
            <CardDescription>Prioritised list of what to repair in Step 2.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {failedChecks.length > 0 && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Broken modules ({failedChecks.length})</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                    {failedChecks.map((c) => (
                      <li key={c.key}>
                        <span className="font-medium">{c.label}</span>
                        {c.fix && <span className="text-muted-foreground"> — {c.fix}</span>}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            {warnChecks.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warnings ({warnChecks.length})</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                    {warnChecks.map((c) => (
                      <li key={c.key}>
                        <span className="font-medium">{c.label}</span> — {c.message}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            <div className="rounded-md border p-3 text-sm space-y-1">
              <div className="font-medium">Suggested implementation order</div>
              <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
                <li>Fix any FAIL rows above (missing tables / RPCs / bucket).</li>
                <li>Wire the finance server functions into the Quotations / Invoices UI (create, edit, convert).</li>
                <li>Build the PDF renderer + upload to <code>documents</code> bucket, link into <code>document_files</code>.</li>
                <li>Enable the Import Center UI (drag-drop, column mapping, dry-run).</li>
                <li>Wire email dispatch via existing Resend + record to <code>email_log</code>.</li>
                <li>Integrate CRM: customer/supplier detail pages surface related finance documents.</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
