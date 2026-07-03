import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listSolutionsInspection,
  runSolutionsInspection,
  type SolutionsInspectionRow,
  type SolutionsInspectionList,
} from "@/lib/solutions-inspection.functions";
import { isCurrentUserAdmin } from "@/lib/logo-events.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow, format } from "date-fns";

export const Route = createFileRoute("/_authenticated/admin/solutions-seo")({
  head: () => ({
    meta: [
      { title: "Solutions SEO — Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SolutionsSeoAdmin,
});

function verdictClass(v: string | null) {
  if (!v) return "text-muted-foreground";
  if (v === "PASS") return "text-emerald-600";
  if (v === "FAIL") return "text-red-600";
  return "text-amber-600";
}

function SolutionsSeoAdmin() {
  const navigate = useNavigate();
  const checkAdmin = useServerFn(isCurrentUserAdmin);
  const listFn = useServerFn(listSolutionsInspection);
  const runFn = useServerFn(runSolutionsInspection);

  const adminQ = useQuery({ queryKey: ["is-admin"], queryFn: () => checkAdmin() });
  const dataQ = useQuery<SolutionsInspectionList>({
    queryKey: ["solutions-inspection"],
    queryFn: () => listFn(),
    enabled: !!adminQ.data?.admin,
  });

  const runM = useMutation({
    mutationFn: () => runFn(),
    onSettled: () => dataQ.refetch(),
  });

  const signOut = useMutation({
    mutationFn: async () => {
      await supabase.auth.signOut();
    },
    onSuccess: () => navigate({ to: "/auth" }),
  });

  const merged = useMemo(() => {
    const rows = (dataQ.data?.rows ?? []) as SolutionsInspectionRow[];
    const expected = dataQ.data?.expected ?? [];
    const byKey = new Map(rows.map((r) => [`${r.locale}|${r.path}`, r]));
    return expected.map(({ locale, path }) => {
      const key = `${locale}|${path}`;
      return byKey.get(key) ?? {
        id: key,
        locale,
        path,
        url: "",
        verdict: null,
        coverage_state: null,
        indexing_state: null,
        mobile_verdict: null,
        rich_verdict: null,
        google_canonical: null,
        rich_detail: {},
        last_error: null,
        inspected_at: "",
      } as SolutionsInspectionRow;
    });
  }, [dataQ.data]);

  const totals = useMemo(() => {
    const t = { total: merged.length, pass: 0, fail: 0, neutral: 0, never: 0 };
    for (const r of merged) {
      if (!r.inspected_at) t.never++;
      else if (r.verdict === "PASS") t.pass++;
      else if (r.verdict === "FAIL") t.fail++;
      else t.neutral++;
    }
    return t;
  }, [merged]);

  const lastRun = useMemo(() => {
    const ts = merged
      .map((r) => (r.inspected_at ? new Date(r.inspected_at).getTime() : 0))
      .filter(Boolean);
    return ts.length ? new Date(Math.max(...ts)) : null;
  }, [merged]);

  if (adminQ.isLoading) {
    return <Shell><p className="text-sm text-muted-foreground">Checking access…</p></Shell>;
  }
  if (!adminQ.data?.admin) {
    return (
      <Shell>
        <div className="border border-border rounded-lg p-6 bg-card space-y-3 max-w-lg">
          <h2 className="text-lg font-semibold">Not authorized</h2>
          <p className="text-sm text-muted-foreground">
            Your account isn't an admin. Ask a project owner to grant you the <code>admin</code> role.
          </p>
          <Button variant="outline" onClick={() => signOut.mutate()}>Sign out</Button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex flex-wrap items-center gap-3 p-4 border border-border rounded-lg bg-card">
        <div className="text-sm text-muted-foreground">
          Last inspection:{" "}
          <strong className="text-foreground">
            {lastRun ? `${format(lastRun, "PPpp")} (${formatDistanceToNow(lastRun, { addSuffix: true })})` : "never"}
          </strong>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={() => dataQ.refetch()} disabled={dataQ.isFetching}>
            {dataQ.isFetching ? "Refreshing…" : "Refresh"}
          </Button>
          <Button onClick={() => runM.mutate()} disabled={runM.isPending}>
            {runM.isPending ? "Running inspection (60 URLs)…" : "Run inspection"}
          </Button>
          <Button variant="ghost" onClick={() => signOut.mutate()}>Sign out</Button>
        </div>
      </div>

      {runM.isError && (
        <p className="text-sm text-destructive">
          {(runM.error as Error).message}
        </p>
      )}
      {runM.isSuccess && !runM.isPending && (
        <p className="text-sm text-muted-foreground">
          Last run: {runM.data.ok}/{runM.data.total} succeeded · {runM.data.failed} failed.
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="URLs" value={totals.total} />
        <Stat label="PASS" value={totals.pass} accent="text-emerald-600" />
        <Stat label="NEUTRAL" value={totals.neutral} accent="text-amber-600" />
        <Stat label="FAIL" value={totals.fail} accent="text-red-600" />
        <Stat label="Never inspected" value={totals.never} accent="text-muted-foreground" />
      </div>

      <section className="border border-border rounded-lg bg-card overflow-hidden">
        <div className="overflow-auto max-h-[70vh]">
          <table className="w-full text-xs">
            <thead className="bg-muted sticky top-0">
              <tr>
                <th className="text-left p-2">Locale</th>
                <th className="text-left p-2">Path</th>
                <th className="text-left p-2">Verdict</th>
                <th className="text-left p-2">Coverage</th>
                <th className="text-left p-2">Indexing</th>
                <th className="text-left p-2">Mobile</th>
                <th className="text-left p-2">Rich</th>
                <th className="text-left p-2">Google canonical</th>
                <th className="text-right p-2">Inspected</th>
              </tr>
            </thead>
            <tbody>
              {merged.map((r) => (
                <tr key={`${r.locale}|${r.path}`} className="border-t border-border align-top">
                  <td className="p-2 font-mono">{r.locale}</td>
                  <td className="p-2 font-mono">{r.path}</td>
                  <td className={`p-2 font-medium ${verdictClass(r.verdict)}`}>
                    {r.verdict ?? "—"}
                    {r.last_error && (
                      <div className="text-[10px] text-red-600 mt-1 whitespace-normal max-w-[220px]">
                        {r.last_error}
                      </div>
                    )}
                  </td>
                  <td className="p-2">{r.coverage_state ?? "—"}</td>
                  <td className="p-2">{r.indexing_state ?? "—"}</td>
                  <td className="p-2">{r.mobile_verdict ?? "—"}</td>
                  <td className="p-2">{r.rich_verdict ?? "—"}</td>
                  <td className="p-2 truncate max-w-[260px]" title={r.google_canonical ?? undefined}>
                    {r.google_canonical ?? "—"}
                  </td>
                  <td className="p-2 text-right whitespace-nowrap">
                    {r.inspected_at
                      ? formatDistanceToNow(new Date(r.inspected_at), { addSuffix: true })
                      : "never"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Solutions SEO — Search Console</h1>
        <p className="text-sm text-muted-foreground">
          Index/coverage status and last inspection time for every Solutions page across all locales.
        </p>
      </header>
      {children}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-3xl font-semibold mt-1 ${accent ?? ""}`}>{value}</div>
    </div>
  );
}
