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

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu código de verificação ShopBox</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brandText}>ShopBox</Text>
        </Section>
        <Heading style={h1}>Confirme sua identidade</Heading>
        <Text style={text}>Use o código abaixo para confirmar sua identidade:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          Este código expira em poucos minutos. Se você não solicitou isso,
          pode ignorar este e-mail.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Geist, Arial, sans-serif' }
const container = { padding: '32px 24px', maxWidth: '560px', margin: '0 auto' }
const brandBar = { paddingBottom: '24px', borderBottom: '1px solid #e5e7eb', marginBottom: '32px' }
const brandText = { fontSize: '20px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0', letterSpacing: '-0.02em' }
const h1 = { fontSize: '26px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0 0 20px', letterSpacing: '-0.01em' }
const text = { fontSize: '15px', color: '#374151', lineHeight: '1.6', margin: '0 0 24px' }
const codeStyle = {
  fontFamily: 'Geist Mono, Courier, monospace',
  fontSize: '32px',
  fontWeight: 'bold' as const,
  color: '#1a1a1a',
  margin: '0 0 30px',
  letterSpacing: '0.2em',
  backgroundColor: '#f7f8fa',
  padding: '16px 24px',
  borderRadius: '8px',
  textAlign: 'center' as const,
}
const footer = { fontSize: '12px', color: '#9ca3af', margin: '40px 0 0', borderTop: '1px solid #e5e7eb', paddingTop: '20px', lineHeight: '1.6' }
