import { withMethodGuards } from "@/lib/api-http";
import { assertAllowedOrigin, assertRateLimit, corsHeaders, jsonError } from "@/lib/api-security";
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(60).optional().nullable(),
  company: z.string().trim().max(200).optional().nullable(),
  country: z.string().trim().max(120).optional().nullable(),
  message: z.string().trim().max(4000).optional().nullable(),
  source: z.string().trim().max(80).optional().nullable(),
})

export const Route = createFileRoute('/api/public/contact-submit')({
  server: {
    handlers: withMethodGuards({
      OPTIONS: async ({ request }) => {
        const headers = corsHeaders(request)
        const blocked = assertAllowedOrigin(request, headers)
        if (blocked) return blocked
        return new Response(null, { status: 204, headers })
      },
      POST: async ({ request }) => {
        const headers = corsHeaders(request)
        const blocked = assertAllowedOrigin(request, headers)
        if (blocked) return blocked
        const limited = assertRateLimit(request, 'contact-submit', { limit: 8, windowMs: 60_000 })
        if (limited) return limited

        let body: unknown
        try {
          body = await request.json()
        } catch {
          return jsonError(400, 'invalid_json', undefined, headers)
        }

        const parsed = contactSchema.safeParse(body)
        if (!parsed.success) {
          return jsonError(
            400,
            'validation_failed',
            { details: parsed.error.flatten() },
            headers,
          )
        }
        const data = parsed.data

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server')

        let leadId: string | null = null
        const noteParts: string[] = []
        if (data.message) noteParts.push(data.message)
        if (data.source) noteParts.push(`[source: ${data.source}]`)
        const { data: inserted, error: insertErr } = await supabaseAdmin
          .from('leads')
          .insert({
            name: data.name,
            email: data.email,
            phone: data.phone ?? null,
            company: data.company ?? null,
            country: data.country ?? null,
            notes: noteParts.join('\n\n') || null,
            source: 'web',
            status: 'new',
          } as never)
          .select('id')
          .single()
        if (insertErr) {
          console.error('contact-submit: lead insert failed', insertErr)
        } else {
          leadId = (inserted as { id: string } | null)?.id ?? null
        }

        try {
          const { enqueueTransactionalEmail } = await import('@/lib/email-enqueue.server')
          const referenceId = leadId ? `INQ-${leadId.slice(0, 8).toUpperCase()}` : undefined
          const result = await enqueueTransactionalEmail({
            templateName: 'contact-confirmation',
            recipientEmail: data.email,
            idempotencyKey: leadId
              ? `contact-confirm-${leadId}`
              : `contact-confirm-${data.email.toLowerCase()}-${Date.now()}`,
            templateData: {
              name: data.name,
              message: data.message ?? undefined,
              submittedAt: new Date().toISOString(),
              referenceId,
            },
          })
          if (!result.ok) {
            console.warn('contact-submit: confirmation not queued', result.reason)
          }
        } catch (err) {
          console.error('contact-submit: confirmation email error', err)
        }

        return Response.json({ ok: true, leadId }, { status: 200, headers })
      },
    }),
  },
})
