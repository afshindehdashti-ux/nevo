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

interface InvoiceShareProps {
  customerName?: string
  invoiceNumber?: string
  invoiceKind?: 'proforma' | 'commercial'
  currency?: string
  total?: number | string
  issueDate?: string
  dueDate?: string | null
  downloadUrl: string
  expiresInHours?: number
  message?: string | null
  senderName?: string | null
}

const formatAmount = (value?: number | string, currency = 'USD') => {
  if (value === undefined || value === null || value === '') return null
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num)) return null
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(num)
  } catch {
    return `${currency} ${num.toFixed(2)}`
  }
}

const InvoiceShareEmail = ({
  customerName,
  invoiceNumber,
  invoiceKind = 'proforma',
  currency = 'USD',
  total,
  issueDate,
  dueDate,
  downloadUrl,
  expiresInHours = 168,
  message,
  senderName,
}: InvoiceShareProps) => {
  const greeting = customerName ? `Hi ${customerName},` : 'Hello,'
  const amount = formatAmount(total, currency)
  const docLabel = invoiceKind === 'commercial' ? 'invoice' : 'proforma invoice'
  const docTitle = invoiceKind === 'commercial' ? 'Invoice' : 'Proforma Invoice'

  const rowStyle: React.CSSProperties = {
    padding: '10px 0',
    borderBottom: `1px solid ${brand.border}`,
    fontSize: '14px',
    color: brand.text,
    lineHeight: '1.5',
    margin: 0,
  }
  const labelStyle: React.CSSProperties = { color: brand.muted, marginRight: '8px' }

  return (
    <Html lang="en" dir="ltr">
      <EmailHead />
      <Preview>
        {invoiceNumber ? `${docTitle} ${invoiceNumber}` : `Your ${docLabel} is ready`}
      </Preview>
      <Body style={styles.main} className="body">
        <Container style={styles.container}>
          <BrandHeader />

          <Section style={styles.card} className="card">
            <Heading style={styles.h1} className="h1">
              {invoiceNumber
                ? `${docTitle} ${invoiceNumber}`
                : `Your ${docLabel} is ready`}
            </Heading>
            <Text style={styles.text} className="text">
              {greeting} please find your {docLabel} attached via the secure
              download link below.
            </Text>

            {message ? (
              <Text style={{ ...styles.text, whiteSpace: 'pre-wrap' }}>
                {message}
              </Text>
            ) : null}

            <Section style={{ margin: '0 0 20px' }}>
              {invoiceNumber ? (
                <Text style={rowStyle}>
                  <span style={labelStyle}>Number:</span>
                  <strong>{invoiceNumber}</strong>
                </Text>
              ) : null}
              {issueDate ? (
                <Text style={rowStyle}>
                  <span style={labelStyle}>Issue date:</span>
                  {issueDate}
                </Text>
              ) : null}
              {dueDate ? (
                <Text style={rowStyle}>
                  <span style={labelStyle}>Due date:</span>
                  {dueDate}
                </Text>
              ) : null}
              {amount ? (
                <Text style={rowStyle}>
                  <span style={labelStyle}>Total:</span>
                  <strong>{amount}</strong>
                </Text>
              ) : null}
            </Section>

            <Button style={styles.button} className="button" href={downloadUrl}>
              Download PDF
            </Button>

            <Text style={styles.small} className="small">
              This secure download link expires in about {expiresInHours} hours.
              If it stops working, reply to this email and we will re-send it.
            </Text>

            <Text style={styles.small} className="small">
              Questions? Reply to this email
              {senderName ? ` — ${senderName}` : ''} or reach us at{' '}
              <Link href={`mailto:${brand.supportEmail}`} style={styles.link} className="link">
                {brand.supportEmail}
              </Link>
              .
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
  )
}

export const template = {
  component: InvoiceShareEmail,
  subject: (data: Record<string, any>) => {
    const kind = data?.invoiceKind === 'commercial' ? 'Invoice' : 'Proforma Invoice'
    return data?.invoiceNumber
      ? `${kind} ${data.invoiceNumber} — NEVO Industrial`
      : `${kind} from NEVO Industrial`
  },
  displayName: 'Invoice / Proforma Share',
  previewData: {
    customerName: 'Jane Doe',
    invoiceNumber: 'PRO-2026-00021',
    invoiceKind: 'proforma',
    currency: 'USD',
    total: 12500,
    issueDate: '2026-07-07',
    dueDate: '2026-07-21',
    downloadUrl: 'https://www.nevoindustrial.com/download/example',
    expiresInHours: 168,
    senderName: 'Sales Team',
  },
} satisfies TemplateEntry

export default InvoiceShareEmail
