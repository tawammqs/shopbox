import { supabase } from '@/integrations/supabase/client'

interface SendArgs {
  templateName: string
  recipientEmail: string
  /** Stable key to dedupe retries for the same logical event. */
  idempotencyKey: string
  templateData?: Record<string, any>
  /** Optional subject override; usually templates compute their own. */
  subjectOverride?: string
}

/**
 * Send a Lovable transactional (app) email.
 * Silently logs and resolves false on failure — never blocks the calling
 * flow (signup, order creation, etc.).
 */
export async function sendTransactionalEmail(args: SendArgs): Promise<boolean> {
  try {
    const { data: sess } = await supabase.auth.getSession()
    const token = sess.session?.access_token
    if (!token) {
      console.warn('[email] no session, skipping send', args.templateName)
      return false
    }
    const res = await fetch('/lovable/email/transactional/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        templateName: args.templateName,
        recipientEmail: args.recipientEmail,
        idempotencyKey: args.idempotencyKey,
        templateData: args.templateData ?? {},
        ...(args.subjectOverride ? { subject: args.subjectOverride } : {}),
      }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.warn('[email] send failed', res.status, body)
      return false
    }
    return true
  } catch (err) {
    console.warn('[email] send threw', err)
    return false
  }
}
