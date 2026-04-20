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

interface CartRecoveryEmailProps {
  name?: string
  storeName?: string
  checkoutUrl?: string
}

const CartRecoveryEmail = ({
  name,
  storeName,
  checkoutUrl,
}: CartRecoveryEmailProps) => {
  const greeting = name?.trim() || 'Olá'
  const url = checkoutUrl || 'https://shopbox.lovable.app/cadastro'
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>
        Falta pouco para sua loja{storeName ? ` ${storeName}` : ''} ir ao ar
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}>
            <Text style={brandText}>ShopBox</Text>
          </Section>
          <Heading style={h1}>
            {name ? `${greeting}, sua loja está esperando` : 'Sua loja está esperando'}
          </Heading>
          <Text style={text}>
            Notamos que você começou o cadastro{storeName ? ` da loja ${storeName}` : ''} mas
            não finalizou o pagamento. Falta só um passo para começar a vender pelo WhatsApp
            com tudo o que a ShopBox oferece.
          </Text>

          <Section style={cardBox}>
            <Text style={cardTitle}>O que você ganha ao concluir</Text>
            <Text style={cardItem}>✓ 7 dias de teste grátis — sem cobrança imediata</Text>
            <Text style={cardItem}>✓ Loja pronta em minutos, integrada ao WhatsApp</Text>
            <Text style={cardItem}>✓ Cadastro ilimitado de produtos no plano Profissional</Text>
            <Text style={cardItem}>✓ Cancela quando quiser, sem fidelidade</Text>
          </Section>

          <Section style={buttonWrapper}>
            <Button style={button} href={url}>
              Concluir cadastro
            </Button>
          </Section>

          <Text style={textSmall}>
            Se você decidiu não seguir, tudo bem — pode ignorar este e-mail. Mas se ficou alguma
            dúvida, é só responder aqui que a gente te ajuda.
          </Text>

          <Text style={footer}>
            Você está recebendo este e-mail porque iniciou um cadastro na ShopBox.
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

export default CartRecoveryEmail

export const template = {
  component: CartRecoveryEmail,
  subject: (data: Record<string, any>) =>
    data?.storeName
      ? `Falta pouco para a loja ${data.storeName} ir ao ar 🚀`
      : 'Sua loja na ShopBox está esperando 🚀',
  displayName: 'Recuperação de checkout abandonado',
  previewData: {
    name: 'Maria',
    storeName: 'Maria Modas',
    checkoutUrl: 'https://shopbox.lovable.app/cadastro',
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
