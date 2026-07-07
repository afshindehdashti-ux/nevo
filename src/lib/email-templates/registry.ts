import type { ComponentType } from 'react'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

/**
 * Template registry — maps template names to their React Email components.
 * Import and register new templates here after creating them in this directory.
 *
 * Example:
 *   import { template as welcomeTemplate } from './welcome'
 *   // then add to TEMPLATES: 'welcome': welcomeTemplate
 */
import { template as welcomeTemplate } from './welcome'
import { template as contactConfirmationTemplate } from './contact-confirmation'
import { template as orderConfirmationTemplate } from './order-confirmation'
import { template as inquiryConfirmationTemplate } from './inquiry-confirmation'
import { template as inquiryNotificationTemplate } from './inquiry-notification'
import { template as emailDlqAlertTemplate } from './email-dlq-alert'
import { template as securityAlertTemplate } from './security-alert'
import { template as invoiceShareTemplate } from './invoice-share'

export const TEMPLATES: Record<string, TemplateEntry> = {
  welcome: welcomeTemplate,
  'contact-confirmation': contactConfirmationTemplate,
  'order-confirmation': orderConfirmationTemplate,
  'inquiry-confirmation': inquiryConfirmationTemplate,
  'inquiry-notification': inquiryNotificationTemplate,
  'email-dlq-alert': emailDlqAlertTemplate,
  'security-alert': securityAlertTemplate,
  'invoice-share': invoiceShareTemplate,
}
