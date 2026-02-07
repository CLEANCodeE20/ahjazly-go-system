import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { JWT } from "npm:google-auth-library@8.7.0"

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')
const SENDER_EMAIL = Deno.env.get('SENDER_EMAIL') || 'rafatkang@gmail.com'
const SENDER_NAME = Deno.env.get('SENDER_NAME') || 'Travel System'
const WHAPI_TOKEN = Deno.env.get('WHAPI_TOKEN')

// Firebase Service Account - Standardized format for RSA compatibility
const FIREBASE_SERVICE_ACCOUNT = {
    "type": "service_account",
    "project_id": "unified-adviser-408114",
    "private_key_id": "606fe571eedde9e45b1549facada7e62a11e48eb",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQClAdWFnYxq2kTa\nbv/gRdr+jmhKQ5iB9GohxkRfk89oNd6/nVT7x/Fm7uaG6PFpcy0MpZGvfh2AZmQF\nNnsjH/rxlrDsj8/Y5tRfxPDoEy3qd0M3h701Zut7cbJyqP7VplZeDkPPfOanb4mh\nzF3OQ/RUJqkYuIz/7Px4s8Lv9dV82pVBVR0pzpuSvBn3e7ua06OpRT0SF9Kmp6Db\nP1Eng1Kbnk7GFnv629aqcoQP99pPLcWuqxXzm73ZkAgZ7duotzZawm4+Fh+nfy17\nEvxXcLCs9lt+DT3u//Mw8Qrf6wltMRbDqT5RYLOT7ouFuvW8DdZaZBvlnWTIH7JX\npi//ATW9AgMBAAECggEAN3dsXSPepbSFXJ/fZ3ZT7SnVqNEcHOMaIgxRw4ceOzuQ\nivzKKnDFlwJLf6IiNH5A8HVfiYxtQlIo4Q+1SNNhOYCcLIkTJyhAz4iWKoz37E72\ny13XnnHgSninsZ9ZOlxVv/wvkzm7FyGJNFhMWB/Dq93rDaJL02PIYpKavqr2fqc4\nPyTBQaRTnYDe6Eq030C2AsI2ZlIwX0cG6PvrdksFLbeqB/oGi1hN1Zbn5fFQhavC\nmri39DDy+MFHeiOw7nyGNSF9u4DZnG2XpG0WRrYvHY4+nKv81/oT85pvRTNclEQu\nSvbW1b6RdM+4dtIGjd5xjv87nKjWVcUEWiCm7vCwSQKBgQDoBsj5T9tsrI0eKwEl\nE0sVX4DDSWvxJwJCJvHqNaJYgmJZwVlzTsGn0JRAp0mRpIgeAW64MB2zOb6spWQK\n36wxz+mJSa2NTqv5ZLeYI1PB4vke9lqsZSkTUCdJ5DuFer1gB6Nv/mp1kuwcDX+N\nYL9gDCV6zxHcUzk6fiFQyNk2rwKBgQC2DlrFfPenc88KMzZmWeqGfD6SFnm97Dwt\nyCP7PlAfKNGztyLM4WJVLT+aTBp9HDMSz/FKNRWDV3ct6NidDHi7CPTjx/cAxgVJ\nffr0ydOQFbdHa2ILQIy2lRxdleHtgx5dwSVSuLHgWYtPb+3n84AclBkWgMZMTUIy\n+SNu5HH1UwKBgESJ1I4Ir9lvMxRJQcJQ66n5lxCYvKD0k+80j9tOUpFwmlrHCYRN\nLFlE/LYIdGvoPSkX5TvVQsCxewiGpoGrxrLEJskeEX0fUx+NR8pSDSjFwi8KOIia\nLUL+N0zVdVudgRk/yGCJt6rZZpN2zUnW3VEi5WNcjXsWvl3v6ilx2vATAoGAOtbG\n1X7/F3qhVn0m+utildZ/7n0fGZfJF07Q+jl4camipL+ymp7ZRggav0aLZRYBF7pn\nFIG1kz5ogUj5AUDvoBtT8m5FUVWujcMOoaC9JJswIf/9rv9MuxHUGhb/7uBqpwhu\nhJ62tniaQrE9JbMYG6Rtu00hSbXKiGjm38crYYsCgYB72W7JCWA7WIepcBXWpkrG\nb9m6FPGq6sHk1Cf9M/eUJETVSvonCyI7W2seQ+xPBf70qneneDlrIvMl3hSh7E0q\n4JK6WLIXZa3bFoiknekfWu49vXPnF8jX56ZNXk6YePa9KDNZW0odX+utti+DLpju\n/uNZUthBsMhEOYalCIe/5w==\n-----END PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk-hcjoe@unified-adviser-408114.iam.gserviceaccount.com",
    "client_id": "103228384808093567951",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-hcjoe%40unified-adviser-408114.iam.gserviceaccount.com",
    "universe_domain": "googleapis.com"
}

