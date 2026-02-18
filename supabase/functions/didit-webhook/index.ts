import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature-v2',
};

interface DiditWebhookPayload {
  session_id: string;
  status: 'Approved' | 'Declined' | 'In Review';
  decision: {
    id_verification?: { status: string; confidence: number; };
    face_match?: { status: string; confidence: number; };
  };
  vendor_data?: string;
  timestamp?: string;
}

async function verifySignature(body: string, signature: string | null, secret: string): Promise<boolean> {
  if (!signature) return false;
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
    const expected = Array.from(new Uint8Array(sigBuffer))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    console.log('[didit-webhook] Signature attendue:', expected);
    console.log('[didit-webhook] Signature reçue:   ', signature);
    return expected === signature;
  } catch (error) {
    console.error('[didit-webhook] Erreur vérification signature:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('[didit-webhook] Request received, method:', req.method);

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const DIDIT_WEBHOOK_SECRET = Deno.env.get('DIDIT_WEBHOOK_SECRET');
    console.log('[didit-webhook] DIDIT_WEBHOOK_SECRET:', DIDIT_WEBHOOK_SECRET ? '✓ présent' : '✗ MANQUANT');

    if (!DIDIT_WEBHOOK_SECRET) {
      console.error('[didit-webhook] Missing DIDIT_WEBHOOK_SECRET');
      return new Response('Configuration error', { status: 500 });
    }

    const bodyText = await req.text();
    const signature = req.headers.get('x-signature-v2');
    // Log du body complet pour comprendre la structure didit
    console.log('[didit-webhook] Body complet:', bodyText);
    console.log('[didit-webhook] Header x-signature-v2:', signature ?? 'absent');

    const isValid = await verifySignature(bodyText, signature, DIDIT_WEBHOOK_SECRET);
    console.log('[didit-webhook] Signature valide:', isValid);

    if (!isValid) {
      console.error('[didit-webhook] ❌ Signature invalide');
      return new Response('Invalid signature', { status: 401 });
    }

    const payload: DiditWebhookPayload = JSON.parse(bodyText);
    console.log('[didit-webhook] session_id:', payload.session_id);
    console.log('[didit-webhook] status:', payload.status);
    console.log('[didit-webhook] vendor_data:', payload.vendor_data);
    console.log('[didit-webhook] decision:', JSON.stringify(payload.decision));

    // Retry pour gérer la race condition (didit peut envoyer le webhook avant que le session_id soit en base)
    let verification = null;
    const maxRetries = 5;
    const retryDelay = 2000; // 2 secondes

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`[didit-webhook] Lookup tentative ${attempt}/${maxRetries} — session_id: ${payload.session_id}`);

      const { data } = await supabaseClient
        .from('identity_verifications')
        .select('*')
        .eq('didit_session_id', payload.session_id)
        .single();

      if (data) {
        verification = data;
        console.log('[didit-webhook] ✓ Verification trouvée à la tentative', attempt);
        break;
      }

      // Fallback : chercher par vendor_data si didit le renvoie
      if (payload.vendor_data) {
        const { data: byVendor } = await supabaseClient
          .from('identity_verifications')
          .select('*')
          .eq('id', payload.vendor_data)
          .single();

        if (byVendor) {
          verification = byVendor;
          console.log('[didit-webhook] ✓ Verification trouvée via vendor_data:', payload.vendor_data);
          break;
        }
      }

      if (attempt < maxRetries) {
        console.log(`[didit-webhook] Non trouvée, retry dans ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    if (!verification) {
      console.error('[didit-webhook] ❌ Verification introuvable après', maxRetries, 'tentatives — session_id:', payload.session_id);
      // Retourner 200 pour que didit ne retente pas (la vérif est perdue)
      return new Response(
        JSON.stringify({ error: 'Verification not found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[didit-webhook] Verification trouvée, id:', verification.id, 'statut actuel:', verification.status);

    let newStatus: 'verified' | 'rejected' | 'pending' = 'pending';
    let verifiedAt: string | null = null;
    let rejectionReason: string | null = null;

    if (payload.status === 'Approved') {
      newStatus = 'verified';
      verifiedAt = new Date().toISOString();
      console.log('[didit-webhook] → APPROVED');
    } else if (payload.status === 'Declined') {
      newStatus = 'rejected';
      const reasons: string[] = [];
      if (payload.decision?.id_verification?.status !== 'Approved') {
        reasons.push("Document d'identité invalide ou non reconnu");
      }
      if (payload.decision?.face_match?.status !== 'Approved') {
        reasons.push('La photo ne correspond pas au document');
      }
      rejectionReason = reasons.length > 0 ? reasons.join('. ') : 'Vérification refusée par didit';
      console.log('[didit-webhook] → DECLINED, raison:', rejectionReason);
    } else {
      console.log('[didit-webhook] → IN REVIEW, statut conservé à pending');
    }

    const updateData: any = {
      status: newStatus,
      didit_decision_data: payload.decision,
      didit_completed_at: new Date().toISOString(),
    };
    if (verifiedAt) updateData.verified_at = verifiedAt;
    if (rejectionReason) updateData.rejection_reason = rejectionReason;

    console.log('[didit-webhook] Mise à jour DB:', JSON.stringify(updateData));

    const { error: updateError } = await supabaseClient
      .from('identity_verifications')
      .update(updateData)
      .eq('id', verification.id);

    if (updateError) {
      console.error('[didit-webhook] ❌ Erreur mise à jour DB:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update verification' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[didit-webhook] ✅ Verification', verification.id, 'mise à jour →', newStatus);
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[didit-webhook] ❌ Erreur non gérée:', error.message, error.stack);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
