import * as React from "react";
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
} from "@react-email/components";
import { brand, styles } from "./_shared";
import { EmailHead } from "./EmailHead";
import { BrandHeader } from "./BrandHeader";

interface MagicLinkEmailProps {
  siteName: string;
  confirmationUrl: string;
}

export const MagicLinkEmail = ({ confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <EmailHead />
    <Preview>Your NEVO Industrial sign-in link</Preview>
    <Body style={styles.main} className="body">
      <Container style={styles.container}>
        <BrandHeader />

        <Section style={styles.card} className="card">
          <Heading style={styles.h1} className="h1">
            Your sign-in link
          </Heading>
          <Text style={styles.text} className="text">
            Click below to sign in to the NEVO Industrial back office. For security, this link
            expires shortly and can only be used once.
          </Text>
          <Button style={styles.button} className="button" href={confirmationUrl}>
            Sign in
          </Button>
          <Text style={styles.small} className="small">
            If you didn't request this link, you can safely ignore this email.
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
);

export default MagicLinkEmail;
