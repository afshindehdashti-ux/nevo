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

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your NEVO Industrial sign-in link</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Text style={styles.brandMark}>{brand.name}</Text>
          <Text style={styles.brandTagline}>{brand.tagline}</Text>
        </Section>

        <Section style={styles.card}>
          <Heading style={styles.h1}>Your sign-in link</Heading>
          <Text style={styles.text}>
            Click below to sign in to the NEVO Industrial back office. For
            security, this link expires shortly and can only be used once.
          </Text>
          <Button style={styles.button} href={confirmationUrl}>
            Sign in
          </Button>
          <Text style={styles.small}>
            If you didn't request this link, you can safely ignore this email.
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

export default MagicLinkEmail
