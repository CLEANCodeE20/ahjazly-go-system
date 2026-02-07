import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import * as jose from "https://esm.sh/jose@4"

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')
const SENDER_EMAIL = Deno.env.get('SENDER_EMAIL') || 'rafatkang@gmail.com'
const SENDER_NAME = Deno.env.get('SENDER_NAME') || 'أهجازلي - Ahjazly'
const WHAPI_TOKEN = Deno.env.get('WHAPI_TOKEN')

// Firebase Service Account
const FIREBASE_SERVICE_ACCOUNT = {
    "type": "service_account",
    "project_id": "unified-adviser-408114",
    "private_key_id": "606fe571eedde9e45b1549facada7e62a11e48eb",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQClAdWFnYxq2kTa\nbv/gRdr+jmhKQ5iB9GohxkRfk89oNd6/jmhKQ5iB9GohxkRfk89oNd6/nVT7x/Fm\n7uaG6PFpcy0MpZGvfh2AZmQFNnsjH/rxlrDsj8/Y5tRfxPDoEy3qd0M3h701Zut7\ncbJyqP7VplZeDkPPfOanb4mhzF3OQ/RUJqkYuIz/7Px4s8Lv9dV82pVBVR0pzpuS\nvBn3e7ua06OpRT0SF9Kmp6DbP1Eng1Kbnk7GFnv629aqcoQP99pPLcWuqxXzm73Z\nkAgZ7duotzZawm4+Fh+nfy17EvxXcLCs9lt+DT3u//Mw8Qrf6wltMRbDqT5RYLOT\n7ouFuvW8DdZaZBvlnWTIH7JXpi//ATW9AgMBAAECggEAN3dsXSPepbSFXJ/fZ3ZT\n7SnVqNEcHOMaIgxRw4ceOzuQivzKKnDFlwJLf6IiNH5A8HVfiYxtQlIo4Q+1SNNh\nOYCcLIkTJyhAz4iWKoz37E72y13XnnHgSninsZ9ZOlxVv/wvkzm7FyGJNFhMWB/D\nq93rDaJL02PIYpKavqr2fqc4PyTBQaRTnYDe6Eq030C2AsI2ZlIwX0cG6PvrdksF\nLbeqB/oGi1hN1Zbn5fFQhavCmri39DDy+MFHeiOw7nyGNSF9u4DZnG2XpG0WRrYv\nHY4+nKv81/oT85pvRTNclEQuSvbW1b6RdM+4dtIGjd5xjv87nKjWVcUEWiCm7vCw\nSQKBgQDoBsj5T9tsrI0eKwElE0sVX4DDSWvxJwJCJvHqNaJYgmJZwVlzTsGn0JRA\np0mRpIgeAW64MB2zOb6spWQK36wxz+mJSa2NTqv5ZLeYI1PB4vke9lqsZSkTUCdJ\n5DuFer1gB6Nv/mp1kuwcDX+NYL9gDCV6zxHcUzk6fiFQyNk2rwKBgQC2DlrFfPen\nc88KMzZmWeqGfD6SFnm97DwtyCP7PlAfKNGztyLM4WJVLT+aTBp9HDMSz/FKNRWD\nV3ct6NidDHi7CPTjx/cAxgVJffr0ydOQFbdHa2ILQIy2lRxdleHtgx5dwSVSuLHg\nWYtPb+3n84AclBkWgMZMTUIy+SNu5HH1UwKBgESJ1I4Ir9lvMxRJQcJQ66n5lxCY\nvKD0k+80j9tOUpFwmlrHCYRNLFlE/LYIdGvoPSkX5TvVQsCxewiGpoGrxrLEJske\nEX0fUx+NR8pSDSjFwi8KOIiaLUL+N0zVdVudgRk/yGCJt6rZZpN2zUnW3VEi5WNc\njXsWvl3v6ilx2vATAoGAOtbG1X7/F3qhVn0m+utildZ/7n0fGZfJF07Q+jl4cam\nipL+ymp7ZRggav0aLZRYBF7pnFIG1kz5ogUj5AUDvoBtT8m5FUVWujcMOoaC9JJ\nswIf/9rv9MuxHUGhb/7uBqpwhuhJ62tniaQrE9JbMYG6Rtu00hSbXKiGjm38crYY\nsCgYB72W7JCWA7WIepcBXWpkrGb9m6FPGq6sHk1Cf9M/eUJETVSvonCyI7W2seQ\n+xPBf70qneneDlrIvMl3hSh7E0q4JK6WLIXZa3bFoiknekfWu49vXPnF8jX56ZN\nXk6YePa9KDNZW0odX+utti+DLpju/uNZUthBsMhEOYalCIe/5w==\n-----END PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk-hcjoe@unified-adviser-408114.iam.gserviceaccount.com",
}

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const payload = await req.json()
        console.log('📥 Received payload:', JSON.stringify(payload, null, 2))

        let notificationData
        if (payload.notification_id && payload.auth_id) {
            notificationData = payload
        } else if (payload.record && payload.table === 'notifications') {
            notificationData = payload.record
        } else {
            console.log('⚠️ Unknown payload format, ignoring')
            return new Response(JSON.stringify({ message: "Unknown format" }), { status: 200, headers: corsHeaders })
        }

        const { auth_id, message, title } = notificationData

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Get user details
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('email, phone_number, full_name')
            .eq('auth_id', auth_id)
            .single()

        if (userError || !user) {
            console.error("❌ User not found", userError)
            return new Response(JSON.stringify({ error: "User not found" }), { status: 404, headers: corsHeaders })
        }

        console.log(`👤 User found: ${user.full_name} (Auth ID: ${auth_id})`)

        // Get FCM tokens
        const { data: deviceTokens } = await supabase
            .from('user_device_tokens')
            .select('fcm_token')
            .eq('auth_id', auth_id)

        const tokens = deviceTokens?.map((t: any) => t.fcm_token) || []
        console.log(`🔔 Found ${tokens.length} FCM tokens`)

        const results = []

        // 1. Email via Brevo
        if (user.email && BREVO_API_KEY) {
            const emailRes = await sendEmail(user.email, user.full_name, title || "إشعار جديد", message)
            results.push({ service: 'email', success: emailRes.ok })
            console.log(`📧 Email ${emailRes.ok ? '✅ sent' : '❌ failed'}`)
        }

        // 2. WhatsApp via Whapi
        if (user.phone_number && WHAPI_TOKEN) {
            const waRes = await sendWhatsApp(user.phone_number, message)
            results.push({ service: 'whatsapp', success: waRes.ok })
            console.log(`💬 WhatsApp ${waRes.ok ? '✅ sent' : '❌ failed'}`)
        }

        // 3. FCM Push
        if (tokens.length > 0) {
            try {
                const accessToken = await getFcmAccessToken()
                for (const token of tokens) {
                    const pushRes = await sendPushToToken(token, title || "إشعار جديد", message, accessToken)
                    results.push({ service: 'push', token: token.substring(0, 10) + '...', success: pushRes })
                    console.log(`🔔 Push to ${token.substring(0, 10)}... ${pushRes ? '✅ sent' : '❌ failed'}`)
                }
            } catch (e: any) {
                console.error("❌ FCM Error:", e.name, e.message)
                results.push({ service: 'push', success: false, error: e.message })
            }
        }

        return new Response(JSON.stringify({ success: true, results }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200
        })

    } catch (error: any) {
        console.error("❌ Main Error:", error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500
        })
    }
})

