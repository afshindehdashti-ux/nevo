import * as React from 'react'
import {
  Body,
  Container,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import { brand, styles } from './_shared'
import { EmailHead } from './EmailHead'
import { BrandHeader } from './BrandHeader'
import type { TemplateEntry } from './registry'

interface InquiryConfirmationProps {
  name?: string
  message?: string
  company?: string
  country?: string
  application?: string
  referenceId?: string
  submittedAt?: string
}

const rowStyle: React.CSSProperties = {
  padding: '8px 0',
  borderBottom: `1px solid ${brand.border}`,
  fontSize: '14px',
  color: brand.text,
  lineHeight: '1.5',
  margin: 0,
}
const labelStyle: React.CSSProperties = { color: brand.muted, marginRight: '8px' }
const quoteBox: React.CSSProperties = {
  borderLeft: `3px solid ${brand.accent}`,
  padding: '10px 14px',
  margin: '4px 0 20px',
  color: brand.text,
  fontSize: '14px',
  lineHeight: '1.6',
  backgroundColor: '#ffffff',
  borderRadius: '6px',
  border: `1px solid ${brand.border}`,
  whiteSpace: 'pre-wrap',
}

const InquiryConfirmationEmail = ({
  name,
  message,
  company,
  country,
  application,
  referenceId,
  submittedAt,
}: InquiryConfirmationProps) => {
  const greeting = name ? `Hi ${name},` : 'Hi there,'
  const submittedLabel = submittedAt
    ? new Date(submittedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
    : null
  return (
    <Html lang="en" dir="ltr">
      <EmailHead />
      <Preview>We received your project inquiry — NEVO Industrial will reply shortly</Preview>
      <Body style={styles.main} className="body">
        <Container style={styles.container}>
          <BrandHeader />
          <Section style={styles.card} className="card">
            <Heading style={styles.h1} className="h1">Thanks — your project inquiry is in</Heading>
            <Text style={styles.text} className="text">{greeting}</Text>
            <Text style={styles.text} className="text">
              We&apos;ve received your inquiry and routed it to the right specialist.
              You can expect a personal reply from our engineering or sales team within
              one business day.
            </Text>

            <Section style={{ margin: '0 0 20px' }}>
              {referenceId ? (
                <Text style={rowStyle}><span style={labelStyle}>Reference:</span><strong>{referenceId}</strong></Text>
              ) : null}
              {company ? (
                <Text style={rowStyle}><span style={labelStyle}>Company:</span>{company}</Text>
              ) : null}
              {country ? (
                <Text style={rowStyle}><span style={labelStyle}>Country:</span>{country}</Text>
              ) : null}
              {application ? (
                <Text style={rowStyle}><span style={labelStyle}>Application:</span>{application}</Text>
              ) : null}
              {submittedLabel ? (
                <Text style={rowStyle}><span style={labelStyle}>Submitted:</span>{submittedLabel}</Text>
              ) : null}
            </Section>

            {message ? (
              <>
                <Text style={{ ...styles.small, margin: '0 0 6px', fontWeight: 600 }}>Your message</Text>
                <div style={quoteBox}>{message}</div>
              </>
            ) : null}

            <Text style={styles.small} className="small">
              Need to reach us urgently? Email{' '}
              <Link href={`mailto:${brand.supportEmail}`} style={styles.link} className="link">
                {brand.supportEmail}
              </Link>{' '}and quote your reference above.
            </Text>
          </Section>

          <Section style={styles.footerWrap} className="footer-wrap">
            <Text style={styles.footerText} className="footer-text">{brand.name} — {brand.tagline}</Text>
            <Text style={styles.footerText} className="footer-text">
              <Link href={brand.siteUrl} style={styles.link} className="link">nevoindustrial.com</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: InquiryConfirmationEmail,
  subject: (data: Record<string, any>) =>
    data?.referenceId
      ? `We received your inquiry (${data.referenceId}) — NEVO Industrial`
      : 'We received your project inquiry — NEVO Industrial',
  displayName: 'Project inquiry confirmation',
  previewData: {
    name: 'Jane Doe',
    company: 'Acme Panels Ltd.',
    country: 'UAE',
    application: 'Cold storage facility',
    message: 'Looking for a turnkey PIR sandwich panel line, ~8000 m²/month.',
    referenceId: 'INQ-ABCD1234',
    submittedAt: new Date().toISOString(),
  },
} satisfies TemplateEntry

export default InquiryConfirmationEmail
