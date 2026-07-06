import * as React from 'react'
import { Img, Section, Text } from '@react-email/components'
import { brand, styles } from './_shared'

// Hosted absolute URLs for the NEVO logo (served from the site's CDN).
// Email clients cannot resolve Vite-bundled assets, so we point at the
// published domain's /__l5e/ asset endpoint.
export const NEVO_LOGO_URL =
  'https://www.nevoindustrial.com/__l5e/assets-v1/83decdbb-1d90-454a-9a8f-8646397e6317/nevo-logo-full.png'

// White wordmark used in dark-mode email clients (swapped via CSS below).
export const NEVO_LOGO_URL_DARK =
  'https://www.nevoindustrial.com/__l5e/assets-v1/9bf9fd57-e679-4467-81ff-f4ae246e8d1d/nevo-logo-white.png'

const logoStyleLight = {
  display: 'block',
  height: '40px',
  width: 'auto',
  margin: '0 0 12px',
} as const

// Hidden by default; the dark-mode media query below unhides it and hides
// the light-mode logo. Uses MSO-safe display:none fallback.
const logoStyleDark = {
  ...logoStyleLight,
  display: 'none',
} as const

export const BrandHeader = () => (
  <Section style={styles.header}>
    <Img
      src={NEVO_LOGO_URL}
      alt={brand.name}
      height={40}
      className="nevo-logo-light"
      style={logoStyleLight}
    />
    <Img
      src={NEVO_LOGO_URL_DARK}
      alt={brand.name}
      height={40}
      className="nevo-logo-dark"
      style={logoStyleDark}
    />
    <Text style={styles.brandMark} className="nevo-brand-mark">
      {brand.name}
    </Text>
    <Text style={styles.brandTagline} className="nevo-brand-tagline">
      {brand.tagline}
    </Text>
  </Section>
)

export default BrandHeader
