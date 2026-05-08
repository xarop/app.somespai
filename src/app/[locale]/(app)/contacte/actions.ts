'use server';

import { createClient } from '@/lib/supabase/server';

export type ContactState = { ok: true } | { ok: false; error: string } | null;

export async function submitContactAction(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const name    = (formData.get('name')    as string | null)?.trim() ?? '';
  const email   = (formData.get('email')   as string | null)?.trim() ?? '';
  const type    = (formData.get('type')    as string | null)?.trim() ?? '';
  const message = (formData.get('message') as string | null)?.trim() ?? '';

  if (!name || !email || !type || !message) {
    return { ok: false, error: 'missing_fields' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'invalid_email' };
  }
  if (!['bug', 'suggestion', 'question', 'other'].includes(type)) {
    return { ok: false, error: 'invalid_type' };
  }
  if (message.length > 5000) {
    return { ok: false, error: 'message_too_long' };
  }

  // RLS policy allows public inserts (no auth required)
  const supabase = await createClient();
  const { error: dbError } = await supabase
    .from('contact_messages')
    .insert({ name, email, type, message });

  if (dbError) {
    console.error('submitContactAction DB error:', dbError.message);
    return { ok: false, error: 'db_error' };
  }

  // Optional email notification via Resend
  const resendKey   = process.env.RESEND_API_KEY;
  const adminEmail  = process.env.ADMIN_EMAIL;
  const fromDomain  = process.env.RESEND_FROM ?? 'noreply@BRAND_NAME_PLACEHOLDER.net';

  if (resendKey && adminEmail) {
    const typeLabels: Record<string, string> = {
      bug: 'Error / Incidència',
      suggestion: 'Suggeriment',
      question: 'Pregunta',
      other: 'Altre',
    };
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromDomain,
          to: adminEmail,
          reply_to: email,
          subject: `[BRAND_NAME_CAP_PLACEHOLDER] ${typeLabels[type] ?? type}: ${name}`,
          html: `
<p><strong>De:</strong> ${name} &lt;${email}&gt;</p>
<p><strong>Motiu:</strong> ${typeLabels[type] ?? type}</p>
<hr />
<p style="white-space:pre-wrap">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
          `.trim(),
        }),
      });
    } catch (emailErr) {
      // Non-fatal — message is already in DB
      console.error('submitContactAction email error:', emailErr);
    }
  }

  return { ok: true };
}
