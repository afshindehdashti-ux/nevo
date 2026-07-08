import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ListEmptyStateProps {
  /** Icon rendered above the title (lucide-react component). */
  icon: LucideIcon;
  /** Short headline, e.g. "No opportunities yet". */
  title: string;
  /** One-sentence explanation of why the list is empty and what to do. */
  description: string;
  /** Optional call-to-action button/link rendered below the description. */
  action?: ReactNode;
}

/**
 * Friendly empty-state card for admin list pages. Replaces the previous
 * "No X yet." bare text so pages don't read as broken when a fresh
 * environment has no records.
 */
export function ListEmptyState({ icon: Icon, title, description, action }: ListEmptyStateProps) {
  return (
    <Card>
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
