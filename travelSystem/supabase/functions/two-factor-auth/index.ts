import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import * as OTPAuth from "npm:otpauth@9.2.2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('Missing authorization header')

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
        if (userError || !user) throw new Error('Unauthorized')

        const text = await req.text()
        const body = text ? JSON.parse(text) : {}
        const { action, code, isBackupCode } = body

        console.log(`[STABLE_2FA] Action: ${action} | User: ${user.id}`)

        if (action === 'status') {
            const { data } = await supabaseClient
                .from('user_two_factor')
                .select('*')
                .eq('auth_id', user.id)
                .maybeSingle()

            return new Response(
                JSON.stringify({
                    success: true,
                    enabled: data?.is_enabled || false,
                    method: data?.method || null,
                    enabledAt: data?.enabled_at || null,
                    lastUsedAt: data?.last_used_at || null
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (action === 'setup') {
            const { data: profile } = await supabaseClient
                .from('users')
                .select('user_id')
                .eq('auth_id', user.id)
                .single()

            if (!profile) throw new Error('User profile not found')

            const secret = new OTPAuth.Secret({ size: 20 });
            const backupCodes = Array.from({ length: 8 }, () =>
                Math.random().toString(36).substring(2, 10).toUpperCase()
            )

            // Manual Resilient Upsert
            const { data: existing } = await supabaseClient
                .from('user_two_factor')
                .select('two_factor_id')
                .eq('auth_id', user.id)
                .maybeSingle()

            if (existing) {
                await supabaseClient
                    .from('user_two_factor')
                    .update({
                        secret_key: secret.base32,
                        backup_codes: backupCodes,
                        is_enabled: false,
                        updated_at: new Date().toISOString()
                    })
                    .eq('auth_id', user.id)
            } else {
                await supabaseClient
                    .from('user_two_factor')
                    .insert({
                        user_id: profile.user_id,
                        auth_id: user.id,
                        method: 'totp',
                        secret_key: secret.base32,
                        backup_codes: backupCodes,
                        is_enabled: false
                    })
            }

            const totp = new OTPAuth.TOTP({
                issuer: 'Ahjazly',
                label: user.email || 'User',
                algorithm: 'SHA1',
                digits: 6,
                period: 30,
                secret: secret,
            });

            return new Response(
                JSON.stringify({
                    success: true,
                    secret: secret.base32,
                    qrCodeUri: totp.toString(),
                    backupCodes: backupCodes
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (action === 'verify-enable' || action === 'verify') {
            if (!code) throw new Error('Code is required')

            const { data: twoFactorData, error: dbError } = await supabaseClient
                .from('user_two_factor')
                .select('*')
                .eq('auth_id', user.id)
                .single()

            if (dbError || !twoFactorData) throw new Error('2FA not configured')

            let isValid = false;

            if (isBackupCode) {
                const codes = twoFactorData.backup_codes || [];
                if (codes.includes(code)) {
                    isValid = true;
                    // Remove used backup code
                    const newCodes = codes.filter((c: string) => c !== code);
                    await supabaseClient
                        .from('user_two_factor')
                        .update({ backup_codes: newCodes })
                        .eq('auth_id', user.id);
                }
            } else {
                try {
                    const totp = new OTPAuth.TOTP({
                        issuer: 'Ahjazly',
                        label: user.email || 'User',
                        algorithm: 'SHA1',
                        digits: 6,
                        period: 30,
                        secret: OTPAuth.Secret.fromBase32(twoFactorData.secret_key),
                    });
                    const delta = totp.validate({ token: code, window: 1 });
                    isValid = delta !== null;
                } catch (e) {
                    console.error('[STABLE_2FA] TOTP validation error:', e.message);
                }
            }

            if (!isValid) {
                throw new Error('Invalid verification code');
            }

            if (action === 'verify-enable') {
                await supabaseClient
                    .from('user_two_factor')
                    .update({ is_enabled: true, enabled_at: new Date().toISOString() })
                    .eq('auth_id', user.id)
            } else {
                await supabaseClient
                    .from('user_two_factor')
                    .update({ last_used_at: new Date().toISOString() })
                    .eq('auth_id', user.id)
            }

            return new Response(
                JSON.stringify({ success: true, verified: true }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (action === 'disable') {
            await supabaseClient
                .from('user_two_factor')
                .update({ is_enabled: false })
                .eq('auth_id', user.id)

            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        throw new Error(`Action ${action} not implemented`)

    } catch (error: any) {
        console.error('[STABLE_2FA] Fatal Error:', error.message)
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
    }
})
