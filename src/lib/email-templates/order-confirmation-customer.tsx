import * as React from 'react'
import {
  Body, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface OrderItem {
  name: string
  quantity: number
  price: number
  size?: string | null
  color?: string | null
}

interface OrderConfirmationCustomerProps {
  orderNumber?: string | number
  storeName?: string
  storeUrl?: string
  customerName?: string
  items?: OrderItem[]
  total?: number
}

const fmtBRL = (n?: number) =>
  typeof n === 'number'
    ? `R$ ${n.toFixed(2).replace('.', ',')}`
    : 'R$ 0,00'

const OrderConfirmationCustomerEmail = ({
  orderNumber = '0000',
  storeName = 'a loja',
  storeUrl,
  customerName,
  items = [],
  total,
}: OrderConfirmationCustomerProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>{`Pedido #${orderNumber} confirmado em ${storeName}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brandText}>{storeName}</Text>
        </Section>
        <Heading style={h1}>Pedido confirmado ✅</Heading>
        <Text style={text}>
          {customerName ? `Olá, ${customerName}! ` : 'Olá! '}
          Recebemos seu pedido <strong>#{orderNumber}</strong>. Em breve entraremos em contato
          pelo WhatsApp para confirmar os detalhes da entrega.
        </Text>

        <Section style={cardBox}>
          <Text style={cardTitle}>Resumo do pedido</Text>
          {items.map((it, i) => (
            <Text key={i} style={cardItem}>
              {it.name}
              {it.size ? ` (${it.size})` : ''}
              {it.color ? ` · ${it.color}` : ''} × {it.quantity} —{' '}
              <strong>{fmtBRL(Number(it.price))}</strong>
            </Text>
          ))}
          <Hr style={hr} />
          <Text style={cardItem}>
            <strong>Total: {fmtBRL(total)}</strong>
          </Text>
        </Section>

        {storeUrl && (
          <Text style={textSmall}>
            Visite a loja:{' '}
            <Link href={storeUrl} style={inlineLink}>{storeUrl.replace(/^https?:\/\//, '')}</Link>
          </Text>
        )}

        <Text style={footer}>
          Pedido realizado via{' '}
          <Link href="https://shopboxapp.com.br" style={footerLink}>ShopBox</Link>.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default OrderConfirmationCustomerEmail

export const template = {
  component: OrderConfirmationCustomerEmail,
  subject: (data: Record<string, any>) =>
    `Pedido #${data?.orderNumber ?? ''} confirmado — ${data?.storeName ?? ''}`.trim(),
  displayName: 'Confirmação de pedido (para o cliente)',
  previewData: {
    orderNumber: '1042',
    storeName: 'Bella Acessórios',
    storeUrl: 'https://shopboxapp.com.br/loja/bella',
    customerName: 'Maria',
    items: [
      { name: 'Brinco dourado', quantity: 1, price: 89.9 },
      { name: 'Colar pingente', quantity: 2, price: 59.9, color: 'Prata' },
    ],
    total: 209.7,
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Geist, Arial, sans-serif' }
const container = { padding: '32px 24px', maxWidth: '560px', margin: '0 auto' }
const brandBar = { paddingBottom: '24px', borderBottom: '1px solid #e5e7eb', marginBottom: '32px' }
const brandText = { fontSize: '18px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0 0 12px', lineHeight: '1.2' }
const text = { fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: '0 0 20px' }
const textSmall = { fontSize: '13px', color: '#6b7280', margin: '16px 0 0', lineHeight: '1.5' }
const inlineLink = { color: '#25D366', textDecoration: 'underline' }
const cardBox = { backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px 20px', margin: '0 0 16px' }
const cardTitle = { fontSize: '12px', fontWeight: 'bold' as const, color: '#374151', textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '0 0 8px' }
const cardItem = { fontSize: '14px', color: '#111827', margin: '0 0 6px', lineHeight: '1.5' }
const hr = { borderColor: '#e5e7eb', margin: '10px 0' }
const footer = { fontSize: '12px', color: '#9ca3af', margin: '32px 0 0', borderTop: '1px solid #e5e7eb', paddingTop: '20px', lineHeight: '1.6' }
const footerLink = { color: '#9ca3af', textDecoration: 'underline' }
