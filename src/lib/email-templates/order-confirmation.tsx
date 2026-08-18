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

interface OrderConfirmationProps {
  customerName?: string
  orderNumber?: string
  orderDate?: string
  currency?: string
  total?: number | string
  requestedDelivery?: string | null
  notes?: string | null
  portalUrl?: string
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

const OrderConfirmationEmail = ({
  customerName,
  orderNumber,
  orderDate,
  currency = 'USD',
  total,
  requestedDelivery,
  notes,
  portalUrl = `${brand.siteUrl}/portal`,
}: OrderConfirmationProps) => {
  const greeting = customerName ? `Hi ${customerName},` : 'Hello,'
  const amount = formatAmount(total, currency)

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
        {orderNumber ? `Order ${orderNumber} received` : 'We received your order'}
      </Preview>
      <Body style={styles.main} className="body">
        <Container style={styles.container}>
          <BrandHeader />

          <Section style={styles.card} className="card">
            <Heading style={styles.h1} className="h1">
              {orderNumber ? `Order ${orderNumber} received` : 'Your order has been received'}
            </Heading>
            <Text style={styles.text} className="text">
              {greeting} thank you for your order. Our team has recorded your
              request and will be in touch shortly with next steps and
              production timeline.
            </Text>

            <Section style={{ margin: '0 0 20px' }}>
              {orderNumber ? (
                <Text style={rowStyle}>
                  <span style={labelStyle}>Order number:</span>
                  <strong>{orderNumber}</strong>
                </Text>
              ) : null}
              {orderDate ? (
                <Text style={rowStyle}>
                  <span style={labelStyle}>Order date:</span>
                  {orderDate}
                </Text>
              ) : null}
              {requestedDelivery ? (
                <Text style={rowStyle}>
                  <span style={labelStyle}>Requested delivery:</span>
                  {requestedDelivery}
                </Text>
              ) : null}
              {amount ? (
                <Text style={rowStyle}>
                  <span style={labelStyle}>Total:</span>
                  <strong>{amount}</strong>
                </Text>
              ) : null}
              {notes ? (
                <Text style={rowStyle}>
                  <span style={labelStyle}>Notes:</span>
                  {notes}
                </Text>
              ) : null}
            </Section>

            <Button style={styles.button} className="button" href={portalUrl}>
              View in customer portal
            </Button>

            <Text style={styles.small} className="small">
              Questions about this order? Reply to this email or reach us at{' '}
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
  component: OrderConfirmationEmail,
  subject: (data: Record<string, any>) =>
    data?.orderNumber
      ? `Order ${data.orderNumber} received — NEVO Industrial`
      : 'Your order has been received — NEVO Industrial',
  displayName: 'Order Confirmation',
  previewData: {
    customerName: 'Jane Doe',
    orderNumber: 'ORD-2026-000123',
    orderDate: '2026-07-07',
    currency: 'USD',
    total: 12500,
    requestedDelivery: '2026-08-15',
    notes: '2 x insulated panel line',
    portalUrl: 'https://nevoindustrial.com/portal',
  },
} satisfies TemplateEntry

export default OrderConfirmationEmail
