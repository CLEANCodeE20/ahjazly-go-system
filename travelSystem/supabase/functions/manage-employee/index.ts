
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

Deno.serve(async (req) => {
    // 1. Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        console.log("Function invoked:", req.method);

        // 2. Setup Supabase Client
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        // Check all possible secret names
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ||
            Deno.env.get('SERVICE_ROLE_KEY') ||
            Deno.env.get('SUPABASE_SERVICE_KEY');

        if (!supabaseUrl || !supabaseKey) {
            console.error("Critical: Missing Secrets");
            throw new Error("Configuration Error: Missing Service Key");
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // 3. Parse Body
        let payload: any = {};
        try {
            const text = await req.text();
            if (text) payload = JSON.parse(text);
        } catch (e) {
            console.error("Body parse error:", e);
            return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: corsHeaders });
        }

        const { action, user_id, email, password, full_name, role_in_company, branch_id, partner_id, phone_number, status } = payload;

        console.log("Action:", action, "User ID:", user_id);

        if (action === 'create') {
            if (!email || !password || !partner_id) throw new Error("Missing required fields");

            // Check existence
            const { data: users } = await supabaseAdmin.from('users').select('user_id').eq('email', email).maybeSingle();
            if (users) throw new Error("User with this email already exists");

            // Create Auth
            let authId;
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { full_name, phone_number, partner_id }
            });

            if (authError) {
                if (authError.message?.includes("already been registered")) {
                    console.log("User already exists in Auth, attempting to adopt orphan user...");

                    // Use RPC to get ID (Robust method)
                    // We try RPC first, if it fails (not defined), we fall back to listUsers or error.
                    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('get_auth_id_by_email', { email_input: email });

                    if (!rpcError && rpcData) {
                        authId = rpcData;
                    } else {
                        // Fallback or Error
                        console.error("RPC failed:", rpcError);
                        // If RPC not found/failed, throw original error or listUsers error
                        throw new Error(`Could not find existing user ID for '${email}'. Please verify the SQL helper function is installed.`);
                    }

                    // Optional: Update password if provided
                    if (password) {
                        await supabaseAdmin.auth.admin.updateUserById(authId, { password });
                    }
                } else {
                    throw authError; // Some other error
                }
            } else {
                authId = authData.user.id;
            }

            // Explicitly create/upsert the public user record to ensure it exists and has correct type
            // This bypasses any potential race conditions with database triggers
            const { data: profile, error: profileError } = await supabaseAdmin
                .from('users')
                .upsert({
                    auth_id: authId,
                    email: email,
                    full_name: full_name,
                    phone_number: phone_number,
                    partner_id: partner_id,
                    account_status: 'active'
                }, { onConflict: 'auth_id' })
                .select('user_id')
                .single();

            if (profileError || !profile) {
                console.error("Profile Upsert Failed:", profileError);
                // Try to clean up auth user if profile creation fails
                await supabaseAdmin.auth.admin.deleteUser(authId);
                throw new Error("Failed to create user profile in database");
            }

            // Assign Role in user_roles (Critical for RBAC)
            const { error: roleError } = await supabaseAdmin.from('user_roles').upsert({
                user_id: authId,
                role: 'employee',
                partner_id: partner_id
            }, { onConflict: 'user_id' });

            if (roleError) {
                console.error("Role Assignment Failed:", roleError);
                // We don't block here, but log it critically
            }

            // Insert Employee
            const { error: empError } = await supabaseAdmin.from('employees').insert({
                user_id: profile.user_id,
                full_name,
                email,
                phone_number,
                branch_id,
                role_in_company,
                partner_id,
                status: 'active'
            });

            if (empError) throw empError;

            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (action === 'update') {
            if (!user_id) throw new Error("Missing user_id");

            // Resolve Auth ID
            let authId = null;
            // Check if user_id is integer (from DB)
            if (String(user_id).length < 30) {
                const { data: u } = await supabaseAdmin.from('users').select('auth_id').eq('user_id', user_id).single();
                authId = u?.auth_id;
            } else {
                authId = user_id; // It was a UUID
            }

            if (authId) {
                const updates: any = { user_metadata: { full_name, phone_number } };
                if (email) { updates.email = email; updates.email_confirm = true; }
                if (password) updates.password = password;

                await supabaseAdmin.auth.admin.updateUserById(authId, updates);
            }

            // Update Employee Record
            await supabaseAdmin.from('employees').update({
                full_name, phone_number, branch_id, role_in_company, status, email
            }).eq('user_id', user_id);

            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (action === 'delete') {
            if (!user_id) throw new Error("Missing user_id");

            // Resolve Auth ID
            let authId = null;
            if (String(user_id).length < 30) {
                const { data: u } = await supabaseAdmin.from('users').select('auth_id').eq('user_id', user_id).single();
                authId = u?.auth_id;
            }

            await supabaseAdmin.from('employees').delete().eq('user_id', user_id);
            await supabaseAdmin.from('user_roles').delete().eq('user_id', user_id);

            if (authId) {
                await supabaseAdmin.auth.admin.deleteUser(authId);
            }

            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: corsHeaders });

    } catch (e: any) {
        console.error("Function Error:", e);
        // ALWAYS return 200 with error property to prevent generic client errors
        return new Response(JSON.stringify({ success: false, error: e.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });
    }
});
