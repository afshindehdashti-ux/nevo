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

interface EmailChangeEmailProps {
  siteName: string
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your new NEVO Industrial email address</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <BrandHeader />

        <Section style={styles.card}>
          <Heading style={styles.h1}>Confirm your email change</Heading>
          <Text style={styles.text}>
            You requested to change the email on your NEVO Industrial account
            from{' '}
            <Link href={`mailto:${oldEmail}`} style={styles.link}>
              {oldEmail}
            </Link>{' '}
            to{' '}
            <Link href={`mailto:${newEmail}`} style={styles.link}>
              {newEmail}
            </Link>
            .
          </Text>
          <Button style={styles.button} href={confirmationUrl}>
            Confirm email change
          </Button>
          <Text style={styles.small}>
            If you didn't request this change, please contact us immediately at{' '}
            <Link href={`mailto:${brand.supportEmail}`} style={styles.link}>
              {brand.supportEmail}
            </Link>
            .
          </Text>
        </Section>

        <Section style={styles.footerWrap}>
          <Text style={styles.footerText}>
            {brand.name} — {brand.tagline}
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail
