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

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Você foi convidado para o {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brandText}>ShopBox</Text>
        </Section>
        <Heading style={h1}>Você foi convidado!</Heading>
        <Text style={text}>
          Você recebeu um convite para se juntar ao{' '}
          <Link href={siteUrl} style={link}><strong>{siteName}</strong></Link>.
          Clique no botão abaixo para aceitar e criar sua conta.
        </Text>
        <Section style={buttonWrapper}>
          <Button style={button} href={confirmationUrl}>
            Aceitar convite
          </Button>
        </Section>
        <Text style={footer}>
          Se você não esperava esse convite, pode ignorar este e-mail.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Geist, Arial, sans-serif' }
const container = { padding: '32px 24px', maxWidth: '560px', margin: '0 auto' }
const brandBar = { paddingBottom: '24px', borderBottom: '1px solid #e5e7eb', marginBottom: '32px' }
const brandText = { fontSize: '20px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0', letterSpacing: '-0.02em' }
const h1 = { fontSize: '26px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0 0 20px', letterSpacing: '-0.01em' }
const text = { fontSize: '15px', color: '#374151', lineHeight: '1.6', margin: '0 0 24px' }
const link = { color: '#1a1a1a', textDecoration: 'underline' }
const buttonWrapper = { margin: '8px 0 8px' }
const button = { backgroundColor: '#25D366', color: '#ffffff', fontSize: '15px', fontWeight: '600' as const, borderRadius: '8px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '12px', color: '#9ca3af', margin: '40px 0 0', borderTop: '1px solid #e5e7eb', paddingTop: '20px', lineHeight: '1.6' }
