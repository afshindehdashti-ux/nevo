import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  Upload,
  CheckCircle2,
  AlertCircle,
  ClipboardPaste,
} from "lucide-react";
import { IMPORT_SCHEMAS, autoMap } from "@/lib/import-schemas";
import { runImportJob } from "@/lib/import-wizard.functions";

type Row = Record<string, string>;
type CellIssue = { row: number; column: string; message: string; severity: "error" | "warning" };

const SAMPLE = [
  "Quotation #\tCustomer\tIssue date\tCurrency\tVAT %\tItem code\tItem description\tQuantity\tUnit price\tDiscount %",
  "Q-2026-001\tAcme Trading\t2026-07-01\tUSD\t5\tSKU-100\tSteel rebar 12mm\t100\t45.00\t0",
  "Q-2026-001\tAcme Trading\t2026-07-01\tUSD\t5\tSKU-200\tPortland cement 50kg\t250\t9.50\t2.5",
  "Q-2026-002\tGlobal Builders\t2026-07-02\tEUR\t20\tSKU-100\tSteel rebar 12mm\t500\t42.00\t5",
].join("\n");

// Split a single row honoring quoted CSV cells and tab/comma auto-detect.
function detectDelimiter(text: string): "\t" | "," {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const tabs = (firstLine.match(/\t/g) ?? []).length;
  const commas = (firstLine.match(/,/g) ?? []).length;
  return tabs >= commas && tabs > 0 ? "\t" : ",";
}

function splitLine(line: string, delim: "\t" | ","): string[] {
  const cells: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delim) {
      cells.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  cells.push(cur);
  return cells.map((c) => c.trim());
}

function parsePaste(text: string): { headers: string[]; rows: Row[] } {
  const clean = text.replace(/\uFEFF/g, "").trimEnd();
  if (!clean) return { headers: [], rows: [] };
  const delim = detectDelimiter(clean);
  const lines = clean.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (!lines.length) return { headers: [], rows: [] };
  const headers = splitLine(lines[0], delim);
  const rows: Row[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i], delim);
    const r: Row = {};
    headers.forEach((h, idx) => {
      r[h] = cells[idx] ?? "";
    });
    rows.push(r);
  }
  return { headers, rows };
}

