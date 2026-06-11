import * as React from 'react'
import {
  Body, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text,
  Button,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface OrderItem {
  name: string
  quantity: number
  price: number
  size?: string | null
  color?: string | null
}

interface NewOrderStoreProps {
  orderNumber?: string | number
  storeName?: string
  customerName?: string
  customerWhatsapp?: string
  customerEmail?: string
  items?: OrderItem[]
  total?: number
  createdAt?: string
  dashboardUrl?: string
}

const fmtBRL = (n?: number) =>
  typeof n === 'number'
    ? `R$ ${n.toFixed(2).replace('.', ',')}`
    : 'R$ 0,00'

const NewOrderStoreEmail = ({
  orderNumber = '0000',
  storeName = 'sua loja',
  customerName = 'Cliente',
  customerWhatsapp,
  customerEmail,
  items = [],
  total,
  createdAt,
  dashboardUrl = 'https://shopboxapp.com.br/admin/pedidos',
}: NewOrderStoreProps) => {
  const dateLabel = createdAt
    ? new Date(createdAt).toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR')
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>Novo pedido #{orderNumber} em {storeName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={brandBar}>
            <Text style={brandText}>ShopBox</Text>
          </Section>
          <Heading style={h1}>Novo pedido recebido 🎉</Heading>
          <Text style={text}>
            Pedido <strong>#{orderNumber}</strong> — {dateLabel}
          </Text>

          <Section style={cardBox}>
            <Text style={cardTitle}>Cliente</Text>
            <Text style={cardItem}><strong>{customerName}</strong></Text>
            {(customerWhatsapp || customerEmail) && (
              <Text style={cardItemMuted}>
                {customerWhatsapp || ''}
                {customerWhatsapp && customerEmail ? ' · ' : ''}
                {customerEmail || ''}
              </Text>
            )}
          </Section>

          <Section style={cardBox}>
            <Text style={cardTitle}>Itens</Text>
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

          <Section style={buttonWrapper}>
            <Button style={button} href={dashboardUrl}>Ver pedido no painel</Button>
          </Section>

          <Text style={footer}>
            Você está recebendo este e-mail porque é o(a) responsável por {storeName} na ShopBox.
            <br />
            <Link href="https://shopboxapp.com.br" style={footerLink}>shopboxapp.com.br</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default NewOrderStoreEmail

export const template = {
  component: NewOrderStoreEmail,
  subject: (data: Record<string, any>) =>
    `🛍️ Novo pedido #${data?.orderNumber ?? ''} — ${data?.storeName ?? 'sua loja'}`.trim(),
  displayName: 'Novo pedido (para o lojista)',
  previewData: {
    orderNumber: '1042',
    storeName: 'Bella Acessórios',
    customerName: 'Maria Silva',
    customerWhatsapp: '(11) 99999-9999',
    items: [
      { name: 'Brinco dourado', quantity: 1, price: 89.9 },
      { name: 'Colar pingente', quantity: 2, price: 59.9, color: 'Prata' },
    ],
    total: 209.7,
    createdAt: new Date().toISOString(),
    dashboardUrl: 'https://shopboxapp.com.br/admin/pedidos',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Geist, Arial, sans-serif' }
const container = { padding: '32px 24px', maxWidth: '560px', margin: '0 auto' }
const brandBar = { paddingBottom: '24px', borderBottom: '1px solid #e5e7eb', marginBottom: '32px' }
const brandText = { fontSize: '20px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0', letterSpacing: '-0.02em' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0 0 8px', lineHeight: '1.2' }
const text = { fontSize: '14px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 20px' }
const cardBox = { backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px 20px', margin: '0 0 16px' }
const cardTitle = { fontSize: '12px', fontWeight: 'bold' as const, color: '#374151', textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '0 0 8px' }
const cardItem = { fontSize: '14px', color: '#111827', margin: '0 0 6px', lineHeight: '1.5' }
const cardItemMuted = { fontSize: '13px', color: '#6b7280', margin: '0', lineHeight: '1.5' }
const hr = { borderColor: '#e5e7eb', margin: '10px 0' }
const buttonWrapper = { margin: '8px 0 8px', textAlign: 'center' as const }
const button = { backgroundColor: '#25D366', color: '#ffffff', fontSize: '15px', fontWeight: '600' as const, borderRadius: '8px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '12px', color: '#9ca3af', margin: '32px 0 0', borderTop: '1px solid #e5e7eb', paddingTop: '20px', lineHeight: '1.6' }
const footerLink = { color: '#9ca3af', textDecoration: 'underline' }
