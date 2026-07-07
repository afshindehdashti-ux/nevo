// Public endpoint called by the sign-in page when supabase.auth.signInWithPassword
// returns an error. Records a `sign_in_failed` row in activity_logs and, when
// a threshold of failures for the same email in a rolling window is crossed,
// enqueues a security alert email. Bearer-less by design (users aren't signed
// in yet), but writes are performed with the service-role client server-side.
import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'

const DEFAULT_WINDOW_MINUTES = 10
const DEFAULT_THRESHOLD = 5

function normalizeEmail(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const trimmed = v.trim().toLowerCase()
  if (!trimmed || trimmed.length > 320) return null
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null
  return trimmed
}

export const Route = createFileRoute('/api/public/alerts/sign-in-failed')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = process.env.SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (!url || !serviceKey) {
          return Response.json({ error: 'server misconfigured' }, { status: 500 })
        }

        let body: { email?: unknown; reason?: unknown }
        try {
          body = await request.json()
        } catch {
          return Response.json({ error: 'invalid json' }, { status: 400 })
        }

        const email = normalizeEmail(body.email)
        if (!email) {
          // Silently accept — do not leak validation info to unauthenticated
          // callers, but do nothing further.
          return Response.json({ ok: true, skipped: 'invalid-email' })
        }
        const reason =
          typeof body.reason === 'string' ? body.reason.slice(0, 200) : null

        const h = request.headers
        const rawFwd =
          h.get('cf-connecting-ip') ||
          h.get('x-real-ip') ||
          h.get('x-forwarded-for') ||
          ''
        const ip = rawFwd.split(',')[0]?.trim() || null
        const country =
          h.get('cf-ipcountry') || h.get('x-vercel-ip-country') || null

        const admin = createClient(url, serviceKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        })

        const nowIso = new Date().toISOString()
        const windowStart = new Date(
          Date.now() - WINDOW_MINUTES * 60_000,
        ).toISOString()

        // Log the failed attempt.
        const { error: insErr } = await admin.from('activity_logs').insert({
          user_id: null,
          action: 'sign_in_failed',
          entity_type: 'auth',
          entity_id: email,
          metadata: { email, ip, country, reason, at: nowIso },
        })
        if (insErr) {
          console.error('sign-in-failed log insert failed', insErr)
          return Response.json({ ok: false, error: 'log_failed' }, { status: 500 })
        }

        // Count failures for this email in the window.
        const { data: recent, error: cntErr } = await admin
          .from('activity_logs')
          .select('id, metadata, created_at')
          .eq('action', 'sign_in_failed')
          .eq('entity_type', 'auth')
          .eq('entity_id', email)
          .gte('created_at', windowStart)
        if (cntErr) {
          console.error('sign-in-failed count query failed', cntErr)
          return Response.json({ ok: true, logged: true, alertChecked: false })
        }

        const failures = recent?.length ?? 0
        if (failures < THRESHOLD) {
          return Response.json({ ok: true, logged: true, failures })
        }

        const { enqueueSecurityAlert } = await import('@/lib/security-alerts.server')
        const distinctIps = new Set(
          (recent ?? [])
            .map((r: any) => (r?.metadata?.ip as string | null | undefined) ?? null)
            .filter((v): v is string => !!v),
        )
        const distinctCountries = new Set(
          (recent ?? [])
            .map((r: any) => (r?.metadata?.country as string | null | undefined) ?? null)
            .filter((v): v is string => !!v),
        )

        // Bucketize the alert so we page at-most-once per email per window.
        const bucket = Math.floor(Date.now() / (WINDOW_MINUTES * 60_000))
        const alert = await enqueueSecurityAlert({
          kind: 'failed_sign_ins',
          dedupKey: `sign-in-failed:${email}:${bucket}`,
          dedupWindowMinutes: WINDOW_MINUTES,
          headline: `${failures} failed sign-in attempts for ${email} in ${WINDOW_MINUTES} minutes`,
          summary:
            'Multiple failed sign-in attempts were detected for the same email address within a short window. ' +
            'Review recent activity and consider forcing a password reset or blocking further attempts.',
          details: [
            { label: 'Email', value: email },
            { label: `Failures (${WINDOW_MINUTES} min)`, value: String(failures) },
            { label: 'Distinct IPs', value: String(distinctIps.size) },
            { label: 'Latest IP', value: ip ?? 'unknown' },
            { label: 'Countries', value: [...distinctCountries].join(', ') || 'unknown' },
            ...(reason ? [{ label: 'Last error', value: reason }] : []),
          ],
        })

        return Response.json({ ok: true, logged: true, failures, alert })
      },
    },
  },
})
