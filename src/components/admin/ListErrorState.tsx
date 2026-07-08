import { useEffect, useRef } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { logClientEvent, reportClientError } from "@/lib/client-monitor";

interface ListErrorStateProps {
  /** Human-friendly label used in the headline, e.g. "opportunities". */
  resource: string;
  /** Underlying error thrown by the query. */
  error: unknown;
  /** Retry handler — typically `() => refetch()` from useQuery. */
  onRetry: () => void;
  /** Optional: disable the retry button while a retry is already in flight. */
  isRetrying?: boolean;
}

/**
 * Non-destructive error card for admin list pages. The previously-loaded
 * data (if any) stays in the React Query cache — this only replaces the
 * table area, and Retry re-runs the same query.
 */
export function ListErrorState({ resource, error, onRetry, isRetrying }: ListErrorStateProps) {
  const message = error instanceof Error ? error.message : String(error ?? "Unknown error");

  return (
    <Card className="border-destructive/40 bg-destructive/5" role="alert" aria-live="polite">
      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-destructive">
            Failed to load {resource}.
          </p>
          <p className="text-xs text-muted-foreground mt-1 break-words">
            {message}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            No data was changed. You can retry the request below.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onRetry}
          disabled={isRetrying}
          className="shrink-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRetrying ? "animate-spin" : ""}`} aria-hidden="true" />
          {isRetrying ? "Retrying…" : "Retry"}
        </Button>
      </CardContent>
    </Card>
  );
}
