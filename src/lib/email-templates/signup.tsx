import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme seu e-mail para começar a usar o {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brandText}>ShopBox</Text>
        </Section>
        <Heading style={h1}>Bem-vindo ao {siteName}!</Heading>
        <Text style={text}>
          Falta só um passo para você criar a sua loja online com checkout via WhatsApp.
          Confirme o e-mail{' '}
          <Link href={`mailto:${recipient}`} style={link}>{recipient}</Link>{' '}
          clicando no botão abaixo:
        </Text>
        <Section style={buttonWrapper}>
          <Button style={button} href={confirmationUrl}>
            Confirmar meu e-mail
          </Button>
        </Section>
        <Text style={textSmall}>
          Se o botão não funcionar, copie e cole este link no navegador:
          <br />
          <Link href={confirmationUrl} style={linkBreak}>{confirmationUrl}</Link>
        </Text>
        <Text style={footer}>
          Se você não criou uma conta no {siteName}, pode ignorar este e-mail.
          <br />
          <Link href={siteUrl} style={footerLink}>shopbox.lovable.app</Link>
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Geist, Arial, sans-serif' }
const container = { padding: '32px 24px', maxWidth: '560px', margin: '0 auto' }
const brandBar = { paddingBottom: '24px', borderBottom: '1px solid #e5e7eb', marginBottom: '32px' }
const brandText = { fontSize: '20px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0', letterSpacing: '-0.02em' }
const h1 = { fontSize: '26px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0 0 20px', letterSpacing: '-0.01em' }
const text = { fontSize: '15px', color: '#374151', lineHeight: '1.6', margin: '0 0 24px' }
const textSmall = { fontSize: '13px', color: '#6b7280', lineHeight: '1.6', margin: '24px 0 0' }
const link = { color: '#1a1a1a', textDecoration: 'underline' }
const linkBreak = { color: '#25D366', textDecoration: 'underline', wordBreak: 'break-all' as const }
const buttonWrapper = { margin: '8px 0 8px' }
const button = { backgroundColor: '#25D366', color: '#ffffff', fontSize: '15px', fontWeight: '600' as const, borderRadius: '8px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '12px', color: '#9ca3af', margin: '40px 0 0', borderTop: '1px solid #e5e7eb', paddingTop: '20px', lineHeight: '1.6' }
const footerLink = { color: '#9ca3af', textDecoration: 'underline' }
