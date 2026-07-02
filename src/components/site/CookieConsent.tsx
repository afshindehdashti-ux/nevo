import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@/components/site/LocalizedLink";

export function CookieConsent() {
  const { t } = useTranslation();
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
        {t("home.cookies.text")}{" "}
        <Link to="/privacy" className="underline">
          {t("home.cookies.privacyLink")}
        </Link>
        .
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => set("accepted")}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {t("home.cookies.accept")}
        </button>
        <button
          onClick={() => set("declined")}
          className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-surface"
        >
          {t("home.cookies.decline")}
        </button>
      </div>
    </div>
  );
}
