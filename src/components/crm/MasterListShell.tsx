import { type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search } from "lucide-react";

type Props = {
  title: string;
  description: string;
  count: number;
  search: string;
  onSearchChange: (v: string) => void;
  canCreate: boolean;
  onCreate: () => void;
  createLabel?: string;
  /** Optional content rendered in the header action row (e.g. a Guide Me button). */
  headerExtra?: ReactNode;
  children: ReactNode;
};

export function MasterListShell({
  title,
  description,
  count,
  search,
  onSearchChange,
  canCreate,
  onCreate,
  createLabel = "New",
  headerExtra,
  children,
}: Props) {
  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            NEVO · Back Office
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight flex items-center gap-3">
            {title}
            <Badge variant="secondary" className="font-normal">
              {count}
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="flex gap-2 flex-col sm:flex-row w-full md:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search…"
              className="pl-8"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          {headerExtra}
          {canCreate && (
            <Button onClick={onCreate} className="gap-1.5">
              <Plus className="h-4 w-4" /> {createLabel}
            </Button>
          )}
        </div>
      </div>
      <Card className="overflow-hidden">{children}</Card>
    </div>
  );
}