Deno.serve(async (req) => {
    try {
        const payload = await req.json()
        console.log('📥 Received payload:', JSON.stringify(payload, null, 2))

        // Support both webhook formats
        let notificationData

        // Format 1: From enhanced webhook (direct notification fields)
        if (payload.notification_id && payload.user_id) {
            notificationData = payload
        }
        // Format 2: From old webhook (nested in record)
        else if (payload.record && payload.table === 'notifications') {
            notificationData = payload.record
        }
        else {
            console.log('⚠️ Unknown payload format, ignoring')
            return new Response(JSON.stringify({ message: "Unknown format" }), { status: 200 })
        }

        const { user_id, message, title } = notificationData

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Get user details
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('email, phone_number, full_name')
            .eq('user_id', user_id)
            .single()

        if (userError || !user) {
            console.error("❌ User not found", userError)
            return new Response(JSON.stringify({ error: "User not found" }), { status: 404 })
        }

        console.log(`👤 User found: ${user.full_name} (ID: ${user_id})`)
        console.log(`📧 Email: ${user.email || 'N/A'}`)
        console.log(`📱 Phone: ${user.phone_number || 'N/A'}`)

        // Get FCM tokens from user_device_tokens table
        const { data: deviceTokens, error: tokensError } = await supabase
            .from('user_device_tokens')
            .select('fcm_token')
            .eq('user_id', user_id)

        if (tokensError) console.error("❌ Error fetching tokens:", tokensError)
        const tokens = deviceTokens?.map((t: any) => t.fcm_token) || []
        console.log(`🔔 Found ${tokens.length} FCM tokens`)

        const results = []

        // 1. Email via Brevo
        if (user.email && BREVO_API_KEY) {
            console.log('📧 Sending email...')
            const emailRes = await sendEmail(user.email, user.full_name, title || "إشعار جديد", message)
            const emailSuccess = emailRes.ok
            results.push({ service: 'email', success: emailSuccess })
            console.log(`📧 Email ${emailSuccess ? '✅ sent' : '❌ failed'}`)
        } else {
            console.log('⏭️ Skipping email (missing email or BREVO_API_KEY)')
        }

        // 2. WhatsApp via Whapi
        if (user.phone_number && WHAPI_TOKEN) {
            console.log('💬 Sending WhatsApp...')
            const waRes = await sendWhatsApp(user.phone_number, message)
            const waSuccess = waRes.ok
            results.push({ service: 'whatsapp', success: waSuccess })
            console.log(`💬 WhatsApp ${waSuccess ? '✅ sent' : '❌ failed'}`)
        } else {
            console.log('⏭️ Skipping WhatsApp (missing phone or WHAPI_TOKEN)')
        }

        // 3. FCM Push Notification (using tokens from user_device_tokens table)
        if (tokens.length > 0 && FIREBASE_SERVICE_ACCOUNT.project_id) {
            console.log(`🔔 Sending FCM push to ${tokens.length} devices...`)
            for (const token of tokens) {
                const pushRes = await sendPushToToken(token, title || "إشعار جديد", message)
                results.push({ service: 'push', token: token.substring(0, 10) + '...', success: pushRes })
                console.log(`🔔 Push to ${token.substring(0, 10)}... ${pushRes ? '✅ sent' : '❌ failed'}`)
            }
        } else {
            if (tokens.length === 0) {
                console.log('⏭️ Skipping push: User has no device tokens')
            } else {
                console.log('⏭️ Skipping push: Firebase not configured')
            }
        }

        console.log('✅ Notification dispatch completed:', results)

        return new Response(JSON.stringify({
            success: true,
            user: { id: user_id, name: user.full_name },
            results
        }), {
            headers: { "Content-Type": "application/json" },
            status: 200
        })

    } catch (error) {
        console.error("❌ Main Error:", error)
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
})

async function sendEmail(email: string, name: string, subject: string, content: string) {
    return await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': BREVO_API_KEY!,
            'content-type': 'application/json'
        },
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
        headers: {
            'accept': 'application/json',
            'authorization': `Bearer ${WHAPI_TOKEN}`,
            'content-type': 'application/json'
        },
        body: JSON.stringify({ to: phone, body: message })
    })
}

