import * as React from 'react'
import {
  Body,
  Container,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import { brand, styles } from './_shared'
import { EmailHead } from './EmailHead'
import { BrandHeader } from './BrandHeader'
import type { TemplateEntry } from './registry'

interface EmailDlqAlertProps {
  messageId?: string
  templateName?: string
  recipientEmail?: string
  errorMessage?: string | null
  failedAt?: string
  metadata?: Record<string, unknown> | null
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
const errorBox: React.CSSProperties = {
  borderLeft: `3px solid #dc2626`,
  padding: '10px 14px',
  margin: '4px 0 20px',
  color: brand.text,
  fontSize: '13px',
  lineHeight: '1.6',
  backgroundColor: '#fff5f5',
  borderRadius: '6px',
  border: `1px solid #fecaca`,
  whiteSpace: 'pre-wrap',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  wordBreak: 'break-word',
}

const EmailDlqAlert = ({
  messageId,
  templateName,
  recipientEmail,
  errorMessage,
  failedAt,
  metadata,
}: EmailDlqAlertProps) => {
  const failedLabel = failedAt
    ? new Date(failedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
    : null
  let metadataJson: string | null = null
  if (metadata && Object.keys(metadata).length) {
    try {
      metadataJson = JSON.stringify(metadata, null, 2)
    } catch {
      metadataJson = null
    }
  }
  return (
    <Html lang="en" dir="ltr">
      <EmailHead />
      <Preview>
        {`Email delivery failed — ${templateName ?? 'unknown template'}`}
      </Preview>
      <Body style={styles.main} className="body">
        <Container style={styles.container}>
          <BrandHeader />
          <Section style={styles.card} className="card">
            <Heading style={styles.h1} className="h1">Email delivery failed</Heading>
            <Text style={styles.text} className="text">
              A queued email exhausted all retries and was moved to the dead-letter
              queue. It will not be redelivered automatically. Please review and
              take action if the recipient still needs to hear from us.
            </Text>

            <Section style={{ margin: '0 0 20px' }}>
              {templateName ? (
                <Text style={rowStyle}>
                  <span style={labelStyle}>Template:</span>
                  <strong>{templateName}</strong>
                </Text>
              ) : null}
              {recipientEmail ? (
                <Text style={rowStyle}>
                  <span style={labelStyle}>Recipient:</span>
                  {recipientEmail}
                </Text>
              ) : null}
              {messageId ? (
                <Text style={rowStyle}>
                  <span style={labelStyle}>Message ID:</span>
                  <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                    {messageId}
                  </span>
                </Text>
              ) : null}
              {failedLabel ? (
                <Text style={rowStyle}>
                  <span style={labelStyle}>Failed at:</span>
                  {failedLabel}
                </Text>
              ) : null}
            </Section>

            {errorMessage ? (
              <>
                <Text style={{ ...styles.small, margin: '0 0 6px', fontWeight: 600 }}>
                  Error
                </Text>
                <div style={errorBox}>{errorMessage}</div>
              </>
            ) : null}

            {metadataJson ? (
              <>
                <Text style={{ ...styles.small, margin: '0 0 6px', fontWeight: 600 }}>
                  Metadata
                </Text>
                <div style={errorBox}>{metadataJson}</div>
              </>
            ) : null}

            <Text style={{ ...styles.small, marginTop: '18px' }}>
              This is an automated alert. Investigate in Cloud → Emails, then
              inspect the email_send_log row for full context.
            </Text>
          </Section>

          <Section style={styles.footerWrap} className="footer-wrap">
            <Text style={styles.footerText} className="footer-text">
              Automated backend alert — {brand.name}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: EmailDlqAlert,
  subject: (data: Record<string, any>) => {
    const tpl = data?.templateName ?? 'unknown template'
    return `[Alert] Email delivery failed — ${tpl}`
  },
  displayName: 'Backend alert — email delivery failed',
  to: 'info@nevoindustrial.com',
  previewData: {
    messageId: 'inquiry-notify-11111111-2222-3333-4444-555555555555',
    templateName: 'inquiry-notification',
    recipientEmail: 'info@nevoindustrial.com',
    errorMessage: 'HTTP 502 from upstream after 5 attempts',
    failedAt: new Date().toISOString(),
    metadata: { attempts: 5, last_status: 502 },
  },
} satisfies TemplateEntry

export default EmailDlqAlert
