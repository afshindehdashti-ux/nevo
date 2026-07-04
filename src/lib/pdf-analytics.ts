import { logDownload } from "@/lib/inquiries.functions";

type Status = "start" | "success" | "failure";

type TrackInput = {
  document_id: string;
  document_title?: string;
  category?: string;
  source_page?: string;
  filename?: string;
  status: Status;
  duration_ms?: number;
  error_message?: string;
};

/**
 * Fire-and-forget analytics for PDF downloads.
 * Never throws — logging must never block a user's download.
 */
export function trackPdfEvent(input: TrackInput): void {
  try {
    void logDownload({ data: input }).catch(() => {
      /* ignore analytics errors */
    });
  } catch {
    /* ignore analytics errors */
  }
}