async function sendEmail(email: string, name: string, subject: string, content: string) {
    return await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': BREVO_API_KEY!, 'content-type': 'application/json' },
        body: JSON.stringify({
            sender: { name: SENDER_NAME, email: SENDER_EMAIL },
            to: [{ email, name }],
            subject: subject,
            htmlContent: `<html><body style="direction: rtl; font-family: sans-serif;"><h3>${subject}</h3><p>${content}</p></body></html>`
        })
    })
}

async function sendWhatsApp(phone: string, message: string) {
    return await fetch('https://gate.whapi.cloud/messages/text', {
        method: 'POST',
        headers: { 'authorization': `Bearer ${WHAPI_TOKEN}`, 'content-type': 'application/json' },
        body: JSON.stringify({ to: phone, body: message })
    })
}

// RFC 7468 compliant PEM formatting (64 chars per line)
function formatPKCS8(raw: string) {
    const base64 = raw
        .replace(/-----BEGIN PRIVATE KEY-----/g, '')
        .replace(/-----END PRIVATE KEY-----/g, '')
        .replace(/\\n/g, '')
        .replace(/\s/g, '');

    const lines = base64.match(/.{1,64}/g) || [];
    return `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----`;
}

async function getFcmAccessToken() {
    const formattedKey = formatPKCS8(FIREBASE_SERVICE_ACCOUNT.private_key);
    console.log("🛠️ PKCS8 Formatted. Length:", formattedKey.length);

    try {
        const signingKey = await jose.importPKCS8(formattedKey, 'RS256');
        console.log("🛠️ Key Imported. Signing JWT with jose@4...");

        const jwt = await new jose.SignJWT({
            iss: FIREBASE_SERVICE_ACCOUNT.client_email,
            scope: "https://www.googleapis.com/auth/cloud-platform",
            aud: "https://oauth2.googleapis.com/token",
            exp: Math.floor(Date.now() / 1000) + 3600,
            iat: Math.floor(Date.now() / 1000),
        })
            .setProtectedHeader({ alg: 'RS256' })
            .sign(signingKey);

        const res = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
        });

        const data = await res.json();
        if (!data.access_token) throw new Error("Google Token Error: " + (data.error_description || data.error));
        return data.access_token;
    } catch (e) {
        console.error("❌ Critical Signing Error:", e);
        throw e;
    }
}

async function sendPushToToken(fcmToken: string, title: string, body: string, accessToken: string) {
    const response = await fetch(`https://fcm.googleapis.com/v1/projects/${FIREBASE_SERVICE_ACCOUNT.project_id}/messages:send`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: {
                token: fcmToken,
                notification: { title, body }
            }
        })
    })
    return response.ok;
}
