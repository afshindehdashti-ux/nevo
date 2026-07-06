// Shared branding tokens for NEVO Industrial auth emails.
// Email body background MUST stay #ffffff (email client dark-mode safety).

export const brand = {
  name: 'NEVO Industrial',
  tagline: 'Sandwich Panel & Turnkey Factory Solutions',
  siteUrl: 'https://www.nevoindustrial.com',
  supportEmail: 'info@nevoindustrial.com',
  primary: '#0F172A', // charcoal / near-black
  accent: '#059669', // emerald 600 — matches --accent
  accentSoft: '#ECFDF5',
  text: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
  bgSoft: '#F8FAFC',
} as const

export const styles = {
  main: {
    backgroundColor: '#ffffff',
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
    margin: 0,
    padding: '32px 0',
  },
  container: {
    maxWidth: '560px',
    margin: '0 auto',
    padding: '0 24px',
  },
  header: {
    borderBottom: `1px solid ${brand.border}`,
    paddingBottom: '20px',
    marginBottom: '28px',
  },
  brandMark: {
    fontSize: '13px',
    fontWeight: 700 as const,
    letterSpacing: '0.14em',
    color: brand.primary,
    textTransform: 'uppercase' as const,
    margin: 0,
  },
  brandTagline: {
    fontSize: '12px',
    color: brand.muted,
    margin: '4px 0 0',
  },
  card: {
    border: `1px solid ${brand.border}`,
    borderRadius: '12px',
    padding: '32px 28px',
    backgroundColor: brand.bgSoft,
  },
  h1: {
    fontSize: '22px',
    fontWeight: 700 as const,
    color: brand.text,
    margin: '0 0 16px',
    lineHeight: '1.3',
  },
  text: {
    fontSize: '15px',
    color: brand.text,
    lineHeight: '1.6',
    margin: '0 0 20px',
  },
  small: {
    fontSize: '13px',
    color: brand.muted,
    lineHeight: '1.5',
    margin: '20px 0 0',
  },
  link: { color: brand.accent, textDecoration: 'underline' },
  button: {
    backgroundColor: brand.primary,
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 600 as const,
    borderRadius: '8px',
    padding: '13px 24px',
    textDecoration: 'none',
    display: 'inline-block',
  },
  codeBox: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    fontSize: '28px',
    fontWeight: 700 as const,
    color: brand.primary,
    letterSpacing: '0.35em',
    padding: '16px 20px',
    backgroundColor: '#ffffff',
    border: `1px solid ${brand.border}`,
    borderRadius: '8px',
    textAlign: 'center' as const,
    margin: '0 0 24px',
  },
  footerWrap: {
    marginTop: '32px',
    paddingTop: '20px',
    borderTop: `1px solid ${brand.border}`,
  },
  footerText: {
    fontSize: '12px',
    color: brand.muted,
    lineHeight: '1.5',
    margin: '0 0 6px',
  },
} as const
