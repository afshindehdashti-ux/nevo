import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Mail, Send, Inbox, ShieldOff, Settings } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/mails")({
  head: () => ({
    meta: [{ title: "Mail Hub — NEVO Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: MailHubLayout,
  errorComponent: ({ error }) => (
    <div className="p-6 text-sm text-destructive">Mail Hub error: {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-6 text-sm">Not found.</div>,
});

const TABS = [
  { to: "/admin/mails", label: "Log Dashboard", icon: Mail, exact: true },
  { to: "/admin/mails/compose", label: "Compose", icon: Send, exact: false },
  { to: "/admin/mails/inbox", label: "Inbox", icon: Inbox, exact: false },
  { to: "/admin/mails/suppressed", label: "Suppressed", icon: ShieldOff, exact: false },
  { to: "/admin/mails/settings", label: "Settings", icon: Settings, exact: false },
] as const;

function MailHubLayout() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  return (
    <div className="flex flex-col min-h-full">
      <div className="border-b border-border bg-background px-6 pt-5 pb-0">
        <div className="flex items-center gap-3 mb-1">
          <Mail className="h-5 w-5 text-accent" />
          <h1 className="text-xl font-semibold tracking-tight">Mail Hub</h1>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Outbound email logs, admin composer, and mailbox for NEVO Industrial.
        </p>
        <nav className="flex gap-1 -mb-px" aria-label="Mail hub sections">
          {TABS.map((t) => {
            const active = t.exact ? pathname === t.to : pathname === t.to || pathname.startsWith(t.to + "/");
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition ${
                  active
                    ? "border-accent text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex-1 p-6">
        <Outlet />
      </div>
    </div>
  );
}
