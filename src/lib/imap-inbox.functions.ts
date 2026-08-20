import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";

async function ensureSuperAdmin(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase.rpc("current_user_has_role", { _role: "super_admin" });
  if (error) throw new Error("Role check failed: " + error.message);
  if (!data) throw new Error("Forbidden: super_admin role required");
}

async function loadActiveConfig(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("mailbox_connections")
    .select("*")
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

function maskPassword(row: any) {
  if (!row) return null;
  const { imap_password, gmail_client_secret, gmail_refresh_token, gmail_access_token, gmail_oauth_state, ...rest } = row;
  return {
    ...rest,
    imap_password_set: Boolean(imap_password),
    gmail_client_secret_set: Boolean(gmail_client_secret),
    gmail_authorized: Boolean(gmail_refresh_token),
  };
}


// ============ SETTINGS ============

export const getMailboxConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureSuperAdmin(context.supabase, context.userId);
    const row = await loadActiveConfig(context.supabase);
    return { config: maskPassword(row) };
  });

const saveConfigSchema = z.object({
  provider: z.enum(["imap", "gmail"]),
  imap_host: z.string().trim().max(255).optional().nullable(),
  imap_port: z.number().int().min(1).max(65535).optional().nullable(),
  imap_username: z.string().trim().max(255).optional().nullable(),
  imap_password: z.string().max(500).optional().nullable(), // empty string = don't change
  imap_tls: z.boolean().optional(),
  gmail_email: z.string().trim().email().max(255).optional().nullable(),
  gmail_client_id: z.string().trim().max(255).optional().nullable(),
  gmail_client_secret: z.string().max(500).optional().nullable(), // empty = don't change
  notes: z.string().max(1000).optional().nullable(),
});
export type SaveMailboxConfigInput = z.infer<typeof saveConfigSchema>;


export const saveMailboxConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: SaveMailboxConfigInput) => saveConfigSchema.parse(data))
  .handler(async ({ data, context }) => {
    await ensureSuperAdmin(context.supabase, context.userId);
    const existing = await loadActiveConfig(context.supabase);

    const payload: any = {
      provider: data.provider,
      imap_host: data.imap_host ?? null,
      imap_port: data.imap_port ?? null,
      imap_username: data.imap_username ?? null,
      imap_tls: data.imap_tls ?? true,
      gmail_email: data.gmail_email ?? null,
      gmail_client_id: data.gmail_client_id ?? null,
      notes: data.notes ?? null,
      is_active: true,
    };
    // Only overwrite secrets if new ones supplied
    if (data.imap_password && data.imap_password.length > 0) {
      payload.imap_password = data.imap_password;
    }
    if (data.gmail_client_secret && data.gmail_client_secret.length > 0) {
      payload.gmail_client_secret = data.gmail_client_secret;
    }


    if (existing) {
      const { error } = await context.supabase
        .from("mailbox_connections")
        .update(payload)
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      if (data.provider === "imap" && !payload.imap_password) {
        throw new Error("IMAP password is required on first save.");
      }
      const { error } = await context.supabase
        .from("mailbox_connections")
        .insert(payload);
      if (error) throw new Error(error.message);
    }

    const row = await loadActiveConfig(context.supabase);
    return { ok: true as const, config: maskPassword(row) };
  });

export const deleteMailboxConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureSuperAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("mailbox_connections")
      .delete()
      .eq("is_active", true);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

// ============ IMAP CONNECT ============

async function openImap(row: any) {
  if (!row) throw new Error("No mailbox configured. Open Mail Hub → Settings.");
  if (row.provider !== "imap") throw new Error("Mailbox is not configured for IMAP.");
  if (!row.imap_host || !row.imap_port || !row.imap_username || !row.imap_password) {
    throw new Error("IMAP settings are incomplete.");
  }
  const { ImapFlow } = await import("imapflow");
  const client = new ImapFlow({
    host: row.imap_host,
    port: row.imap_port,
    secure: row.imap_tls !== false,
    auth: { user: row.imap_username, pass: row.imap_password },
    logger: false,
  });
  await client.connect();
  return client;
}

async function recordTest(
  supabase: SupabaseClient<Database>,
  id: string,
  ok: boolean,
  error: string | null,
) {
  await supabase
    .from("mailbox_connections")
    .update({ last_test_at: new Date().toISOString(), last_test_ok: ok, last_test_error: error })
    .eq("id", id);
}

