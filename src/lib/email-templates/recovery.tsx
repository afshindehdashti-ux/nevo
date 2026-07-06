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
import { BrandHeader } from './BrandHeader'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your NEVO Industrial password</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Text style={styles.brandMark}>{brand.name}</Text>
          <Text style={styles.brandTagline}>{brand.tagline}</Text>
        </Section>

        <Section style={styles.card}>
          <Heading style={styles.h1}>Reset your password</Heading>
          <Text style={styles.text}>
            We received a request to reset the password for your NEVO Industrial
            account. Click the button below to choose a new one.
          </Text>
          <Button style={styles.button} href={confirmationUrl}>
            Reset password
          </Button>
          <Text style={styles.small}>
            This link expires shortly and can only be used once. If you didn't
            request a reset, you can safely ignore this email — your password
            will stay the same.
          </Text>
        </Section>

        <Section style={styles.footerWrap}>
          <Text style={styles.footerText}>
            {brand.name} — {brand.tagline}
          </Text>
          <Text style={styles.footerText}>
            Need help?{' '}
            <Link href={`mailto:${brand.supportEmail}`} style={styles.link}>
              {brand.supportEmail}
            </Link>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail
