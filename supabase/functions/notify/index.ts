import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"
import jsrsasign from "https://esm.sh/jsrsasign@11.0.0"

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')
const SENDER_EMAIL = Deno.env.get('SENDER_EMAIL') || 'rafatkang@gmail.com'
const SENDER_NAME = Deno.env.get('SENDER_NAME') || 'Travel System'
const WHAPI_TOKEN = Deno.env.get('WHAPI_TOKEN')

// Lenient JSON parser for malformed secrets (unquoted keys/values)
function lenientParse(str: string) {
    try {
        return JSON.parse(str);
    } catch (e) {
        console.error("⚠️ JSON.parse failed, attempting lenient parse...");
        let fixed = str.trim();

        // Fix unquoted keys: {key: -> {"key":
        fixed = fixed.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');

        // Fix unquoted values (simple ones without special chars)
        // We avoid touching values that already have quotes or look like numbers/booleans
        fixed = fixed.replace(/:\s*([^"{\[\]\s,][^,}\]]*)/g, (match, value) => {
            const trimmedValue = value.trim();
            if (trimmedValue === 'true' || trimmedValue === 'false' || trimmedValue === 'null' || !isNaN(Number(trimmedValue))) {
                return `: ${trimmedValue}`;
            }
            return `: "${trimmedValue}"`;
        });

        try {
            return JSON.parse(fixed);
        } catch (e2: any) {
            console.error("❌ Lenient parse also failed:", e2.message);
            throw e; // throw original error
        }
    }
}

// Get Firebase Service Account from Environment Variable
const FIREBASE_SERVICE_ACCOUNT_RAW = Deno.env.get('FIREBASE_SERVICE_ACCOUNT')
let FIREBASE_SERVICE_ACCOUNT: any = {}

if (FIREBASE_SERVICE_ACCOUNT_RAW) {
    try {
        const preview = FIREBASE_SERVICE_ACCOUNT_RAW.substring(0, 50).replace(/\n/g, '\\n')
        console.error(`🔍 DEBUG: Raw secret starts with: "${preview}..."`)

        let cleanJson = FIREBASE_SERVICE_ACCOUNT_RAW.trim()
        if (cleanJson.startsWith("'") && cleanJson.endsWith("'")) {
            cleanJson = cleanJson.substring(1, cleanJson.length - 1)
        }

        FIREBASE_SERVICE_ACCOUNT = lenientParse(cleanJson)
        console.error("✅ FIREBASE_SERVICE_ACCOUNT parsed successfully")
    } catch (e: any) {
        console.error("❌ Error parsing FIREBASE_SERVICE_ACCOUNT:", e.message)
    }
}

serve(async (req) => {
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
            return new Response(JSON.stringify({ message: "Unknown format" }), { status: 200 })
        }

        const { auth_id, email: directEmail, name: directName, message, title } = notificationData

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        let user = null;
        if (directEmail) {
            console.log(`📧 Using direct email: ${directEmail}`);
            user = {
                email: directEmail,
                full_name: directName || 'User',
                phone_number: null,
                auth_id: auth_id || null
            }
        } else if (auth_id) {
            const { data: dbUser, error: userError } = await supabase
                .from('users')
                .select('email, phone_number, full_name')
                .eq('auth_id', auth_id)
                .single()

            if (userError || !dbUser) {
                console.error("❌ User not found", userError)
                return new Response(JSON.stringify({ error: "User not found" }), { status: 404 })
            }
            user = dbUser;
        } else {
            return new Response(JSON.stringify({ error: "Missing recipient (auth_id or email)" }), { status: 400 })
        }

        console.log(`👤 User found: ${user.full_name} (ID: ${auth_id?.substring(0, 8)}...)`)

        // Get FCM tokens
        const { data: deviceTokens, error: tokensError } = await supabase
            .from('user_device_tokens')
            .select('fcm_token')
            .eq('auth_id', auth_id)

        if (tokensError) console.error("❌ Error fetching tokens:", tokensError)
        const tokens = deviceTokens?.map((t: any) => t.fcm_token) || []
        console.log(`🔔 Found ${tokens.length} FCM tokens`)

        const results = []

        // 1. Email via Brevo
        if (user.email && BREVO_API_KEY) {
            console.log('📧 Sending email...')
            const emailRes = await sendEmail(user.email, user.full_name, title || "إشعار جديد", message)
            results.push({ service: 'email', success: emailRes.ok })
        }

        // 2. WhatsApp via Whapi
        if (user.phone_number && WHAPI_TOKEN) {
            console.log('💬 Sending WhatsApp...')
            const waRes = await sendWhatsApp(user.phone_number, message)
            results.push({ service: 'whatsapp', success: waRes.ok })
        }

        // 3. FCM Push
        if (tokens.length > 0 && FIREBASE_SERVICE_ACCOUNT.project_id) {
            console.log(`🔔 Preparing FCM push...`)
            try {
                const accessToken = await getAccessToken()
                for (const token of tokens) {
                    const pushRes = await sendPushToToken(token, title || "إشعار جديد", message, accessToken)
                    results.push({ service: 'push', token: token.substring(0, 10) + '...', success: pushRes })
                    console.log(`🔔 Push to ${token.substring(0, 10)}... ${pushRes ? '✅ sent' : '❌ failed'}`)
                }
            } catch (fcmError: any) {
                console.error("❌ FCM Auth Error:", fcmError.message)
                results.push({ service: 'push', success: false, error: fcmError.message })
            }
        } else if (tokens.length > 0) {
            console.error("❌ FIREBASE_SERVICE_ACCOUNT not configured correctly")
            results.push({ service: 'push', success: false, error: "FCM not configured" })
        }

        return new Response(JSON.stringify({
            success: true,
            user: { id: auth_id, name: user.full_name },
            results
        }), {
            headers: { "Content-Type": "application/json" },
            status: 200
        })

    } catch (error: any) {
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

async function getAccessToken() {
    try {
        console.error("🔑 [1] getAccessToken started");

        let privateKey = FIREBASE_SERVICE_ACCOUNT.private_key;
        const clientEmail = FIREBASE_SERVICE_ACCOUNT.client_email;

        if (!privateKey || !clientEmail) {
            throw new Error("Missing private_key or client_email in service account");
        }

        // Clean the private key: replace literal \n with actual newlines
        if (privateKey.includes('\\n')) {
            privateKey = privateKey.replace(/\\n/g, '\n');
        }

        console.error("🔑 [2] Preparing JWT Claims...");

        const header = { alg: "RS256", typ: "JWT" };
        const now = Math.floor(Date.now() / 1000);
        const payload = {
            iss: clientEmail,
            scope: "https://www.googleapis.com/auth/cloud-platform",
            aud: "https://oauth2.googleapis.com/token",
            exp: now + 3600,
            iat: now,
        };

        console.error("🔑 [3] Signing JWT (Pure JS)...");

        const jwt = jsrsasign.KJUR.jws.JWS.sign(
            "RS256",
            JSON.stringify(header),
            JSON.stringify(payload),
            privateKey
        );

        if (!jwt) throw new Error("JWT signing failed");

        console.error("🔑 [4] JWT signed. Fetching token from Google...");

        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion: jwt,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Google OAuth Error Response:", errorText);
            throw new Error(`Google OAuth Error: ${errorText}`);
        }

        const data = await response.json();
        console.error("🔑 [5] FCM Access Token retrieved successfully.");
        return data.access_token;
    } catch (error: any) {
        console.error("❌ Error getting FCM access token:", error.message)
        throw error
    }
}

async function sendPushToToken(fcmToken: string, title: string, body: string, accessToken: string) {
    try {
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
