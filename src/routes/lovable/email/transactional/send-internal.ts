// Internal route to send transactional emails server-to-server (e.g., from
// Stripe webhook in supabase/functions/payments-webhook).
// Authenticates with the Supabase service role key as a Bearer token.
import * as React from 'react'
import { render } from '@react-email/components'
import { createClient } from '@supabase/supabase-js'
import { createFileRoute } from '@tanstack/react-router'
import { TEMPLATES } from '@/lib/email-templates/registry'

const SITE_NAME = "shopbox"
const SENDER_DOMAIN = "notify.shopboxapp.com.br"
const FROM_DOMAIN = "shopboxapp.com.br"

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export const Route = createFileRoute("/lovable/email/transactional/send-internal")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (!supabaseUrl || !supabaseServiceKey) {
          return Response.json({ error: 'Server configuration error' }, { status: 500 })
        }

        const authHeader = request.headers.get('Authorization')
        if (!authHeader?.startsWith('Bearer ')) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const token = authHeader.slice('Bearer '.length).trim()
        if (token !== supabaseServiceKey) {
          return Response.json({ error: 'Forbidden' }, { status: 403 })
        }

        let body: any
        try {
          body = await request.json()
        } catch {
          return Response.json({ error: 'Invalid JSON' }, { status: 400 })
        }

        const templateName = body.templateName
        const recipientEmail = body.recipientEmail
        const templateData = (body.templateData && typeof body.templateData === 'object') ? body.templateData : {}
        const idempotencyKey = body.idempotencyKey || crypto.randomUUID()
        const subscriptionId = body.subscriptionId || null

        const template = TEMPLATES[templateName]
        if (!template) {
          return Response.json({ error: `Template '${templateName}' not found` }, { status: 404 })
        }

        const recipient = template.to || recipientEmail
        if (!recipient) {
          return Response.json({ error: 'recipientEmail required' }, { status: 400 })
        }

        const supabase: any = createClient(supabaseUrl, supabaseServiceKey)

        // Idempotency check (use error_message column to store sub:<id> tag)
        if (subscriptionId) {
          const { data: existing } = await supabase
            .from('email_send_log')
            .select('id')
            .eq('template_name', templateName)
            .eq('error_message', `sub:${subscriptionId}`)
            .limit(1)
          if (existing && existing.length > 0) {
            return Response.json({ success: true, deduplicated: true })
          }
        }

        // Suppression check
        const { data: suppressed } = await supabase
          .from('suppressed_emails')
          .select('email')
          .eq('email', recipient.toLowerCase())
          .maybeSingle()
        if (suppressed) {
          return Response.json({ success: false, suppressed: true })
        }

        // Render
        const element = React.createElement(template.component, templateData)
        const html = await render(element)
        const textBody = await render(element, { plainText: true })
        const subject = typeof template.subject === 'function'
          ? template.subject(templateData)
          : template.subject

        // Get/create unsubscribe token (one per email)
        let unsubToken: string | null = null
        const { data: existingTok } = await supabase
          .from('email_unsubscribe_tokens')
          .select('token')
          .eq('email', recipient.toLowerCase())
          .is('used_at', null)
          .maybeSingle()
        if (existingTok?.token) {
          unsubToken = existingTok.token
        } else {
          unsubToken = generateToken()
          await supabase.from('email_unsubscribe_tokens').insert({
            email: recipient.toLowerCase(),
            token: unsubToken,
          })
        }

        const messageId = crypto.randomUUID()

        await supabase.from('email_send_log').insert({
          message_id: messageId,
          template_name: templateName,
          recipient_email: recipient,
          status: 'pending',
          error_message: subscriptionId ? `sub:${subscriptionId}` : null,
        })

        const { error: enqError } = await supabase.rpc('enqueue_email', {
          queue_name: 'transactional_emails',
          payload: {
            message_id: messageId,
            to: recipient,
            from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
            sender_domain: SENDER_DOMAIN,
            subject,
            html,
            text: textBody,
            purpose: 'transactional',
            label: templateName,
            idempotency_key: idempotencyKey,
            unsubscribe_token: unsubToken,
            queued_at: new Date().toISOString(),
          },
        })

        if (enqError) {
          console.error('Enqueue failed', enqError)
          return Response.json({ error: 'Failed to enqueue' }, { status: 500 })
        }

        return Response.json({ success: true, queued: true, messageId })
      },
    },
  },
})
