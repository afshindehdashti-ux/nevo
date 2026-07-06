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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({ recipient, confirmationUrl }: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email for NEVO Industrial</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Text style={styles.brandMark}>{brand.name}</Text>
          <Text style={styles.brandTagline}>{brand.tagline}</Text>
        </Section>

        <Section style={styles.card}>
          <Heading style={styles.h1}>Confirm your email</Heading>
          <Text style={styles.text}>
            Thanks for creating an account with {brand.name}. Please confirm{' '}
            <Link href={`mailto:${recipient}`} style={styles.link}>
              {recipient}
            </Link>{' '}
            so we can activate your access.
          </Text>
          <Button style={styles.button} href={confirmationUrl}>
            Verify email
          </Button>
          <Text style={styles.small}>
            If you didn't create this account, you can safely ignore this email.
          </Text>
        </Section>

        <Section style={styles.footerWrap}>
          <Text style={styles.footerText}>
            {brand.name} — {brand.tagline}
          </Text>
          <Text style={styles.footerText}>
            <Link href={brand.siteUrl} style={styles.link}>
              nevoindustrial.com
            </Link>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail
