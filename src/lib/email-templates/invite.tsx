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

interface InviteEmailProps {
  siteName: string;
  siteUrl: string;
  confirmationUrl: string;
}

export const InviteEmail = ({ confirmationUrl }: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <EmailHead />
    <Preview>You've been invited to the NEVO Industrial back office</Preview>
    <Body style={styles.main} className="body">
      <Container style={styles.container}>
        <BrandHeader />

        <Section style={styles.card} className="card">
          <Heading style={styles.h1} className="h1">
            You're invited to the team
          </Heading>
          <Text style={styles.text} className="text">
            A NEVO Industrial administrator has invited you to join the internal back office. Accept
            the invitation below to set your password and get started.
          </Text>
          <Button style={styles.button} className="button" href={confirmationUrl}>
            Accept invitation
          </Button>
          <Text style={styles.small} className="small">
            This invitation link is single-use and expires shortly. If you weren't expecting it, you
            can safely ignore this email.
          </Text>
        </Section>

        <Section style={styles.footerWrap} className="footer-wrap">
          <Text style={styles.footerText} className="footer-text">
            {brand.name} — {brand.tagline}
          </Text>
          <Text style={styles.footerText} className="footer-text">
            Questions?{" "}
            <Link href={`mailto:${brand.supportEmail}`} style={styles.link} className="link">
              {brand.supportEmail}
            </Link>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default InviteEmail;
