import { createFileRoute } from "@tanstack/react-router";
import { LegacyBackendRedirect } from "@/components/crm/LegacyBackendRedirect";

export const Route = createFileRoute("/backoffice")({
  ssr: false,
  component: LegacyBackendRedirect,
});
