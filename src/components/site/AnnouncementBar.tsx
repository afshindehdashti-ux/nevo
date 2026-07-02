import { useTranslation } from "react-i18next";
import { Link } from "@/components/site/LocalizedLink";

export function AnnouncementBar() {
  const { t } = useTranslation();
  return (
    <div className="border-b border-border bg-primary text-primary-foreground">
      <div className="container-wide flex h-9 items-center justify-between gap-4 text-[11px]">
        <div className="flex items-center gap-2 font-mono tracking-widest">
          <span className="inline-flex size-1.5 rounded-full bg-accent" />
          <span className="uppercase text-primary-foreground/70">
            {t("home.announcement.location")}
          </span>
        </div>
        <Link
          to="/project-inquiry"
          className="hidden items-center gap-1 font-medium uppercase tracking-widest text-primary-foreground/85 hover:text-primary-foreground sm:inline-flex"
        >
          {t("home.announcement.deskOpen")}
        </Link>
      </div>
    </div>
  );
}
