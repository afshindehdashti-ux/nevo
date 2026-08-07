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

interface RecoveryEmailProps {
  siteName: string;
  confirmationUrl: string;
}

export const RecoveryEmail = ({ confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <EmailHead />
    <Preview>Reset your NEVO Industrial password</Preview>
    <Body style={styles.main} className="body">
      <Container style={styles.container}>
        <BrandHeader />

        <Section style={styles.card} className="card">
          <Heading style={styles.h1} className="h1">
            Reset your password
          </Heading>
          <Text style={styles.text} className="text">
            We received a request to reset the password for your NEVO Industrial account. Click the
            button below to choose a new one.
          </Text>
          <Button style={styles.button} className="button" href={confirmationUrl}>
            Reset password
          </Button>
          <Text style={styles.small} className="small">
            This link expires shortly and can only be used once. If you didn't request a reset, you
            can safely ignore this email — your password will stay the same.
          </Text>
        </Section>

        <Section style={styles.footerWrap} className="footer-wrap">
          <Text style={styles.footerText} className="footer-text">
            {brand.name} — {brand.tagline}
          </Text>
          <Text style={styles.footerText} className="footer-text">
            Need help?{" "}
            <Link href={`mailto:${brand.supportEmail}`} style={styles.link} className="link">
              {brand.supportEmail}
            </Link>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default RecoveryEmail;
