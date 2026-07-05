import { createFileRoute, redirect } from "@tanstack/react-router";

// Canonical sign-in URL for the CRM. Delegates to /auth (the existing sign-in page)
// which handles password auth and post-login redirect to /admin.
export const Route = createFileRoute("/admin/login")({
  ssr: false,
  beforeLoad: () => {
    throw redirect({ to: "/auth" });
  },
});
