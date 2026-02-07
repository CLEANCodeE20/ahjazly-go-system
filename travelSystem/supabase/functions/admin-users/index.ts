import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

Deno.serve(async (req) => {
    // 1. Handle Preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Function handleUpdate defined inside to capture supabaseClient
        const handleUpdate = async (body: any) => {
            const { userId, email, password, fullName, role, account_status } = body
            if (!userId) throw new Error("Missing userId")

            const authUpdates: any = {}
            if (email) authUpdates.email = email
            if (password) authUpdates.password = password
            if (fullName) authUpdates.user_metadata = { full_name: fullName }

            if (account_status === 'suspended') {
                authUpdates.ban_duration = "8760h" // 1 year
            } else if (account_status === 'active') {
                authUpdates.ban_duration = "none"
            }

            // 1. Auth Update
            if (Object.keys(authUpdates).length > 0) {
                const { error: authError } = await supabaseClient.auth.admin.updateUserById(userId, authUpdates)
                if (authError) throw new Error(`Auth Admin Error: ${authError.message}`)
            }

            // 2. Role Sync
            if (role) {
                const { error: roleErr } = await supabaseClient
                    .from('user_roles')
                    .upsert({ user_id: userId, role: role }, { onConflict: 'user_id' })
                if (roleErr) throw new Error(`Role Error: ${roleErr.message}`)

                // Removed user_type update as it is deprecated
            }

            // 3. Profile Sync
            const profileUpdates: any = {}
            if (fullName) profileUpdates.full_name = fullName
            if (account_status) profileUpdates.account_status = account_status

            if (Object.keys(profileUpdates).length > 0) {
                const { error: profileError } = await supabaseClient.from('users').update(profileUpdates).eq('auth_id', userId)
                if (profileError) throw new Error(`Users Table Error: ${profileError.message}`)
            }

            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // --- Routing ---
        if (req.method === 'POST' || req.method === 'PUT') {
            const body = await req.json().catch(() => ({}))

            // If it's an update (has userId or is PUT)
            if (body.userId || req.method === 'PUT') {
                return await handleUpdate(body)
            }

            // Otherwise, it's a CREATE
            const { email, password, fullName, role } = body
            if (!email || !password || !role) throw new Error("Missing required fields for user creation")

            const { data: user, error: createError } = await supabaseClient.auth.admin.createUser({
                email, password, email_confirm: true, user_metadata: { full_name: fullName }
            })
            if (createError) throw new Error(`Auth Create Error: ${createError.message}`)

            await supabaseClient.from('user_roles').insert({ user_id: user.user.id, role: role })

            // Removed user_type insert as it is deprecated
            await supabaseClient.from('users').insert({
                auth_id: user.user.id,
                email: email,
                full_name: fullName,
                account_status: 'active'
            })

            return new Response(JSON.stringify({ success: true, user: user.user }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        if (req.method === 'DELETE') {
            const { userId } = await req.json().catch(() => ({}))
            if (!userId) throw new Error("Missing userId")
            const { error } = await supabaseClient.auth.admin.deleteUser(userId)
            if (error) throw new Error(`Auth Delete Error: ${error.message}`)
            return new Response(JSON.stringify({ success: true, message: "User deleted" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        throw new Error(`Method ${req.method} not supported`)

    } catch (globalError: any) {
        console.error('Edge Function Error:', globalError.message)
        return new Response(JSON.stringify({ success: false, error: globalError.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 // Always 200 to ensure CORS preflights don't fail during errors
        })
    }
})
