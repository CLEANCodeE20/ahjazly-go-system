import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('Missing authorization header')
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

        if (userError || !user) {
            throw new Error('Unauthorized')
        }

        const { code, type } = await req.json()

        if (!code || !type) {
            throw new Error('Missing required fields: code and type')
        }

        // Find valid verification code
        const { data: verificationData, error: fetchError } = await supabaseClient
            .from('user_verification_codes')
            .select('*')
            .eq('auth_id', user.id)
            .eq('verification_type', type)
            .eq('code', code)
            .eq('is_used', false)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (fetchError || !verificationData) {
            throw new Error('Invalid or expired verification code')
        }

        // Mark code as used
        const { error: updateCodeError } = await supabaseClient
            .from('user_verification_codes')
            .update({
                is_used: true,
                used_at: new Date().toISOString()
            })
            .eq('verification_id', verificationData.verification_id)

        if (updateCodeError) throw updateCodeError

        // Update user verification status
        const updateData: any = {}
        if (type === 'email') {
            updateData.email_verified = true
        } else if (type === 'phone') {
            updateData.phone_verified = true
        }

        const { error: updateUserError } = await supabaseClient
            .from('users')
            .update(updateData)
            .eq('auth_id', user.id)

        if (updateUserError) throw updateUserError

        // Log activity
        await supabaseClient.rpc('log_user_activity', {
            p_auth_id: user.id,
            p_activity_type: type === 'email' ? 'email_verified' : 'phone_verified',
            p_activity_category: 'security',
            p_description: `تم التحقق من ${type === 'email' ? 'البريد الإلكتروني' : 'رقم الهاتف'} بنجاح`
        })

        return new Response(
            JSON.stringify({
                success: true,
                verified: true,
                type: type
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error('Verify code error:', error.message)
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            }
        )
    }
})
