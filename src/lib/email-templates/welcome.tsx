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
import type { TemplateEntry } from './registry'

interface WelcomeEmailProps {
  name?: string
  planName?: string
  trialDays?: number
  dashboardUrl?: string
}

const WelcomeEmail = ({
  name,
  planName,
  trialDays,
  dashboardUrl,
}: WelcomeEmailProps) => {
  const greetingName = name?.trim() || 'Olá'
  const url = dashboardUrl || 'https://shopbox.lovable.app/admin/dashboard'
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>
        Bem-vindo à ShopBox{planName ? ` — plano ${planName} ativo` : ''}!
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}>
            <Text style={brandText}>ShopBox</Text>
          </Section>
          <Heading style={h1}>
            {name ? `Boas-vindas, ${greetingName}!` : 'Sua loja está pronta!'}
          </Heading>
          <Text style={text}>
            Sua assinatura{planName ? ` do plano ${planName}` : ''} foi ativada com sucesso
            {trialDays ? ` e você tem ${trialDays} dias de teste grátis para começar` : ''}.
            Agora é só montar a sua loja e começar a vender pelo WhatsApp.
          </Text>

          <Section style={cardBox}>
            <Text style={cardTitle}>Seus próximos passos</Text>
            <Text style={cardItem}>1. Configure logo, cores e WhatsApp da loja</Text>
            <Text style={cardItem}>2. Cadastre suas categorias e produtos</Text>
            <Text style={cardItem}>3. Compartilhe o link da sua loja</Text>
          </Section>

          <Section style={buttonWrapper}>
            <Button style={button} href={url}>
              Acessar meu painel
            </Button>
          </Section>

          <Text style={textSmall}>
            Precisa de ajuda? Responda este e-mail ou fale com a gente pelo WhatsApp —
            nosso time está pronto para te ajudar a colocar a loja no ar.
          </Text>

          <Text style={footer}>
            Você está recebendo este e-mail porque ativou uma assinatura na ShopBox.
            <br />
            <Link href="https://shopbox.lovable.app" style={footerLink}>
              shopbox.lovable.app
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default WelcomeEmail

export const template = {
  component: WelcomeEmail,
  subject: (data: Record<string, any>) =>
    data?.name
      ? `${data.name}, sua loja ShopBox está pronta!`
      : 'Sua loja ShopBox está pronta!',
  displayName: 'Boas-vindas após ativação da assinatura',
  previewData: {
    name: 'Maria',
    planName: 'Profissional',
    trialDays: 7,
    dashboardUrl: 'https://shopbox.lovable.app/admin/dashboard',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Geist, Arial, sans-serif' }
const container = { padding: '32px 24px', maxWidth: '560px', margin: '0 auto' }
const brandBar = { paddingBottom: '24px', borderBottom: '1px solid #e5e7eb', marginBottom: '32px' }
const brandText = { fontSize: '20px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0', letterSpacing: '-0.02em' }
const h1 = { fontSize: '28px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0 0 20px', letterSpacing: '-0.01em', lineHeight: '1.2' }
const text = { fontSize: '15px', color: '#374151', lineHeight: '1.6', margin: '0 0 24px' }
const textSmall = { fontSize: '13px', color: '#6b7280', lineHeight: '1.6', margin: '24px 0 0' }
const cardBox = {
  backgroundColor: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '8px 0 24px',
}
const cardTitle = { fontSize: '14px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0 0 12px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }
const cardItem = { fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: '0 0 8px' }
const buttonWrapper = { margin: '8px 0 8px', textAlign: 'center' as const }
const button = {
  backgroundColor: '#25D366',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '600' as const,
  borderRadius: '8px',
  padding: '14px 28px',
  textDecoration: 'none',
  display: 'inline-block',
}
const footer = { fontSize: '12px', color: '#9ca3af', margin: '40px 0 0', borderTop: '1px solid #e5e7eb', paddingTop: '20px', lineHeight: '1.6' }
const footerLink = { color: '#9ca3af', textDecoration: 'underline' }
