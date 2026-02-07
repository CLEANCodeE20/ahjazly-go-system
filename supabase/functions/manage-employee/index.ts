
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

// Robust role mapper for Arabic UI strings
const mapRoleToEn = (role: string): string => {
    const mapping: Record<string, string> = {
        'مدير فرع': 'manager',
        'محاسب': 'accountant',
        'مشرف': 'supervisor',
        'سائق': 'driver',
        'مساعد': 'assistant',
        'دعم فني': 'support',
        'PARTNER_ADMIN': 'PARTNER_ADMIN',
        'SUPERUSER': 'SUPERUSER'
    };
    return mapping[role] || role;
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || "";
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY') || "";

        if (!supabaseUrl || !supabaseKey) throw new Error("Configuration Error: Missing Service Key");

        const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        const payload = await req.json();
        const { action, auth_id, email, password, full_name, role_in_company, branch_id, partner_id, phone_number, status } = payload;

        const mappedRole = mapRoleToEn(role_in_company || 'support');
        const finalPartnerId = partner_id ? parseInt(partner_id.toString()) : null;

        if (action === 'create') {
            if (!email || !password || !finalPartnerId) throw new Error("Missing required fields (email, password, partner_id)");

            // 1. Create Auth User
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: {
                    full_name,
                    phone_number,
                    partner_id: finalPartnerId
                }
            });

            if (authError) throw authError;
            const authId = authData.user.id;

            // 2. Sync Public Profile (users table)
            const { error: profileError } = await supabaseAdmin.from('users').upsert({
                auth_id: authId,
                email,
                full_name,
                phone_number,
                partner_id: finalPartnerId,
                account_status: 'active'
            }, { onConflict: 'auth_id' });

            if (profileError) throw profileError;

            // 3. Sync Roles
            const { error: roleError } = await supabaseAdmin.from('user_roles').upsert({
                auth_id: authId,
                role: mappedRole,
                partner_id: finalPartnerId
            }, { onConflict: 'auth_id' });

            if (roleError) throw roleError;

            // 4. Update JWT Metadata (Critical for Partner-Aware RLS)
            await supabaseAdmin.auth.admin.updateUserById(authId, {
                app_metadata: {
                    role: mappedRole,
                    partner_id: finalPartnerId
                }
            });

            // 5. Insert Employee record
            const { error: empError } = await supabaseAdmin.from('employees').insert({
                auth_id: authId,
                full_name,
                email,
                phone_number,
                branch_id: branch_id ? parseInt(branch_id.toString()) : null,
                role_in_company: mappedRole,
                partner_id: finalPartnerId,
                status: 'active'
            });

            if (empError) throw empError;

            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (action === 'update') {
            if (!auth_id) throw new Error("Missing auth_id for update");

            // Update Auth
            const authUpdates: any = { user_metadata: { full_name, phone_number } };
            if (password) authUpdates.password = password;
            if (email) authUpdates.email = email;

            await supabaseAdmin.auth.admin.updateUserById(auth_id, authUpdates);

            // Update Roles
            await supabaseAdmin.from('user_roles').upsert({
                auth_id,
                role: mappedRole,
                partner_id: finalPartnerId
            }, { onConflict: 'auth_id' });

            // Update Employee
            const { error: empError } = await supabaseAdmin.from('employees').update({
                full_name,
                phone_number,
                branch_id: branch_id ? parseInt(branch_id.toString()) : null,
                role_in_company: mappedRole,
                status: status || 'active',
                email
            }).eq('auth_id', auth_id);

            if (empError) throw empError;

            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: corsHeaders });

    } catch (e: any) {
        console.error("Manage-Employee Error:", e);
        return new Response(JSON.stringify({
            success: false,
            error: e.message || "Unknown error",
            details: e.details || e.hint || null
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
});
