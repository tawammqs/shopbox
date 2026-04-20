import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/unsubscribe')({
  component: UnsubscribePage,
})

function UnsubscribePage() {
  const [token, setToken] = useState<string | null>(null)
  const [state, setState] = useState<'loading' | 'valid' | 'already' | 'invalid' | 'success' | 'error'>('loading')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('token')
    if (!t) {
      setState('invalid')
      return
    }
    setToken(t)
    fetch(`/email/unsubscribe?token=${encodeURIComponent(t)}`)
      .then(async (res) => {
        if (!res.ok) {
          setState('invalid')
          return
        }
        const data = await res.json()
        if (data.valid) setState('valid')
        else if (data.reason === 'already_unsubscribed') setState('already')
        else setState('invalid')
      })
      .catch(() => setState('invalid'))
  }, [])

  async function confirm() {
    if (!token) return
    setSubmitting(true)
    try {
      const res = await fetch('/email/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (data.success) setState('success')
      else if (data.reason === 'already_unsubscribed') setState('already')
      else setState('error')
    } catch {
      setState('error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <h1 className="font-display text-2xl font-bold text-foreground">ShopBox</h1>
        <div className="mt-6">
          {state === 'loading' && <p className="text-sm text-muted-foreground">Verificando...</p>}
          {state === 'valid' && (
            <>
              <h2 className="text-lg font-semibold text-foreground">Cancelar inscrição</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Você não receberá mais e-mails da ShopBox neste endereço. Tem certeza?
              </p>
              <Button onClick={confirm} disabled={submitting} className="mt-6 w-full">
                {submitting ? 'Processando...' : 'Confirmar cancelamento'}
              </Button>
            </>
          )}
          {state === 'success' && (
            <>
              <h2 className="text-lg font-semibold text-foreground">Inscrição cancelada</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Você não receberá mais e-mails neste endereço.
              </p>
              <Link to="/" className="mt-6 inline-block text-sm text-accent hover:underline">
                Voltar à ShopBox
              </Link>
            </>
          )}
          {state === 'already' && (
            <>
              <h2 className="text-lg font-semibold text-foreground">Já cancelado</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Este endereço já foi removido da nossa lista.
              </p>
              <Link to="/" className="mt-6 inline-block text-sm text-accent hover:underline">
                Voltar à ShopBox
              </Link>
            </>
          )}
          {state === 'invalid' && (
            <>
              <h2 className="text-lg font-semibold text-foreground">Link inválido</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Este link de cancelamento é inválido ou já expirou.
              </p>
            </>
          )}
          {state === 'error' && (
            <>
              <h2 className="text-lg font-semibold text-foreground">Erro</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Não conseguimos processar seu pedido. Tente novamente em instantes.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
