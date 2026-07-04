import { createFileRoute } from "@tanstack/react-router";
import { SITE, buildSeo } from "@/lib/seo";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import {
  Briefcase, MapPin, Clock, Users, GraduationCap, Rocket,
  Cpu, Wrench, Zap, Megaphone, Globe2, Building2, ArrowRight, Upload, Heart, Loader2, FileDown,
} from "lucide-react";

import heroImg from "@/assets/corporate/careers-hero.jpg";
import { AnnouncementBar } from "@/components/site/AnnouncementBar";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Section, SectionHeader, Eyebrow } from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { submitLeadForm } from "@/lib/lead-submit";
import { ogImageMeta } from "@/lib/og-images";
import { generateCvConfirmationPdf, type CvConfirmationInput } from "@/lib/cv-confirmation-pdf";
import { trackPdfEvent } from "@/lib/pdf-analytics";


const TITLE = "Careers — Build the Future With NEVO Industrial | Dubai · Germany · Türkiye";
const DESCRIPTION =
  "Join NEVO Industrial engineering teams. Open roles in engineering, sales, automation, project management, mechanical and electrical design. Graduate program, internships and life at NEVO.";
const URL_PATH = "/careers";

const CATEGORIES = [
  { icon: Cpu,        label: "Engineering",           count: 14 },
  { icon: Briefcase,  label: "Sales",                 count: 6  },
  { icon: Building2,  label: "Project Management",    count: 5  },
  { icon: Zap,        label: "Automation",            count: 4  },
  { icon: Wrench,     label: "Mechanical Design",     count: 3  },
  { icon: Zap,        label: "Electrical Engineering",count: 3  },
  { icon: Megaphone,  label: "Marketing",             count: 2  },
  { icon: Globe2,     label: "International Business",count: 4  },
  { icon: GraduationCap, label: "Graduate Program",   count: 8  },
  { icon: Rocket,     label: "Internship",            count: 12 },
];

const ROLES = [
  { title: "Senior Process Engineer — PIR Lines", team: "Engineering", location: "Dubai, UAE", type: "Full-time", level: "Senior" },
  { title: "Automation Engineer (PLC / SCADA)",   team: "Automation",  location: "Düsseldorf, DE", type: "Full-time", level: "Mid" },
  { title: "Project Manager — Factory Delivery",  team: "Project Management", location: "Muscat, OM", type: "Full-time", level: "Senior" },
  { title: "International Sales Director — GCC",  team: "Sales",       location: "Dubai, UAE", type: "Full-time", level: "Director" },
  { title: "Mechanical Design Engineer",          team: "Mechanical",  location: "Istanbul, TR", type: "Full-time", level: "Mid" },
  { title: "Electrical Engineer — Panel Boards",  team: "Electrical",  location: "Istanbul, TR", type: "Full-time", level: "Mid" },
  { title: "Marketing Manager — Industrial B2B",  team: "Marketing",   location: "Dubai, UAE", type: "Full-time", level: "Mid" },
  { title: "Graduate Engineer — Class of 2026",   team: "Graduate",    location: "Multiple",   type: "Program",   level: "Entry" },
];

const BENEFITS = [
  { icon: Heart,        title: "Health & Wellbeing",    body: "Premium medical insurance, mental health support and on-site clinics." },
  { icon: GraduationCap, title: "Learning Budget",      body: "Annual budget for certifications (PMP, PE, PLC vendor training)." },
  { icon: Globe2,        title: "Global Mobility",      body: "Rotation opportunities between Dubai, Germany, Türkiye and Oman." },
  { icon: Rocket,        title: "Stock & Bonus",        body: "Performance bonus and long-term incentive plan for senior engineers." },
  { icon: Users,         title: "Family Support",       body: "Parental leave, relocation assistance and international schooling stipend." },
  { icon: Clock,         title: "Balanced Schedules",   body: "Hybrid where possible, protected quiet hours, generous PTO." },
];

