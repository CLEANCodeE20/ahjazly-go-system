import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
    }

    try {
        const { email, code, new_password } = await req.json()

        // Initialize Supabase Admin Client
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { autoRefreshToken: false, persistSession: false } }
        )

        // 1. Verify Code from DB
        const { data: user, error: dbError } = await supabaseAdmin
            .from('users')
            .select('auth_id, verification_code')
            .eq('email', email)
            .single()

        if (dbError || !user) {
            throw new Error('User not found')
        }

        if (user.verification_code !== code) {
            throw new Error('Invalid verification code')
        }

        // 2. Update Auth Password
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            user.auth_id,
            { password: new_password }
        )

        if (updateError) {
            throw updateError
        }

        // 3. Clear Code
        await supabaseAdmin
            .from('users')
            .update({ verification_code: null })
            .eq('auth_id', user.auth_id)

        return new Response(
            JSON.stringify({ message: 'Password updated successfully' }),
            { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } },
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } },
        )
    }
})
