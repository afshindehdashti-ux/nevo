import * as React from "react";
import {
  Body,
  Container,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { brand, styles } from "./_shared";
import { EmailHead } from "./EmailHead";
import { BrandHeader } from "./BrandHeader";
import type { TemplateEntry } from "./registry";

interface ContactConfirmationProps {
  name?: string;
  message?: string;
  submittedAt?: string;
  referenceId?: string;
}

const quoteBox = {
  borderLeft: `3px solid ${brand.accent}`,
  padding: "10px 14px",
  margin: "4px 0 20px",
  color: brand.text,
  fontSize: "14px",
  lineHeight: "1.6",
  backgroundColor: "#ffffff",
  borderRadius: "6px",
  border: `1px solid ${brand.border}`,
  whiteSpace: "pre-wrap" as const,
};

const ContactConfirmationEmail = ({
  name,
  message,
  submittedAt,
  referenceId,
}: ContactConfirmationProps) => {
  const greeting = name ? `Hi ${name},` : "Hi there,";
  const submittedLabel = submittedAt
    ? new Date(submittedAt).toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  return (
    <Html lang="en" dir="ltr">
      <EmailHead />
      <Preview>We received your message — NEVO Industrial will reply shortly</Preview>
      <Body style={styles.main} className="body">
        <Container style={styles.container}>
          <BrandHeader />

          <Section style={styles.card} className="card">
            <Heading style={styles.h1} className="h1">
              Thanks — we got your message
            </Heading>
            <Text style={styles.text} className="text">
              {greeting}
            </Text>
            <Text style={styles.text} className="text">
              This is a quick confirmation that your enquiry reached the {brand.name} team. One of
              our engineers or account managers will get back to you within one business day.
            </Text>

            {message ? (
              <>
                <Text style={{ ...styles.small, margin: "0 0 6px", fontWeight: 600 }}>
                  Your message
                </Text>
                <div style={quoteBox}>{message}</div>
              </>
            ) : null}

            {(submittedLabel || referenceId) && (
              <Text style={styles.small} className="small">
                {referenceId ? (
                  <>
                    Reference: <strong>{referenceId}</strong>
                    <br />
                  </>
                ) : null}
                {submittedLabel ? <>Submitted: {submittedLabel}</> : null}
              </Text>
            )}

            <Text style={styles.small} className="small">
              Need to reach us urgently? Email{" "}
              <Link href={`mailto:${brand.supportEmail}`} style={styles.link} className="link">
                {brand.supportEmail}
              </Link>{" "}
              and we'll prioritise your enquiry.
            </Text>
          </Section>

          <Section style={styles.footerWrap} className="footer-wrap">
            <Text style={styles.footerText} className="footer-text">
              {brand.name} — {brand.tagline}
            </Text>
            <Text style={styles.footerText} className="footer-text">
              <Link href={brand.siteUrl} style={styles.link} className="link">
                nevoindustrial.com
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export const template = {
  component: ContactConfirmationEmail,
  subject: "We received your message — NEVO Industrial",
  displayName: "Contact form confirmation",
  previewData: {
    name: "Jane Doe",
    message: "Interested in a quote for 8,000 m² of PIR sandwich panels.",
    submittedAt: new Date().toISOString(),
    referenceId: "INQ-XXXX",
  },
} satisfies TemplateEntry;

export default ContactConfirmationEmail;
