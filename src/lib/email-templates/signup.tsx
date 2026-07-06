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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({ recipient, confirmationUrl }: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <EmailHead />
    <Preview>Confirm your email for NEVO Industrial</Preview>
    <Body style={styles.main} className="body">
      <Container style={styles.container}>
        <BrandHeader />

        <Section style={styles.card} className="card">
          <Heading style={styles.h1} className="h1">Confirm your email</Heading>
          <Text style={styles.text} className="text">
            Thanks for creating an account with {brand.name}. Please confirm{' '}
            <Link href={`mailto:${recipient}`} style={styles.link} className="link">
              {recipient}
            </Link>{' '}
            so we can activate your access.
          </Text>
          <Button style={styles.button} className="button" href={confirmationUrl}>
            Verify email
          </Button>
          <Text style={styles.small} className="small">
            If you didn't create this account, you can safely ignore this email.
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

export default SignupEmail
