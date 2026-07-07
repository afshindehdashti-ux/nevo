import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listSuppressed, removeSuppression } from "@/lib/mail-hub.functions";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/mails/suppressed")({
  component: SuppressedPage,
});

function SuppressedPage() {
  const fetchFn = useServerFn(listSuppressed);
  const removeFn = useServerFn(removeSuppression);
  const query = useQuery({
    queryKey: ["suppressed-emails"],
    queryFn: () => fetchFn(),
    staleTime: 30_000,
  });

  async function handleRemove(email: string) {
    if (!confirm(`Remove ${email} from suppression list?`)) return;
    try {
      await removeFn({ data: { email } });
      toast.success("Removed");
      query.refetch();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const rows = (query.data?.rows ?? []) as unknown as Array<{ email: string; reason: string | null; source: string | null; created_at: string }>;

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="text-base font-semibold">Suppressed addresses</h2>
          <p className="text-xs text-muted-foreground">
            Bounces, complaints, and unsubscribes. Emails to these addresses are blocked automatically.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => query.refetch()}>Refresh</Button>
      </div>

      <div className="border border-border rounded-lg bg-background overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead className="w-32">Source</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead className="w-40">Suppressed at</TableHead>
              <TableHead className="w-24 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">Loading…</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">No suppressed addresses.</TableCell></TableRow>
            ) : rows.map((r) => (
              <TableRow key={r.email}>
                <TableCell className="font-mono text-xs">{r.email}</TableCell>
                <TableCell><Badge variant="outline" className="text-[10px]">{r.source ?? "—"}</Badge></TableCell>
                <TableCell className="text-xs">{r.reason ?? "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{format(new Date(r.created_at), "MMM d, HH:mm")}</TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => handleRemove(r.email)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
