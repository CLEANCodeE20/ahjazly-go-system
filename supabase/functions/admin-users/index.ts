import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, prefer',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400',
}

Deno.serve(async (req) => {
    // 1. Handle Preflight (Browser asks for permission before sending the real request)
    if (req.method === 'OPTIONS') {
        console.log('[AdminUsers] Handling OPTIONS preflight');
        return new Response('ok', {
            headers: corsHeaders,
            status: 200
        })
    }

    try {
        console.log(`[AdminUsers] Received ${req.method} request`);

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Function handleUpdate defined inside to capture supabaseClient
        const handleUpdate = async (body: any) => {
            const { userId, email, password, fullName, role, account_status, partnerId } = body
            console.log(`[AdminUsers] Starting update for UserID: ${userId}`);

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
                console.log(`[AdminUsers] Updating Auth settings for ${userId}...`);
                const { error: authError } = await supabaseClient.auth.admin.updateUserById(userId, authUpdates)
                if (authError) throw new Error(`Auth Admin Error: ${authError.message}`)
            }

            // 2. Role Sync (Exclusive Upsert)
            if (role) {
                console.log(`[AdminUsers] Syncing role: ${role} for ${userId}`);
                const { error: roleErr } = await supabaseClient
                    .from('user_roles')
                    .upsert({
                        auth_id: userId,
                        role: role,
                        partner_id: partnerId || null
                    }, {
                        onConflict: 'auth_id'
                    })
                if (roleErr) throw new Error(`Role Error: ${roleErr.message}`)
            }

            // 3. Profile Sync
            const profileUpdates: any = {}
            if (fullName) profileUpdates.full_name = fullName
            if (account_status) profileUpdates.account_status = account_status
            if (email) profileUpdates.email = email
            if (partnerId) profileUpdates.partner_id = partnerId

            if (Object.keys(profileUpdates).length > 0) {
                console.log(`[AdminUsers] Syncing Profile for ${userId}...`);
                const { error: profileError } = await supabaseClient
                    .from('users')
                    .update(profileUpdates)
                    .eq('auth_id', userId)
                if (profileError) throw new Error(`Users Table Error: ${profileError.message}`)
            }

            console.log(`[AdminUsers] Update successful for UserID: ${userId}`);
            return new Response(JSON.stringify({ success: true }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // --- Routing ---
        if (req.method === 'POST' || req.method === 'PUT') {
            const body = await req.json().catch(() => ({}))
            console.log(`[AdminUsers] Request received:`, { ...body, password: '***' });

            // If it's an update (has userId or is PUT)
            if (body.userId || req.method === 'PUT') {
                return await handleUpdate(body)
            }

            // Otherwise, it's a CREATE
            const { email, password, fullName, role, partnerId } = body
            console.log(`[AdminUsers] Creating new user: ${email}`);

            if (!email || !password || !role) throw new Error("Missing required fields for user creation")

            // IMPORTANT: We ONLY create the user in Auth.
            // Our database trigger 'on_auth_user_created' in public.handle_universal_identity()
            // will automatically create the record in public.users, user_roles, and wallets.
            const { data: user, error: createError } = await supabaseClient.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: {
                    full_name: fullName,
                    partner_id: partnerId // Trigger uses this
                }
            })
            if (createError) throw new Error(`Auth Create Error: ${createError.message}`)

            // If a specific role (other than the default) was requested, we update it after the trigger
            if (role && role !== 'TRAVELER') {
                console.log(`[AdminUsers] Setting custom role: ${role}`);
                const { error: roleErr } = await supabaseClient
                    .from('user_roles')
                    .upsert({ auth_id: user.user.id, role: role, partner_id: partnerId || null }, { onConflict: 'auth_id' })
                if (roleErr) console.warn('[AdminUsers] Warning: Role override failed:', roleErr.message)
            }

            console.log(`[AdminUsers] User creation successful: ${email}`);
            return new Response(JSON.stringify({ success: true, user: user.user }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        if (req.method === 'DELETE') {
            const { userId } = await req.json().catch(() => ({}))
            console.log(`[AdminUsers] Deleting user: ${userId}`);

            if (!userId) throw new Error("Missing userId")
            const { error } = await supabaseClient.auth.admin.deleteUser(userId)
            if (error) throw new Error(`Auth Delete Error: ${error.message}`)
            return new Response(JSON.stringify({ success: true, message: "User deleted" }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        throw new Error(`Method ${req.method} not supported`)

    } catch (globalError: any) {
        console.error('[AdminUsers] Global Error Catch:', globalError.message)
        return new Response(JSON.stringify({ success: false, error: globalError.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 // Always 200 to ensure CORS preflights don't fail during errors
        })
    }
})
