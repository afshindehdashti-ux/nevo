import * as React from 'react'
import { Img, Section, Text } from '@react-email/components'
import { brand, styles } from './_shared'

// Hosted absolute URL for the NEVO logo (served from the site's CDN).
// Email clients cannot resolve Vite-bundled assets, so we point at the
// published domain's /__l5e/ asset endpoint.
export const NEVO_LOGO_URL =
  'https://www.nevoindustrial.com/__l5e/assets-v1/83decdbb-1d90-454a-9a8f-8646397e6317/nevo-logo-full.png'

const logoStyle = {
  display: 'block',
  height: '40px',
  width: 'auto',
  margin: '0 0 12px',
} as const

export const BrandHeader = () => (
  <Section style={styles.header}>
    <Img src={NEVO_LOGO_URL} alt={brand.name} height={40} style={logoStyle} />
    <Text style={styles.brandMark}>{brand.name}</Text>
    <Text style={styles.brandTagline}>{brand.tagline}</Text>
  </Section>
)

export default BrandHeader
