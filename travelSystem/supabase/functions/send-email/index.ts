import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')
const SENDER_EMAIL = Deno.env.get('SENDER_EMAIL') || 'no-reply@travelsystem.com'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            },
        })
    }

    try {
        const { email, name } = await req.json()

        if (!BREVO_API_KEY) throw new Error('Missing BREVO_API_KEY')

        // 1. Generate Random Code (Server Side)
        const code = Math.floor(100000 + Math.random() * 900000).toString()

        // 2. Save Code to DB (using Admin Client)
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
            auth: { autoRefreshToken: false, persistSession: false }
        })

        const { error: dbError } = await supabaseAdmin
            .from('users')
            .update({ verification_code: code })
            .eq('email', email)

        if (dbError) {
            throw new Error(`Database Error: ${dbError.message}`)
        }

        // 3. Send Email via Brevo
        const res = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'api-key': BREVO_API_KEY,
                'Content-Type': 'application/json',
                'accept': 'application/json'
            },
            body: JSON.stringify({
                sender: { name: "Travel System", email: SENDER_EMAIL },
                to: [{ email: email, name: name }],
                subject: "كود التحقق الخاص بك",
                htmlContent: `
          <div style="font-family: Arial, sans-serif; padding: 20px; text-align: right; direction: rtl;">
            <h2>مرحباً ${name}</h2>
            <p>طلب جديد للتحقق.</p>
            <p>كود التحقق الخاص بك هو:</p>
            <h1 style="color: #4CAF50; letter-spacing: 5px;">${code}</h1>
            <p>صلاحية الكود محدودة.</p>
          </div>
        `
            })
        })

        if (!res.ok) {
            const data = await res.json()
            throw new Error(`Brevo Error: ${JSON.stringify(data)}`)
        }

        return new Response(
            JSON.stringify({ message: 'Code generated and email sent successfully' }),
            { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } },
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } },
        )
    }
})
