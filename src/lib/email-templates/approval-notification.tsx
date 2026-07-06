import * as React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
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

export type ApprovalEmailKind = 'submitted' | 'approved' | 'rejected' | 'cancelled'

interface ApprovalEmailProps {
  kind?: ApprovalEmailKind
  entityTypeLabel?: string
  entityLabel?: string | null
  reason?: string | null
  requesterName?: string | null
  deciderName?: string | null
  notes?: string | null
  approvalUrl?: string
}

const HEADLINE: Record<ApprovalEmailKind, string> = {
  submitted: 'New approval request awaiting your review',
  approved: 'Approval request approved',
  rejected: 'Approval request rejected',
  cancelled: 'Approval request cancelled',
}

const PREVIEW: Record<ApprovalEmailKind, string> = {
  submitted: 'A new item needs your approval',
  approved: 'An approval request has been approved',
  rejected: 'An approval request has been rejected',
  cancelled: 'An approval request was cancelled',
}

const CTA: Record<ApprovalEmailKind, string> = {
  submitted: 'Review request',
  approved: 'Open approval',
  rejected: 'Open approval',
  cancelled: 'Open approval',
}

const rowLabel = { ...styles.footerText, color: brand.muted, margin: '0 0 2px' }
const rowValue = { ...styles.text, margin: '0 0 14px', fontWeight: 500 as const }

export const ApprovalNotificationEmail = ({
  kind = 'submitted',
  entityTypeLabel = 'Approval request',
  entityLabel,
  reason,
  requesterName,
  deciderName,
  notes,
  approvalUrl = `${brand.siteUrl}/admin/approvals`,
}: ApprovalEmailProps) => {
  const headline = HEADLINE[kind]
  return (
    <Html lang="en" dir="ltr">
      <EmailHead />
      <Preview>{PREVIEW[kind]}</Preview>
      <Body style={styles.main} className="body">
        <Container style={styles.container}>
          <BrandHeader />

          <Section style={styles.card} className="card">
            <Heading style={styles.h1} className="h1">{headline}</Heading>

            <Text style={rowLabel} className="row-label">Type</Text>
            <Text style={rowValue} className="row-value">{entityTypeLabel}</Text>

            {entityLabel ? (
              <>
                <Text style={rowLabel} className="row-label">Item</Text>
                <Text style={rowValue} className="row-value">{entityLabel}</Text>
              </>
            ) : null}

            {reason ? (
              <>
                <Text style={rowLabel} className="row-label">Reason</Text>
                <Text style={rowValue} className="row-value">{reason}</Text>
              </>
            ) : null}

            {requesterName ? (
              <>
                <Text style={rowLabel} className="row-label">Requested by</Text>
                <Text style={rowValue} className="row-value">{requesterName}</Text>
              </>
            ) : null}

            {kind !== 'submitted' && deciderName ? (
              <>
                <Text style={rowLabel} className="row-label">Decided by</Text>
                <Text style={rowValue} className="row-value">{deciderName}</Text>
              </>
            ) : null}

            {notes ? (
              <>
                <Text style={rowLabel} className="row-label">Decision notes</Text>
                <Text style={rowValue} className="row-value">{notes}</Text>
              </>
            ) : null}

            <Button style={styles.button} className="button" href={approvalUrl}>
              {CTA[kind]}
            </Button>
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

const subject = (data: Record<string, any>) => {
  const kind = (data?.kind as ApprovalEmailKind) ?? 'submitted'
  const entity = data?.entityTypeLabel ?? 'Approval request'
  const item = data?.entityLabel ? ` — ${data.entityLabel}` : ''
  switch (kind) {
    case 'approved':
      return `[Approved] ${entity}${item}`
    case 'rejected':
      return `[Rejected] ${entity}${item}`
    case 'cancelled':
      return `[Cancelled] ${entity}${item}`
    default:
      return `[Approval needed] ${entity}${item}`
  }
}

export const template = {
  component: ApprovalNotificationEmail,
  subject,
  displayName: 'Approval notification',
  previewData: {
    kind: 'submitted',
    entityTypeLabel: 'Proforma invoice',
    entityLabel: 'PRO-2026-00042 · EUR 25,000',
    reason: 'Total EUR 25000 meets approval threshold 10000',
    requesterName: 'Sara Ahmed',
    approvalUrl: 'https://www.nevoindustrial.com/admin/approvals',
  },
} satisfies TemplateEntry

export default ApprovalNotificationEmail