export const testMailboxConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureSuperAdmin(context.supabase, context.userId);
    const row = await loadActiveConfig(context.supabase);
    if (!row) throw new Error("Save settings first.");
    if (row.provider !== "imap") {
      return { ok: false as const, error: "Only IMAP test is available." };
    }
    let client: any = null;
    try {
      client = await openImap(row);
      const list = await client.list();
      await recordTest(context.supabase, row.id, true, null);
      return { ok: true as const, mailboxes: list.length };
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      await recordTest(context.supabase, row.id, false, msg);
      return { ok: false as const, error: msg };
    } finally {
      try { if (client) await client.logout(); } catch {}
    }
  });

// ============ IMAP READ ============

const listSchema = z.object({
  mailbox: z.string().trim().max(200).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).max(10000).optional(),
});

export const listImapMailboxes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureSuperAdmin(context.supabase, context.userId);
    const row = await loadActiveConfig(context.supabase);
    let client: any = null;
    try {
      client = await openImap(row);
      const list = await client.list();
      return {
        mailboxes: list.map((m: any) => ({
          path: m.path,
          name: m.name,
          specialUse: m.specialUse ?? null,
          subscribed: m.subscribed ?? true,
        })),
      };
    } finally {
      try { if (client) await client.logout(); } catch {}
    }
  });

export const listImapMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: z.infer<typeof listSchema>) => listSchema.parse(data ?? {}))
  .handler(async ({ data, context }) => {
    await ensureSuperAdmin(context.supabase, context.userId);
    const row = await loadActiveConfig(context.supabase);
    const mailbox = data.mailbox || "INBOX";
    const limit = data.limit ?? 30;
    const offset = data.offset ?? 0;

    let client: any = null;
    try {
      client = await openImap(row);
      const lock = await client.getMailboxLock(mailbox);
      try {
        const status = await client.status(mailbox, { messages: true, unseen: true });
        const total = status.messages ?? 0;
        if (total === 0) return { messages: [], total: 0, unseen: status.unseen ?? 0 };

        // Newest first: fetch sequence range from top
        const endSeq = Math.max(1, total - offset);
        const startSeq = Math.max(1, endSeq - limit + 1);
        const range = `${startSeq}:${endSeq}`;

        const messages: any[] = [];
        for await (const msg of client.fetch(range, {
          uid: true,
          flags: true,
          envelope: true,
          internalDate: true,
          size: true,
          bodyStructure: true,
        })) {
          messages.push({
            uid: msg.uid,
            seq: msg.seq,
            flags: Array.from(msg.flags ?? []),
            seen: (msg.flags ?? new Set()).has("\\Seen"),
            date: msg.envelope?.date ?? msg.internalDate ?? null,
            subject: msg.envelope?.subject ?? "(no subject)",
            from: (msg.envelope?.from ?? []).map((a: any) => ({ name: a.name, address: a.address })),
            to: (msg.envelope?.to ?? []).map((a: any) => ({ name: a.name, address: a.address })),
            messageId: msg.envelope?.messageId ?? null,
            size: msg.size,
          });
        }
        messages.sort((a, b) => (b.date ? new Date(b.date).getTime() : 0) - (a.date ? new Date(a.date).getTime() : 0));
        return { messages, total, unseen: status.unseen ?? 0 };
      } finally {
        lock.release();
      }
    } finally {
      try { if (client) await client.logout(); } catch {}
    }
  });

const getSchema = z.object({
  mailbox: z.string().trim().max(200).optional(),
  uid: z.number().int().positive(),
});

export const getImapMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: z.infer<typeof getSchema>) => getSchema.parse(data))
  .handler(async ({ data, context }) => {
    await ensureSuperAdmin(context.supabase, context.userId);
    const row = await loadActiveConfig(context.supabase);
    const mailbox = data.mailbox || "INBOX";

    let client: any = null;
    try {
      client = await openImap(row);
      const lock = await client.getMailboxLock(mailbox);
      try {
        const msg = await client.fetchOne(
          data.uid,
          { source: true, envelope: true, flags: true, bodyStructure: true, internalDate: true },
          { uid: true },
        );
        if (!msg) throw new Error("Message not found");

        // Parse using simpleParser dynamically
        const { simpleParser } = await import("mailparser");
        const parsed = await simpleParser(msg.source as Buffer);

        // Mark as read
        try { await client.messageFlagsAdd({ uid: data.uid }, ["\\Seen"], { uid: true }); } catch {}

        return {
          uid: msg.uid,
          subject: parsed.subject ?? msg.envelope?.subject ?? "(no subject)",
          from: parsed.from?.value?.map((a: any) => ({ name: a.name, address: a.address })) ?? [],
          to: (Array.isArray(parsed.to) ? parsed.to : parsed.to ? [parsed.to] : [])
            .flatMap((t: any) => t.value ?? [])
            .map((a: any) => ({ name: a.name, address: a.address })),
          date: parsed.date?.toISOString() ?? msg.envelope?.date ?? null,
          html: parsed.html || null,
          text: parsed.text || null,
          messageId: parsed.messageId ?? null,
          inReplyTo: parsed.inReplyTo ?? null,
          references: parsed.references ?? null,
          attachments: (parsed.attachments ?? []).map((a: any) => ({
            filename: a.filename,
            contentType: a.contentType,
            size: a.size,
          })),
        };
      } finally {
        lock.release();
      }
    } finally {
      try { if (client) await client.logout(); } catch {}
    }
  });

