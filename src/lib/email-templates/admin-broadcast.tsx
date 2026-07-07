import * as React from 'react'
import {
  Body,
  Container,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import { brand, styles } from './_shared'
import { EmailHead } from './EmailHead'
import { BrandHeader } from './BrandHeader'
import type { TemplateEntry } from './registry'

interface AdminBroadcastProps {
  subject?: string
  greeting?: string | null
  body?: string
  signature?: string | null
}

const bodyText = { ...styles.text, whiteSpace: 'pre-wrap' as const }

export const AdminBroadcastEmail = ({
  subject = 'A message from NEVO Industrial',
  greeting,
  body = '',
  signature,
}: AdminBroadcastProps) => (
  <Html lang="en" dir="ltr">
    <EmailHead />
    <Preview>{subject}</Preview>
    <Body style={styles.main} className="body">
      <Container style={styles.container}>
        <BrandHeader />
        <Section style={styles.card} className="card">
          <Heading style={styles.h1} className="h1">{subject}</Heading>
          {greeting ? <Text style={styles.text}>{greeting}</Text> : null}
          {body.split(/\n{2,}/).map((para, i) => (
            <Text key={i} style={bodyText}>{para}</Text>
          ))}
          {signature ? <Text style={styles.small}>{signature}</Text> : (
            <Text style={styles.small}>— {brand.name}</Text>
          )}
        </Section>
      </Container>
    </Body>
  </Html>
)

const subject = (data: Record<string, any>) =>
  (data?.subject as string) || 'A message from NEVO Industrial'

export const template = {
  component: AdminBroadcastEmail,
  subject,
  displayName: 'Admin broadcast (custom message)',
  previewData: {
    subject: 'Update on your recent inquiry',
    greeting: 'Hi Sara,',
    body: 'Thanks for reaching out to NEVO Industrial. We reviewed your inquiry and would like to schedule a call this week.\n\nCould you share two time slots that work for you?',
    signature: '— Afshin Dehdashti\nNEVO Industrial',
  },
} satisfies TemplateEntry

export default AdminBroadcastEmail
