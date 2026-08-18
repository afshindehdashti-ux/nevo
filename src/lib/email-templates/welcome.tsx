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

interface WelcomeEmailProps {
  fullName?: string
  role?: string
  loginUrl?: string
  invitedBy?: string
}

const roleLabel = (role?: string) => {
  if (!role) return null
  return role
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

const WelcomeEmail = ({
  fullName,
  role,
  loginUrl = `${brand.siteUrl}/admin/login`,
  invitedBy,
}: WelcomeEmailProps) => {
  const greeting = fullName ? `Welcome, ${fullName}` : 'Welcome to NEVO Industrial'
  const label = roleLabel(role)

  return (
    <Html lang="en" dir="ltr">
      <EmailHead />
      <Preview>Your NEVO Industrial account is ready</Preview>
      <Body style={styles.main} className="body">
        <Container style={styles.container}>
          <BrandHeader />

          <Section style={styles.card} className="card">
            <Heading style={styles.h1} className="h1">{greeting}</Heading>
            <Text style={styles.text} className="text">
              Your account on the {brand.name} back office has been created
              {invitedBy ? ` by ${invitedBy}` : ''}
              {label ? ` with the ${label} role` : ''}. You can now sign in
              and start collaborating with the team.
            </Text>
            <Button style={styles.button} className="button" href={loginUrl}>
              Sign in to the back office
            </Button>
            <Text style={styles.small} className="small">
              If you haven't set a password yet, use the invitation link that
              was sent separately to activate your account. Need help? Reach
              us at{' '}
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
  component: WelcomeEmail,
  subject: (data: Record<string, any>) =>
    data?.fullName
      ? `Welcome to NEVO Industrial, ${data.fullName}`
      : 'Welcome to NEVO Industrial',
  displayName: 'Welcome / New User',
  previewData: {
    fullName: 'Jane Doe',
    role: 'sales',
    invitedBy: 'Admin',
    loginUrl: 'https://nevoindustrial.com/admin/login',
  },
} satisfies TemplateEntry

export default WelcomeEmail