const flagSchema = z.object({
  mailbox: z.string().trim().max(200).optional(),
  uid: z.number().int().positive(),
  seen: z.boolean().optional(),
});

export const setImapSeen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof flagSchema>) => flagSchema.parse(d))
  .handler(async ({ data, context }) => {
    await ensureSuperAdmin(context.supabase, context.userId);
    const row = await loadActiveConfig(context.supabase);
    const mailbox = data.mailbox || "INBOX";
    let client: any = null;
    try {
      client = await openImap(row);
      const lock = await client.getMailboxLock(mailbox);
      try {
        if (data.seen) {
          await client.messageFlagsAdd({ uid: data.uid }, ["\\Seen"], { uid: true });
        } else {
          await client.messageFlagsRemove({ uid: data.uid }, ["\\Seen"], { uid: true });
        }
      } finally { lock.release(); }
      return { ok: true as const };
    } finally {
      try { if (client) await client.logout(); } catch {}
    }
  });

const deleteSchema = z.object({
  mailbox: z.string().trim().max(200).optional(),
  uid: z.number().int().positive(),
});

export const deleteImapMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof deleteSchema>) => deleteSchema.parse(d))
  .handler(async ({ data, context }) => {
    await ensureSuperAdmin(context.supabase, context.userId);
    const row = await loadActiveConfig(context.supabase);
    const mailbox = data.mailbox || "INBOX";
    let client: any = null;
    try {
      client = await openImap(row);
      const lock = await client.getMailboxLock(mailbox);
      try {
        await client.messageDelete({ uid: data.uid }, { uid: true });
      } finally { lock.release(); }
      return { ok: true as const };
    } finally {
      try { if (client) await client.logout(); } catch {}
    }
  });

// ============ GMAIL OAUTH ============

const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

function randomState() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const startOAuthSchema = z.object({
  redirect_uri: z.string().url().max(500),
});

export const startGmailOAuth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof startOAuthSchema>) => startOAuthSchema.parse(d))
  .handler(async ({ data, context }) => {
    await ensureSuperAdmin(context.supabase, context.userId);
    const row: any = await loadActiveConfig(context.supabase);
    if (!row || row.provider !== "gmail") {
      throw new Error("Save the Gmail configuration first (mailbox email).");
    }
    if (!row.gmail_client_id || !row.gmail_client_secret) {
      throw new Error("Set the Google Client ID and Client Secret first, then Save.");
    }
    const state = randomState();
    const { error } = await context.supabase
      .from("mailbox_connections")
      .update({ gmail_oauth_state: state, gmail_redirect_uri: data.redirect_uri } as any)
      .eq("id", row.id);
    if (error) throw new Error(error.message);

    const params = new URLSearchParams({
      client_id: row.gmail_client_id,
      redirect_uri: data.redirect_uri,
      response_type: "code",
      scope: GMAIL_SCOPES,
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: "true",
      state,
      ...(row.gmail_email ? { login_hint: row.gmail_email } : {}),
    });
    return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` };
  });

export const disconnectGmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureSuperAdmin(context.supabase, context.userId);
    const row: any = await loadActiveConfig(context.supabase);
    if (!row) return { ok: true as const };
    const { error } = await context.supabase
      .from("mailbox_connections")
      .update({
        gmail_refresh_token: null,
        gmail_access_token: null,
        gmail_token_expires_at: null,
        gmail_scope: null,
        gmail_authorized_email: null,
        gmail_oauth_state: null,
        last_test_ok: null,
        last_test_error: null,
        last_test_at: null,
      } as any)
      .eq("id", row.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
