import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import { brand, styles } from './_shared'
import { BrandHeader } from './BrandHeader'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your NEVO Industrial verification code</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <BrandHeader />

        <Section style={styles.card}>
          <Heading style={styles.h1}>Confirm it's you</Heading>
          <Text style={styles.text}>
            Enter the verification code below to confirm your identity and
            continue the sensitive action you just started.
          </Text>
          <Text style={styles.codeBox}>{token}</Text>
          <Text style={styles.small}>
            This code expires in a few minutes. If you didn't request it, you
            can safely ignore this email.
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

export default ReauthenticationEmail
