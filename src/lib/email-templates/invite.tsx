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

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ confirmationUrl }: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to the NEVO Industrial back office</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Text style={styles.brandMark}>{brand.name}</Text>
          <Text style={styles.brandTagline}>{brand.tagline}</Text>
        </Section>

        <Section style={styles.card}>
          <Heading style={styles.h1}>You're invited to the team</Heading>
          <Text style={styles.text}>
            A NEVO Industrial administrator has invited you to join the internal
            back office. Accept the invitation below to set your password and
            get started.
          </Text>
          <Button style={styles.button} href={confirmationUrl}>
            Accept invitation
          </Button>
          <Text style={styles.small}>
            This invitation link is single-use and expires shortly. If you
            weren't expecting it, you can safely ignore this email.
          </Text>
        </Section>

        <Section style={styles.footerWrap}>
          <Text style={styles.footerText}>
            {brand.name} — {brand.tagline}
          </Text>
          <Text style={styles.footerText}>
            Questions?{' '}
            <Link href={`mailto:${brand.supportEmail}`} style={styles.link}>
              {brand.supportEmail}
            </Link>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail
