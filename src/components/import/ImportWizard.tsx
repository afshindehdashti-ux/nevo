import { useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { IMPORT_SCHEMAS, autoMap, type ImportEntitySchema } from "@/lib/import-schemas";
import { runImportJob } from "@/lib/import-wizard.functions";

type Step = "type" | "upload" | "map" | "preview" | "done";
type Row = Record<string, string | number | boolean | null>;

export function ImportWizard({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const qc = useQueryClient();
  const runImport = useServerFn(runImportJob);

  const [step, setStep] = useState<Step>("type");
  const [importType, setImportType] = useState<string>("customers");
  const [fileName, setFileName] = useState<string>("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<"create" | "upsert" | "skip_duplicates">("create");
  const [result, setResult] = useState<{ success: number; failed: number; skipped: number; total: number } | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);

  const schema: ImportEntitySchema = IMPORT_SCHEMAS[importType];

  const reset = () => {
    setStep("type"); setImportType("customers"); setFileName(""); setHeaders([]);
    setRows([]); setMapping({}); setMode("create"); setResult(null);
    if (fileInput.current) fileInput.current.value = "";
  };

  const parseFile = async (f: File) => {
    setFileName(f.name);
    const bytes = new Uint8Array(await f.arrayBuffer());
    const wb = XLSX.read(bytes, { type: "array" });
    const first = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json<Row>(first, { defval: "", raw: false });
    if (!json.length) {
      toast.error("File contains no data rows.");
      return;
    }
    const heads = Object.keys(json[0]);
    setHeaders(heads);
    setRows(json.slice(0, 5000));
    setMapping(autoMap(heads, schema.fields));
    setStep("map");
  };

  const validationIssues = useMemo(() => {
    const missing = schema.fields.filter((f) => f.required && !mapping[f.key]);
    return missing.map((f) => `Required column "${f.label}" is not mapped.`);
  }, [mapping, schema]);

  const previewRows = rows.slice(0, 5);

  const runMut = useMutation({
    mutationFn: async () => runImport({
      data: { import_type: importType, file_name: fileName, mapping, rows, mode },
    }),
    onSuccess: (res) => {
      setResult(res);
      setStep("done");
      qc.invalidateQueries({ queryKey: ["import-jobs"] });
      if (res.failed === 0) toast.success(`Imported ${res.success} of ${res.total} rows.`);
      else toast.warning(`${res.success} imported, ${res.failed} failed. See job details.`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Import failed"),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>New import — {schema.label}</DialogTitle>
        </DialogHeader>

        {step === "type" && (
          <div className="space-y-4">
            <Label>What are you importing?</Label>
            <Select value={importType} onValueChange={setImportType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.values(IMPORT_SCHEMAS).map((s) => (
                  <SelectItem key={s.key} value={s.key}>{s.label} ({s.category})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Wizard supports {Object.keys(IMPORT_SCHEMAS).length} entity types today (Customers, Contacts,
              Leads, Suppliers, Products). More coming.
            </p>
            <DialogFooter>
              <Button onClick={() => setStep("upload")}>Next <ArrowRight className="ml-1 h-4 w-4" /></Button>
            </DialogFooter>
          </div>
        )}

        {step === "upload" && (
          <div className="space-y-4">
            <div>
              <Label>Upload CSV or XLSX</Label>
              <Input
                ref={fileInput}
                type="file"
                accept=".csv,.tsv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void parseFile(f); }}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Max 5,000 rows per file. First row must be column headers.
              </p>
            </div>
            <div className="rounded-md border border-border bg-muted/30 p-3 text-xs">
              <p className="font-medium mb-1">Expected columns for {schema.label}:</p>
              <div className="flex flex-wrap gap-1">
                {schema.fields.map((f) => (
                  <Badge key={f.key} variant={f.required ? "default" : "outline"}>
                    {f.label}{f.required ? " *" : ""}
                  </Badge>
                ))}
              </div>
            </div>
            <DialogFooter className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep("type")}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Back
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "map" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              File: <span className="font-medium text-foreground">{fileName}</span> — {rows.length} rows detected.
            </p>
            <div className="max-h-[360px] overflow-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left px-3 py-2">Field</th>
                    <th className="text-left px-3 py-2">Source column</th>
                  </tr>
                </thead>
                <tbody>
                  {schema.fields.map((f) => (
                    <tr key={f.key} className="border-t border-border">
                      <td className="px-3 py-2">
                        <div className="font-medium">
                          {f.label}{f.required && <span className="text-rose-600"> *</span>}
                        </div>
                        <div className="text-[11px] text-muted-foreground">{f.key} · {f.type ?? "text"}</div>
                      </td>
                      <td className="px-3 py-2">
                        <Select
                          value={mapping[f.key] ?? "__none__"}
                          onValueChange={(v) => setMapping((m) => ({ ...m, [f.key]: v === "__none__" ? "" : v }))}
                        >
                          <SelectTrigger className="h-8"><SelectValue placeholder="— skip —" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">— skip —</SelectItem>
                            {headers.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {validationIssues.length > 0 && (
              <div className="rounded-md border border-rose-500/30 bg-rose-500/5 p-3 text-xs text-rose-700">
                {validationIssues.map((v) => <div key={v}>• {v}</div>)}
              </div>
            )}
            <DialogFooter className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep("upload")}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Back
              </Button>
              <Button disabled={validationIssues.length > 0} onClick={() => setStep("preview")}>
                Preview <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div>
              <Label>Mode</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
                <SelectTrigger className="h-8 w-64"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="create">Create new only</SelectItem>
                  <SelectItem value="skip_duplicates">Skip duplicates on conflict</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm">
              Ready to import <span className="font-medium">{rows.length}</span> rows into
              {" "}<span className="font-medium">{schema.table}</span>. Preview of first 5:
            </p>
            <div className="max-h-[280px] overflow-auto rounded-md border border-border">
              <table className="w-full text-xs">
                <thead className="bg-muted/40 uppercase text-muted-foreground">
                  <tr>{schema.fields.filter((f) => mapping[f.key]).map((f) => (
                    <th key={f.key} className="text-left px-2 py-1.5">{f.label}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {previewRows.map((r, i) => (
                    <tr key={i} className="border-t border-border">
                      {schema.fields.filter((f) => mapping[f.key]).map((f) => (
                        <td key={f.key} className="px-2 py-1.5">{String(r[mapping[f.key]] ?? "")}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <DialogFooter className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep("map")}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Back
              </Button>
              <Button
                onClick={() => runMut.mutate()}
                disabled={runMut.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {runMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Run import
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "done" && result && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {result.failed === 0 ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              ) : (
                <AlertCircle className="h-6 w-6 text-amber-600" />
              )}
              <div>
                <p className="font-medium">Import finished</p>
                <p className="text-sm text-muted-foreground">
                  {result.success} imported · {result.failed} failed · {result.skipped} skipped · {result.total} total
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Row-level details are saved to the job history below. Failed rows include the exact error message.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => { reset(); }}>Import another file</Button>
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
