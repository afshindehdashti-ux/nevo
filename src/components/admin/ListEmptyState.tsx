import { useEffect, useRef, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { logClientEvent } from "@/lib/client-monitor";
import type { AdminListEmptyReason, AdminListResource } from "./list-telemetry";

interface ListEmptyStateProps {
  /** Icon rendered above the title (lucide-react component). */
  icon: LucideIcon;
  /** Short headline, e.g. "No opportunities yet". */
  title: string;
  /** One-sentence explanation of why the list is empty and what to do. */
  description: string;
  /** Optional call-to-action button/link rendered below the description. */
  action?: ReactNode;
  /**
   * Registered telemetry slug for this list, e.g. `"opportunities"`. When
   * provided, an `admin_list_empty_shown` event is emitted once per
   * (resource + reason). Slugs must be added to `ADMIN_LIST_RESOURCES`
   * first — an unregistered string will not compile.
   */
  resource?: AdminListResource;
  /**
   * Why the list is empty. Defaults to `"no_records"`. Only the values in
   * `ADMIN_LIST_EMPTY_REASONS` are accepted.
   */
  reason?: AdminListEmptyReason;
}

/**
 * Friendly empty-state card for admin list pages. Replaces the previous
 * "No X yet." bare text so pages don't read as broken when a fresh
 * environment has no records. Also emits telemetry so we can tell apart
 * genuinely-empty tables from silently-failed seeds.
 */
export function ListEmptyState({
  icon: Icon,
  title,
  description,
  action,
  resource,
  reason = "no_records",
}: ListEmptyStateProps) {
  const loggedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!resource) return;
    const key = `${resource}::${reason}`;
    if (loggedRef.current === key) return;
    loggedRef.current = key;
    logClientEvent(
      "admin_list_empty_shown",
      { surface: "admin_list", resource, reason },
      reason === "seed_missing" ? "warn" : "info",
    );
  }, [resource, reason]);

  return (
    <Card role="status" aria-live="polite">
      <CardContent className="p-10 flex flex-col items-center text-center gap-3">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <Icon className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        </div>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground max-w-md">{description}</p>
        {action ? <div className="mt-2">{action}</div> : null}
      </CardContent>
    </Card>
  );
}
