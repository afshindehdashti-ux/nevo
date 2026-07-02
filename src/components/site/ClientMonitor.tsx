import { useEffect } from "react";
import { installClientMonitor } from "@/lib/client-monitor";

/**
 * Mounts the client-side error & request monitor on app boot.
 * Renders nothing. Safe to include in RootComponent.
 */
export function ClientMonitor() {
  useEffect(() => {
    installClientMonitor();
  }, []);
  return null;
}