export function PasteImporter({
  open,
  onOpenChange,
  importType = "quotations",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  importType?: string;
}) {
  const qc = useQueryClient();
  const runImport = useServerFn(runImportJob);
  const schema = IMPORT_SCHEMAS[importType];

  const [pasted, setPasted] = useState("");
  const [done, setDone] = useState<{ success: number; failed: number; skipped: number; total: number } | null>(null);

  const { headers, rows } = useMemo(() => parsePaste(pasted), [pasted]);
  const mapping = useMemo(
    () => (headers.length ? autoMap(headers, schema.fields) : {}),
    [headers, schema],
  );

  const unmappedRequired = useMemo(
    () => schema.fields.filter((f) => f.required && !mapping[f.key]),
    [mapping, schema],
  );

  const cellIssues = useMemo<CellIssue[]>(() => {
    if (!rows.length) return [];
    const issues: CellIssue[] = [];
    rows.forEach((r, i) => {
      const rowNo = i + 2; // account for header row
      for (const f of schema.fields) {
        const src = mapping[f.key];
        if (!src) continue;
        const raw = (r[src] ?? "").toString().trim();
        if (!raw) {
          if (f.required) {
            issues.push({ row: rowNo, column: f.label, message: "Required value is empty", severity: "error" });
          }
          continue;
        }
        if (f.type === "number" && Number.isNaN(Number(raw.replace(/,/g, "")))) {
          issues.push({ row: rowNo, column: f.label, message: `Not a number: "${raw}"`, severity: "error" });
        }
        if (f.type === "enum" && f.enumValues && !f.enumValues.includes(raw.toLowerCase())) {
          issues.push({
            row: rowNo,
            column: f.label,
            message: `"${raw}" not in [${f.enumValues.join(", ")}]`,
            severity: "error",
          });
        }
        if (f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
          issues.push({ row: rowNo, column: f.label, message: `Invalid email: "${raw}"`, severity: "warning" });
        }
      }
    });
    return issues;
  }, [rows, mapping, schema]);

  const errors = cellIssues.filter((i) => i.severity === "error");
  const warnings = cellIssues.filter((i) => i.severity === "warning");
  const groupCount = useMemo(() => {
    if (!schema.groupBy) return null;
    const src = mapping[schema.groupBy];
    if (!src) return null;
    const seen = new Set<string>();
    for (const r of rows) {
      const v = (r[src] ?? "").toString().trim();
      if (v) seen.add(v);
    }
    return seen.size;
  }, [rows, mapping, schema]);

  const canSubmit = rows.length > 0 && unmappedRequired.length === 0 && errors.length === 0;

  const runMut = useMutation({
    mutationFn: async () =>
      runImport({
        data: {
          import_type: importType,
          file_name: `paste-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.tsv`,
          mapping,
          rows,
          mode: "create",
        },
      }),
    onSuccess: (res) => {
      setDone(res);
      qc.invalidateQueries({ queryKey: ["import-jobs"] });
      if (res.failed === 0) toast.success(`Imported ${res.success} of ${res.total} rows.`);
      else toast.warning(`${res.success} imported, ${res.failed} failed. See job details.`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Import failed"),
  });

  const reset = () => {
    setPasted("");
    setDone(null);
  };

  const previewRows = rows.slice(0, 8);
  const mappedFields = schema.fields.filter((f) => mapping[f.key]);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardPaste className="h-5 w-5" /> Paste table — {schema.label}
          </DialogTitle>
          <DialogDescription>
            Copy rows from Excel, Google Sheets, or Numbers and paste below. First row must be column headers.
            Validation runs live; fix errors before importing.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {done.failed === 0 ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              ) : (
                <AlertCircle className="h-6 w-6 text-amber-600" />
              )}
              <div>
                <p className="font-medium">Import finished</p>
                <p className="text-sm text-muted-foreground">
                  {done.success} imported · {done.failed} failed · {done.skipped} skipped · {done.total} total
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={reset}>
                Paste another table
              </Button>
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="paste-area">Paste tab or comma-separated rows</Label>
                <Button type="button" size="sm" variant="ghost" onClick={() => setPasted(SAMPLE)}>
                  Load sample
                </Button>
              </div>
              <Textarea
                id="paste-area"
                value={pasted}
                onChange={(e) => setPasted(e.target.value)}
                placeholder="Quotation #\tCustomer\tIssue date\t..."
                className="min-h-[160px] font-mono text-xs"
                spellCheck={false}
              />
              <p className="text-[11px] text-muted-foreground">
                {rows.length} rows · {headers.length} columns · delimiter auto-detected
              </p>
            </div>

            {headers.length > 0 && (
              <div className="rounded-md border border-border bg-muted/30 p-3 text-xs">
                <p className="font-medium mb-1">Column mapping (auto-detected):</p>
                <div className="flex flex-wrap gap-1">
                  {schema.fields.map((f) => {
                    const src = mapping[f.key];
                    return (
                      <Badge key={f.key} variant={src ? "default" : f.required ? "destructive" : "outline"}>
                        {f.label}
                        {f.required ? " *" : ""}
                        {src ? ` ← ${src}` : ""}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {unmappedRequired.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Missing required columns</AlertTitle>
                <AlertDescription>
                  Add these headers to your paste: {unmappedRequired.map((f) => f.label).join(", ")}
                </AlertDescription>
              </Alert>
            )}

            {cellIssues.length > 0 && (
              <div className="rounded-md border border-border">
                <div className="flex items-center justify-between px-3 py-2 bg-muted/40 text-xs">
                  <span className="font-medium">
                    {errors.length} error{errors.length === 1 ? "" : "s"}
                    {warnings.length > 0 && ` · ${warnings.length} warning${warnings.length === 1 ? "" : "s"}`}
                  </span>
                  <span className="text-muted-foreground">Rows {errors.length > 0 ? "with errors block import" : "with warnings can still import"}</span>
                </div>
                <div className="max-h-[200px] overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/20 uppercase text-muted-foreground">
                      <tr>
                        <th className="text-left px-3 py-1.5 w-16">Row</th>
                        <th className="text-left px-3 py-1.5 w-40">Column</th>
                        <th className="text-left px-3 py-1.5">Issue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cellIssues.slice(0, 200).map((issue, idx) => (
                        <tr
                          key={idx}
                          className={`border-t border-border ${
                            issue.severity === "error"
                              ? "bg-rose-500/5 text-rose-700 dark:text-rose-300"
                              : "bg-amber-500/5 text-amber-700 dark:text-amber-300"
                          }`}
                        >
                          <td className="px-3 py-1.5 font-mono">{issue.row}</td>
                          <td className="px-3 py-1.5">{issue.column}</td>
                          <td className="px-3 py-1.5">{issue.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {cellIssues.length > 200 && (
                  <div className="px-3 py-1.5 text-[11px] text-muted-foreground border-t border-border">
                    Showing first 200 of {cellIssues.length} issues.
                  </div>
                )}
              </div>
            )}

            {rows.length > 0 && unmappedRequired.length === 0 && (
              <div className="rounded-md border border-border">
                <div className="px-3 py-2 bg-muted/40 text-xs font-medium">
                  Preview — first {previewRows.length} of {rows.length} rows
                  {schema.groupBy && groupCount !== null && (
                    <>
                      {" · "}
                      grouped into <span className="font-semibold">{groupCount}</span> parent record
                      {groupCount === 1 ? "" : "s"}
                    </>
                  )}
                </div>
                <div className="max-h-[220px] overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/20 uppercase text-muted-foreground">
                      <tr>
                        <th className="text-left px-2 py-1.5 w-10">#</th>
                        {mappedFields.map((f) => (
                          <th key={f.key} className="text-left px-2 py-1.5">
                            {f.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((r, i) => (
                        <tr key={i} className="border-t border-border">
                          <td className="px-2 py-1.5 text-muted-foreground font-mono">{i + 2}</td>
                          {mappedFields.map((f) => (
                            <td key={f.key} className="px-2 py-1.5">
                              {String(r[mapping[f.key]] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <DialogFooter className="flex justify-between">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => runMut.mutate()}
                disabled={!canSubmit || runMut.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {runMut.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Import {rows.length} row{rows.length === 1 ? "" : "s"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