function CareersPage() {
  const cvFormRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [cvName, setCvName] = useState<string>("");
  const [cvSize, setCvSize] = useState<number>(0);
  const [confirmation, setConfirmation] = useState<{
    input: CvConfirmationInput;
    filename: string;
    reference: string;
    blobUrl: string;
  } | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState<{
    title: string;
    description: string;
    detail?: string;
    at: Date;
    attempt: number;
  } | null>(null);
  const attemptRef = useRef(0);

  async function handleApplication(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setUploadError(null);
    setProgress(0);
    const { toast } = await import("sonner");
    const form = e.currentTarget;
    const fd = new FormData(form);
    const snapshot: CvConfirmationInput = {
      name: String(fd.get("name") || ""),
      email: String(fd.get("email") || ""),
      phone: String(fd.get("phone") || ""),
      linkedin: String(fd.get("linkedin") || "") || undefined,
      team: String(fd.get("team") || "") || undefined,
      note: String(fd.get("note") || "") || undefined,
      cvName: cvName || undefined,
      cvSize: cvSize || undefined,
      submittedAt: new Date(),
    };
    attemptRef.current += 1;
    const attempt = attemptRef.current;

    // Estimate upload duration from file size (~1 MB / 400ms), min 1.2s max 6s.
    const targetMs = cvSize
      ? Math.min(6000, Math.max(1200, Math.round((cvSize / (1024 * 1024)) * 400) + 800))
      : 1200;
    const sizeLabel = cvSize ? ` (${(cvSize / (1024 * 1024)).toFixed(2)} MB)` : "";
    const loadingId = toast.loading(
      cvName ? `Uploading CV — ${cvName}${sizeLabel} · 0%` : "Submitting application… 0%",
      { description: "Please keep this tab open while we transmit your application." },
    );

    const startedAt = performance.now();
    let uploadDone = false;
    const tick = () => {
      if (uploadDone) return;
      const elapsed = performance.now() - startedAt;
      const pct = Math.min(92, Math.round((elapsed / targetMs) * 92));
      setProgress(pct);
      const uploadedMb = cvSize ? ((cvSize * pct) / 100 / (1024 * 1024)).toFixed(2) : null;
      const totalMb = cvSize ? (cvSize / (1024 * 1024)).toFixed(2) : null;
      toast.loading(
        cvName
          ? `Uploading CV — ${cvName} · ${pct}%`
          : `Submitting application… ${pct}%`,
        {
          id: loadingId,
          description: uploadedMb && totalMb
            ? `${uploadedMb} MB of ${totalMb} MB uploaded`
            : "Please keep this tab open while we transmit your application.",
        },
      );
    };
    const interval = window.setInterval(tick, 120);

    const recordFailure = (title: string, description: string, detail?: string) => {
      setUploadError({ title, description, detail, at: new Date(), attempt });
    };

    try {
      let ok = false;
      let caughtDetail: string | undefined;
      try {
        ok = await submitLeadForm(form, {
          source: "careers-application",
          rules: [
            { field: "name", label: "Full name" },
            { field: "email", label: "Email", type: "email" },
            { field: "phone", label: "Phone", type: "phone" },
          ],
          successTitle: "Application received",
          successDescription: cvName
            ? `CV "${cvName}" uploaded successfully. Generating your PDF confirmation…`
            : "Generating your PDF confirmation…",
        });
      } catch (err) {
        caughtDetail = err instanceof Error ? err.message : String(err);
        ok = false;
      }

      uploadDone = true;
      window.clearInterval(interval);

      if (!ok) {
        setProgress(0);
        const online = typeof navigator === "undefined" || navigator.onLine !== false;
        const title = online ? "Upload failed" : "You appear to be offline";
        const description = online
          ? "We couldn't finish sending your application. Your file is still attached — retry to resend without re-selecting it."
          : "Reconnect to the internet, then retry. Your file is still attached.";
        const detail = caughtDetail
          ?? (cvName
            ? `File: ${cvName}${cvSize ? ` (${(cvSize / (1024 * 1024)).toFixed(2)} MB)` : ""} · Attempt ${attempt}`
            : `Attempt ${attempt}`);
        recordFailure(title, description, detail);
        toast.error(title, {
          id: loadingId,
          description,
          action: {
            label: "Retry upload",
            onClick: () => cvFormRef.current?.requestSubmit(),
          },
        });
        return;
      }

      setProgress(100);
      toast.loading(
        cvName ? `CV uploaded — ${cvName} · 100%` : "Application submitted · 100%",
        { id: loadingId, description: "Finalising your confirmation…" },
      );

      // Generate PDF confirmation
      try {
        if (confirmation?.blobUrl) URL.revokeObjectURL(confirmation.blobUrl);
        const { blob, filename, reference } = generateCvConfirmationPdf(snapshot);
        const blobUrl = URL.createObjectURL(blob);
        setConfirmation({ input: snapshot, filename, reference, blobUrl });
        toast.success("PDF confirmation ready", {
          id: loadingId,
          description: `Reference ${reference} — download your confirmation below.`,
        });
      } catch (err) {
        toast.error("Could not generate PDF confirmation", {
          id: loadingId,
          description: err instanceof Error ? err.message : "Please try again.",
        });
      }
      cvFormRef.current?.reset();
      setCvName("");
      setCvSize(0);
    } finally {
      uploadDone = true;
      window.clearInterval(interval);
      setBusy(false);
      window.setTimeout(() => setProgress(0), 800);
    }
  }

  function handleRetryUpload() {
    if (busy) return;
    setUploadError(null);
    cvFormRef.current?.requestSubmit();
  }

  function handleDismissUploadError() {
    setUploadError(null);
  }




  async function handleDownloadConfirmation() {
    if (!confirmation || downloading) return;
    setDownloading(true);
    const { toast } = await import("sonner");
    const startedAt = performance.now();
    const loadingId = toast.loading("Preparing PDF download…");
    trackPdfEvent({
      document_id: "cv-application-confirmation",
      document_title: "CV Application Confirmation",
      category: "careers",
      source_page: "/careers",
      filename: confirmation.filename,
      status: "start",
    });
    try {
      const a = document.createElement("a");
      a.href = confirmation.blobUrl;
      a.download = confirmation.filename;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Download started", {
        description: confirmation.filename,
      });
      trackPdfEvent({
        document_id: "cv-application-confirmation",
        document_title: "CV Application Confirmation",
        category: "careers",
        source_page: "/careers",
        filename: confirmation.filename,
        status: "success",
        duration_ms: Math.round(performance.now() - startedAt),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Please try again.";
      toast.error("Download failed", {
        description: message,
        action: { label: "Retry", onClick: () => void handleDownloadConfirmation() },
      });
      trackPdfEvent({
        document_id: "cv-application-confirmation",
        category: "careers",
        source_page: "/careers",
        filename: confirmation.filename,
        status: "failure",
        duration_ms: Math.round(performance.now() - startedAt),
        error_message: message,
      });
    } finally {
      toast.dismiss(loadingId);
      setDownloading(false);
    }
  }



  return (
    <>
      <AnnouncementBar />
      <SiteHeader />

      <section className="relative isolate overflow-hidden bg-[#0a0d0c] text-white">
        <img loading="lazy" decoding="async" src={heroImg} alt="NEVO engineering team" width={1920} height={1088}
             className="absolute inset-0 h-full w-full object-cover opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0d0c]/85 via-[#0a0d0c]/55 to-[#0a0d0c]" />
        <div className="container-wide relative py-32 md:py-40">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <Eyebrow className="text-emerald-400/90">Careers at NEVO</Eyebrow>
            <h1 className="mt-4 max-w-4xl text-5xl font-semibold tracking-tight md:text-7xl">
              Build the future <span className="text-emerald-400">with NEVO.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-white/70">
              Senior engineers, ambitious graduates, sharp commercial minds — we hire people who want to
              build industrial infrastructure the world will still rely on in 2050.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button size="lg" asChild><a href="#open-roles">See Open Roles <ArrowRight className="ml-2 h-4 w-4" /></a></Button>
              <Button size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10" asChild>
                <a href="#upload-cv">Upload Your CV</a>
              </Button>
            </div>
            <div className="mt-16 grid max-w-2xl grid-cols-3 gap-8 border-t border-white/10 pt-8">
              <div><div className="text-4xl font-semibold text-emerald-400">61</div><div className="mt-1 text-xs uppercase tracking-widest text-white/50">Open Roles</div></div>
              <div><div className="text-4xl font-semibold text-emerald-400">18</div><div className="mt-1 text-xs uppercase tracking-widest text-white/50">Nationalities</div></div>
              <div><div className="text-4xl font-semibold text-emerald-400">4.8</div><div className="mt-1 text-xs uppercase tracking-widest text-white/50">Glassdoor Score</div></div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CATEGORIES */}
      <Section tone="surface">
        <SectionHeader eyebrow="Explore Teams" title="Where you can grow at NEVO" />
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((c) => (
            <a key={c.label} href="#open-roles"
               className="group flex items-center gap-4 rounded-xl border border-border bg-background p-5 transition hover:-translate-y-1 hover:border-emerald-500/60 hover:shadow-lg">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                <c.icon className="h-5 w-5" />
              </span>
              <div>
                <div className="text-sm font-semibold">{c.label}</div>
                <div className="text-xs text-muted-foreground">{c.count} open</div>
              </div>
            </a>
          ))}
        </div>
      </Section>

      {/* OPEN ROLES */}
      <Section id="open-roles">
        <SectionHeader eyebrow="Open Positions" title="Roles hiring now"
          aside={<Button variant="outline" asChild><a href="#upload-cv">Speculative Application</a></Button>} />
        <div className="overflow-hidden rounded-2xl border border-border">
          {ROLES.map((r, i) => (
            <div key={r.title}
              className={`grid grid-cols-1 gap-3 p-6 transition hover:bg-muted/60 md:grid-cols-[2fr_1fr_1fr_auto] md:items-center ${i > 0 ? "border-t border-border" : ""}`}>
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">{r.team} · {r.level}</div>
                <div className="mt-1 text-lg font-semibold">{r.title}</div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{r.location}</div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock  className="h-4 w-4" />{r.type}</div>
              <Button variant="outline" className="md:justify-self-end" asChild>
                <a href="#upload-cv">Apply <ArrowRight className="ml-2 h-4 w-4" /></a>
              </Button>
            </div>
          ))}
        </div>
      </Section>

      {/* BENEFITS */}
      <Section tone="surface">
        <SectionHeader eyebrow="Benefits" title="Support beyond the paycheck" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b) => (
            <div key={b.title} className="rounded-2xl border border-border bg-background p-6">
              <b.icon className="h-7 w-7 text-emerald-600" />
              <h3 className="mt-6 text-lg font-semibold">{b.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{b.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* UPLOAD CV */}
      <Section id="upload-cv">
        <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-background p-8 md:p-12">
          <Eyebrow>Apply / Upload CV</Eyebrow>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">Send us your CV</h2>
          <p className="mt-3 text-sm text-muted-foreground">Even if a matching role isn't listed today — our talent team reviews every application.</p>
          <form ref={cvFormRef} className="mt-8 grid gap-4" onSubmit={handleApplication} noValidate>
            <div className="grid gap-4 md:grid-cols-2">
              <input name="name" placeholder="Full name" required className="rounded-md border border-input bg-background px-4 py-3 text-sm" />
              <input name="email" placeholder="Email" type="email" required className="rounded-md border border-input bg-background px-4 py-3 text-sm" />
              <input name="phone" placeholder="Phone" required className="rounded-md border border-input bg-background px-4 py-3 text-sm" />
              <input name="linkedin" placeholder="LinkedIn" className="rounded-md border border-input bg-background px-4 py-3 text-sm" />
            </div>
            <select name="team" defaultValue="" className="rounded-md border border-input bg-background px-4 py-3 text-sm">
              <option value="" disabled>Preferred team…</option>
              <option>Engineering</option>
              <option>Sales</option>
              <option>Project Management</option>
              <option>Graduate / Intern</option>
            </select>
            <label className="flex cursor-pointer items-center justify-between rounded-md border border-dashed border-input bg-muted/40 px-4 py-6 text-sm text-muted-foreground hover:bg-muted">
              <span className="flex items-center gap-3">
                {busy && cvName ? <Loader2 className="h-5 w-5 animate-spin text-emerald-600" /> : <Upload className="h-5 w-5" />}
                <span>
                  {cvName || "Upload CV (PDF, DOCX — max 8 MB)"}
                  {cvName && cvSize > 0 && (
                    <span className="ml-2 text-xs text-emerald-600">
                      · {(cvSize / (1024 * 1024)).toFixed(2)} MB {busy ? "uploading…" : "ready"}
                    </span>
                  )}
                </span>
              </span>
              <span className="text-xs">{cvName ? (busy ? "Uploading…" : "Change") : "Click to browse"}</span>
              <input
                name="cv"
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx"
                disabled={busy}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) {
                    setCvName("");
                    setCvSize(0);
                    return;
                  }
                  if (f.size > 8 * 1024 * 1024) {
                    e.target.value = "";
                    setCvName("");
                    setCvSize(0);
                    import("sonner").then(({ toast }) => toast.error("File too large", { description: "CV must be under 8 MB." }));
                    return;
                  }
                  setCvName(f.name);
                  setCvSize(f.size);
                  import("sonner").then(({ toast }) =>
                    toast.success("CV attached", {
                      description: `${f.name} · ${(f.size / (1024 * 1024)).toFixed(2)} MB ready to submit.`,
                    }),
                  );
                }}
              />
            </label>
            <textarea name="note" rows={4} placeholder="Why NEVO? (optional)"
                      className="rounded-md border border-input bg-background px-4 py-3 text-sm" />
            <Button type="submit" size="lg" disabled={busy}>
              {busy ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {cvName ? `Uploading CV… ${progress}%` : `Submitting… ${progress}%`}</>
              ) : (
                <>Submit Application <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>

            {(busy || progress > 0) && (
              <div
                className="mt-1 space-y-2"
                role="status"
                aria-live="polite"
                aria-label={`Upload progress ${progress}%`}
              >
                <Progress value={progress} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {cvName
                      ? progress >= 100
                        ? `CV uploaded — ${cvName}`
                        : `Uploading ${cvName}…`
                      : progress >= 100
                        ? "Application submitted"
                        : "Submitting application…"}
                  </span>
                  <span className="font-mono tabular-nums text-foreground">{progress}%</span>
                </div>
                {cvSize > 0 && (
                  <div className="text-[11px] text-muted-foreground">
                    {((cvSize * progress) / 100 / (1024 * 1024)).toFixed(2)} MB of{" "}
                    {(cvSize / (1024 * 1024)).toFixed(2)} MB
                  </div>
                )}
              </div>
            )}


            {confirmation && (
              <div className="mt-2 rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600">
                    <FileDown className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-foreground">
                      Application confirmation ready
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Reference <span className="font-mono">{confirmation.reference}</span> · {confirmation.filename}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => void handleDownloadConfirmation()}
                        disabled={downloading}
                      >
                        {downloading ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparing…</>
                        ) : (
                          <><FileDown className="mr-2 h-4 w-4" /> Download PDF Report</>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>

        </div>
      </Section>

      {/* SALES CTA */}
      <Section className="bg-graphite text-white">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 text-center">
          <Eyebrow className="text-white/60">Working with NEVO</Eyebrow>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Have a project instead of a CV? Talk to our engineering team.
          </h2>
          <p className="max-w-2xl text-sm text-white/70">
            Requesting a factory, panel line or sandwich panel quotation? Our sales engineers respond within one business day.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-emerald text-graphite hover:bg-emerald/90">
              <a href="/project-inquiry">Request a Quotation <ArrowRight className="ml-2 h-4 w-4" /></a>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
              <a href="/contact">Contact NEVO Sales</a>
            </Button>
          </div>
        </div>
      </Section>

      <SiteFooter />
    </>
  );
}

export const Route = createFileRoute("/$lang/careers")({
  head: ({ params }) =>
    buildSeo({ title: TITLE, description: DESCRIPTION, path: URL_PATH, lang: params.lang }),
  component: CareersPage,
});
