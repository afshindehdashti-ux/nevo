import { ShieldAlert } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function AccessDenied({ message }: { message?: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-4">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Access Denied</h1>
        <p className="text-sm text-muted-foreground">
          {message ??
            "You do not have permission to view this section. Ask a Super Admin to update your role."}
        </p>
        <Button asChild variant="outline">
          <Link to="/admin">Return to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
