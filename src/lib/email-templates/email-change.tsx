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
    <EmailHead />
    <Preview>Confirm your new NEVO Industrial email address</Preview>
    <Body style={styles.main} className="body">
      <Container style={styles.container}>
        <BrandHeader />

        <Section style={styles.card} className="card">
          <Heading style={styles.h1} className="h1">Confirm your email change</Heading>
          <Text style={styles.text} className="text">
            You requested to change the email on your NEVO Industrial account
            from{' '}
            <Link href={`mailto:${oldEmail}`} style={styles.link} className="link">
              {oldEmail}
            </Link>{' '}
            to{' '}
            <Link href={`mailto:${newEmail}`} style={styles.link} className="link">
              {newEmail}
            </Link>
            .
          </Text>
          <Button style={styles.button} className="button" href={confirmationUrl}>
            Confirm email change
          </Button>
          <Text style={styles.small} className="small">
            If you didn't request this change, please contact us immediately at{' '}
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
        </Section>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail
