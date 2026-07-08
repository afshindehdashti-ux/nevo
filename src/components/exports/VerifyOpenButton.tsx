import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface VerifyOpenButtonProps {
  rowId: string;
  verifyingId: string | null;
  onClick: () => void;
}

/**
 * "Verify & open" action for a CSV export audit row.
 *
 * Disabled while ANY row is being verified (`verifyingId !== null`) so the
 * user can't queue up parallel verifications. The button that IS running
 * additionally shows a spinner + "Verifying…" label and `aria-busy=true`.
 */
export function VerifyOpenButton({ rowId, verifyingId, onClick }: VerifyOpenButtonProps) {
  const isThisRow = verifyingId === rowId;
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-7 px-2"
      onClick={onClick}
      disabled={verifyingId !== null}
      aria-busy={isThisRow}
      title="Pick the saved CSV to re-verify its SHA-256 before opening"
    >
      {isThisRow ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span className="ml-1">Verifying…</span>
        </>
      ) : (
        <>
          <FileDown className="h-3 w-3" />
          <span className="ml-1">Verify &amp; open</span>
        </>
      )}
    </Button>
  );
}
