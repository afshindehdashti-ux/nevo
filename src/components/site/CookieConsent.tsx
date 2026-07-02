import { useEffect, useState } from "react";

/**
 * GDPR-friendly cookie consent banner.
 * Stores the choice in localStorage under "nevo-consent"
 * and dispatches "nevo-consent-change" so Analytics can react.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("nevo-consent")) setVisible(true);
  }, []);

  const set = (choice: "accepted" | "declined") => {
    localStorage.setItem("nevo-consent", choice);
    window.dispatchEvent(new Event("nevo-consent-change"));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-3 bottom-3 z-[70] rounded-xl border border-border/60 bg-background/95 p-4 shadow-lg backdrop-blur md:inset-x-auto md:right-4 md:bottom-4 md:max-w-md"
    >
      <p className="text-sm text-foreground">
        We use essential cookies to run this site and optional analytics cookies
        to improve your experience. See our{" "}
        <a href="/privacy" className="underline">
          Privacy Policy
        </a>
        .
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => set("accepted")}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Accept
        </button>
        <button
          onClick={() => set("declined")}
          className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-surface"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
