import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

export function AdminPlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Construction className="h-5 w-5 text-primary" />
            Module coming next
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            The NEVO CRM is being rolled out in phases. Phase 1 (authentication, protected shell,
            dashboard, roles, and company settings) is now live.
          </p>
          <p>
            This module will be delivered in the next phase, together with the related database
            tables, list views, detail pages, and PDF exports.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
