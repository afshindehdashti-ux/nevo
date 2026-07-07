import * as React from 'react'
import {
  Body,
  Button,
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

interface InquiryNotificationProps {
  name?: string
  email?: string
  phone?: string | null
  company?: string | null
  country?: string | null
  application?: string | null
  message?: string | null
  sourcePage?: string | null
  referenceId?: string
  submittedAt?: string
  adminUrl?: string
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

const InquiryNotificationEmail = ({
  name,
  email,
  phone,
  company,
  country,
  application,
  message,
  sourcePage,
  referenceId,
  submittedAt,
  adminUrl = `${brand.siteUrl}/admin/leads`,
}: InquiryNotificationProps) => {
  const submittedLabel = submittedAt
    ? new Date(submittedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
    : null
  return (
    <Html lang="en" dir="ltr">
      <EmailHead />
      <Preview>
        {`New project inquiry${company ? ' from ' + company : ''}${name ? ' — ' + name : ''}`}
      </Preview>
      <Body style={styles.main} className="body">
        <Container style={styles.container}>
          <BrandHeader />
          <Section style={styles.card} className="card">
            <Heading style={styles.h1} className="h1">New project inquiry</Heading>
            <Text style={styles.text} className="text">
              A new inquiry just landed from the website. Please review and route to
              the right owner within your target SLA.
            </Text>

            <Section style={{ margin: '0 0 20px' }}>
              {referenceId ? (
                <Text style={rowStyle}><span style={labelStyle}>Reference:</span><strong>{referenceId}</strong></Text>
              ) : null}
              {name ? (
                <Text style={rowStyle}><span style={labelStyle}>Name:</span>{name}</Text>
              ) : null}
              {email ? (
                <Text style={rowStyle}>
                  <span style={labelStyle}>Email:</span>
                  <Link href={`mailto:${email}`} style={styles.link} className="link">{email}</Link>
                </Text>
              ) : null}
              {phone ? (
                <Text style={rowStyle}><span style={labelStyle}>Phone:</span>{phone}</Text>
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
              {sourcePage ? (
                <Text style={rowStyle}><span style={labelStyle}>Source page:</span>{sourcePage}</Text>
              ) : null}
              {submittedLabel ? (
                <Text style={rowStyle}><span style={labelStyle}>Submitted:</span>{submittedLabel}</Text>
              ) : null}
            </Section>

            {message ? (
              <>
                <Text style={{ ...styles.small, margin: '0 0 6px', fontWeight: 600 }}>Customer message</Text>
                <div style={quoteBox}>{message}</div>
              </>
            ) : null}

            <Button style={styles.button} className="button" href={adminUrl}>
              Open in back office
            </Button>
          </Section>

          <Section style={styles.footerWrap} className="footer-wrap">
            <Text style={styles.footerText} className="footer-text">
              Internal notification — {brand.name}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: InquiryNotificationEmail,
  subject: (data: Record<string, any>) => {
    const who = data?.company || data?.name || 'website'
    return `New project inquiry — ${who}`
  },
  displayName: 'Project inquiry — internal notification',
  previewData: {
    name: 'Jane Doe',
    email: 'jane@acme.com',
    phone: '+971 50 000 0000',
    company: 'Acme Panels Ltd.',
    country: 'UAE',
    application: 'Cold storage facility',
    message: 'Looking for a turnkey PIR sandwich panel line, ~8000 m²/month.',
    sourcePage: '/en/project-inquiry',
    referenceId: 'INQ-ABCD1234',
    submittedAt: new Date().toISOString(),
    adminUrl: 'https://www.nevoindustrial.com/admin/leads',
  },
} satisfies TemplateEntry

export default InquiryNotificationEmail