const normalizeKey = (key: string) => {
    // 1. Remove any wrapping quotes that might have survived
    let cleaned = key.trim();
    if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
        cleaned = cleaned.substring(1, cleaned.length - 1);
    }

    // 2. Handle both literal newlines and escaped \n sequences
    cleaned = cleaned.replace(/\\n/g, '\n');

    // 3. Ensure the header and footer are exactly correct (no missing spaces)
    if (!cleaned.includes('-----BEGIN PRIVATE KEY-----') && cleaned.includes('-----BEGINPRIVATEKEY-----')) {
        cleaned = cleaned.replace('-----BEGINPRIVATEKEY-----', '-----BEGIN PRIVATE KEY-----');
    }
    if (!cleaned.includes('-----END PRIVATE KEY-----') && cleaned.includes('-----ENDPRIVATEKEY-----')) {
        cleaned = cleaned.replace('-----ENDPRIVATEKEY-----', '-----END PRIVATE KEY-----');
    }

    return cleaned;
}

async function getAccessToken() {
    try {
        const rawKey = FIREBASE_SERVICE_ACCOUNT.private_key;
        const formattedKey = normalizeKey(rawKey);

        console.log(`🔑 Key Diagnostics: Len=${formattedKey.length}, StartsWith="${formattedKey.substring(0, 25)}...", EndsWith="...${formattedKey.substring(formattedKey.length - 25)}"`);

        const client = new JWT({
            email: FIREBASE_SERVICE_ACCOUNT.client_email,
            key: formattedKey,
            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        })
        const token = await client.getAccessToken()
        return token.token
    } catch (error: any) {
        console.error("❌ Error getting FCM access token:", error.message)
        throw error
    }
}

// Updated to send push to single token from users table
async function sendPushToToken(fcmToken: string, title: string, body: string) {
    try {
        const accessToken = await getAccessToken()
        const projectId = FIREBASE_SERVICE_ACCOUNT.project_id

        const response = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: {
                    token: fcmToken,
                    notification: { title, body },
                    data: {
                        click_action: "FLUTTER_NOTIFICATION_CLICK",
                        type: "notification"
                    },
                    android: {
                        priority: "high",
                        notification: {
                            channel_id: "high_importance_channel",
                            priority: "high",
                            notification_priority: "PRIORITY_MAX",
                            sound: "default",
                            default_sound: true,
                            default_vibrate_timings: true,
                        }
                    },
                    apns: {
                        payload: {
                            aps: {
                                alert: { title, body },
                                sound: "default",
                                badge: 1,
                                "content-available": 1
                            }
                        },
                        headers: {
                            "apns-priority": "10"
                        }
                    }
                }
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error(`❌ FCM API Error [${response.status}]:`, errorText)
        }

        return response.ok
    } catch (error: any) {
        console.error('❌ FCM Request Exception:', error.message)
        return false
    }
}
