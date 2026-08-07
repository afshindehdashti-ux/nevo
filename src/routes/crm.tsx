import { createFileRoute } from "@tanstack/react-router";
import { LegacyBackendRedirect } from "@/components/crm/LegacyBackendRedirect";

export const Route = createFileRoute("/crm")({
  ssr: false,
  component: LegacyBackendRedirect,
});
