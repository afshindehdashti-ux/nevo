/**
 * Analytics loader — mounts GA4, GTM, Microsoft Clarity, Meta Pixel,
 * LinkedIn Insight when the corresponding VITE_* env var is set AND the
 * user has granted analytics consent (cookie-consent stored in localStorage).
 *
 * All tags are 100% opt-in. No requests are sent without consent.
 */
import { useEffect, useState } from "react";
import { useIsBackend } from "@/lib/use-route-area";

const ENV = import.meta.env;

const IDS = {
  ga4: ENV.VITE_GA4_ID as string | undefined,
  gtm: ENV.VITE_GTM_ID as string | undefined,
  clarity: ENV.VITE_CLARITY_ID as string | undefined,
  metaPixel: ENV.VITE_META_PIXEL_ID as string | undefined,
  linkedin: ENV.VITE_LINKEDIN_PARTNER_ID as string | undefined,
};

function inject(id: string, html: string) {
  if (document.getElementById(id)) return;
  const s = document.createElement("script");
  s.id = id;
  s.innerHTML = html;
  document.head.appendChild(s);
}

function injectSrc(id: string, src: string, async = true) {
  if (document.getElementById(id)) return;
  const s = document.createElement("script");
  s.id = id;
  s.async = async;
  s.src = src;
  document.head.appendChild(s);
}

export function Analytics() {
  const [consent, setConsent] = useState<string | null>(null);

  useEffect(() => {
    setConsent(localStorage.getItem("nevo-consent"));
    const onChange = () => setConsent(localStorage.getItem("nevo-consent"));
    window.addEventListener("nevo-consent-change", onChange);
    return () => window.removeEventListener("nevo-consent-change", onChange);
  }, []);

  // Skip marketing-pixel injection on backend routes so staff sessions in
  // /admin, /crm, /backoffice aren't tracked as marketing traffic.
  const isBackend = useIsBackend();

  useEffect(() => {
    if (consent !== "accepted" || isBackend) return;

    if (IDS.ga4) {
      injectSrc("ga4-src", `https://www.googletagmanager.com/gtag/js?id=${IDS.ga4}`);
      inject(
        "ga4-init",
        `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${IDS.ga4}',{anonymize_ip:true});`,
      );
    }
    if (IDS.gtm) {
      inject(
        "gtm-init",
        `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${IDS.gtm}');`,
      );
    }
    if (IDS.clarity) {
      inject(
        "clarity-init",
        `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${IDS.clarity}");`,
      );
    }
    if (IDS.metaPixel) {
      inject(
        "meta-pixel-init",
        `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${IDS.metaPixel}');fbq('track','PageView');`,
      );
    }
    if (IDS.linkedin) {
      inject(
        "li-init",
        `_linkedin_partner_id="${IDS.linkedin}";window._linkedin_data_partner_ids=window._linkedin_data_partner_ids||[];window._linkedin_data_partner_ids.push(_linkedin_partner_id);`,
      );
      injectSrc("li-src", "https://snap.licdn.com/li.lms-analytics/insight.min.js");
    }
  }, [consent, isBackend]);

  return null;
}
