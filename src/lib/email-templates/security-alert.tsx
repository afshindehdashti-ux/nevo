import * as React from "react";
import { Body, Container, Heading, Html, Preview, Section, Text } from "@react-email/components";
import { brand, styles } from "./_shared";
import { EmailHead } from "./EmailHead";
import { BrandHeader } from "./BrandHeader";
import type { TemplateEntry } from "./registry";

export type SecurityAlertKind = "failed_sign_ins" | "new_country_sign_in" | "approval_rejected";

interface SecurityAlertProps {
  kind: SecurityAlertKind;
  headline: string;
  summary: string;
  details?: Array<{ label: string; value: string }>;
  occurredAt?: string;
}

const KIND_LABEL: Record<SecurityAlertKind, string> = {
  failed_sign_ins: "Repeated failed sign-in attempts",
  new_country_sign_in: "Sign-in from a new country",
  approval_rejected: "Approval request rejected",
};

const rowStyle: React.CSSProperties = {
  padding: "8px 0",
  borderBottom: `1px solid ${brand.border}`,
  fontSize: "14px",
  color: brand.text,
  lineHeight: "1.5",
  margin: 0,
};
const labelStyle: React.CSSProperties = { color: brand.muted, marginRight: "8px" };
const bannerStyle: React.CSSProperties = {
  borderLeft: `3px solid #dc2626`,
  padding: "10px 14px",
  margin: "0 0 20px",
  color: brand.text,
  fontSize: "13px",
  lineHeight: "1.6",
  backgroundColor: "#fff5f5",
  borderRadius: "6px",
  border: `1px solid #fecaca`,
};

const SecurityAlert = ({ kind, headline, summary, details, occurredAt }: SecurityAlertProps) => {
  const when = occurredAt
    ? new Date(occurredAt).toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;
  return (
    <Html lang="en" dir="ltr">
      <EmailHead />
      <Preview>{`Security alert — ${headline}`}</Preview>
      <Body style={styles.main} className="body">
        <Container style={styles.container}>
          <BrandHeader />
          <Section style={styles.card} className="card">
            <Heading style={styles.h1} className="h1">
              Security alert
            </Heading>
            <div style={bannerStyle}>
              <strong>{KIND_LABEL[kind]}</strong>
              <div style={{ marginTop: 4 }}>{headline}</div>
            </div>
            <Text style={styles.text} className="text">
              {summary}
            </Text>

            {details && details.length > 0 ? (
              <Section style={{ margin: "0 0 20px" }}>
                {details.map((d) => (
                  <Text key={d.label} style={rowStyle}>
                    <span style={labelStyle}>{d.label}:</span>
                    {d.value}
                  </Text>
                ))}
              </Section>
            ) : null}

            {when ? (
              <Text style={{ ...styles.small, marginTop: "10px" }}>Detected: {when}</Text>
            ) : null}

            <Text style={{ ...styles.small, marginTop: "18px" }}>
              This is an automated alert. Investigate in the admin Security Audit view.
            </Text>
          </Section>

          <Section style={styles.footerWrap} className="footer-wrap">
            <Text style={styles.footerText} className="footer-text">
              Automated security alert — {brand.name}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: SecurityAlert,
  subject: (data: Record<string, any>) => {
    const kind = (data?.kind ?? "failed_sign_ins") as SecurityAlertKind;
    return `[Security] ${KIND_LABEL[kind] ?? "Security event"}`;
  },
  displayName: "Security alert",
  to: "info@nevoindustrial.com",
  previewData: {
    kind: "failed_sign_ins",
    headline: "5 failed sign-in attempts for admin@nevoindustrial.com in 10 minutes",
    summary:
      "Multiple failed sign-in attempts were detected for the same email address within a short window. Review recent activity and consider forcing a password reset if this account is not expected to be under active use.",
    details: [
      { label: "Email", value: "admin@nevoindustrial.com" },
      { label: "Failures (10 min)", value: "5" },
      { label: "Latest IP", value: "203.0.113.42" },
    ],
    occurredAt: new Date().toISOString(),
  },
} satisfies TemplateEntry;

export default SecurityAlert;
