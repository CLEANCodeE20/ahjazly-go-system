import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY")
const SENDER_EMAIL = Deno.env.get("SENDER_EMAIL") || "noreply@ahjazly.com"
const SENDER_NAME = Deno.env.get("SENDER_NAME") || "احجزلي"
const WHAPI_TOKEN = Deno.env.get("WHAPI_TOKEN")

Deno.serve(async (req) => {
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

        const { type, contact } = await req.json()

        if (!type || !contact) {
            throw new Error('Missing required fields: type and contact')
        }

        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString()

        // Get user_id
        const { data: userData } = await supabaseClient
            .from('users')
            .select('user_id, full_name')
            .eq('auth_id', user.id)
            .single()

        if (!userData) {
            throw new Error('User profile not found')
        }

        // Store verification code
        const expiresAt = new Date()
        expiresAt.setMinutes(expiresAt.getMinutes() + 10) // 10 minutes expiry

        const { error: insertError } = await supabaseClient
            .from('user_verification_codes')
            .insert({
                user_id: userData.user_id,
                auth_id: user.id,
                code: code,
                verification_type: type,
                contact_info: contact,
                expires_at: expiresAt.toISOString()
            })

        if (insertError) throw insertError

        // Send verification code
        if (type === 'email') {
            // Send email via Brevo
            if (!BREVO_API_KEY) {
                throw new Error('Email service not configured (BREVO_API_KEY missing)')
            }

            const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'api-key': BREVO_API_KEY,
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    sender: { name: SENDER_NAME, email: SENDER_EMAIL },
                    to: [{ email: contact, name: userData.full_name || 'عزيزي المستخدم' }],
                    subject: 'رمز التحقق - احجزلي',
                    htmlContent: `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2563eb; margin: 0;">احجزلي</h1>
                <p style="color: #6b7280; margin: 5px 0;">نظام حجز التذاكر</p>
              </div>
              
              <div style="background: #f9fafb; border-radius: 12px; padding: 30px; margin: 20px 0;">
                <h2 style="color: #1f2937; margin-top: 0;">مرحباً ${userData.full_name || 'عزيزي المستخدم'},</h2>
                <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                  رمز التحقق الخاص بك هو:
                </p>
                
                <div style="background: white; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
                  <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #2563eb; font-family: monospace;">
                    ${code}
                  </div>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                  ⏱️ هذا الرمز صالح لمدة <strong>10 دقائق</strong> فقط.
                </p>
              </div>
              
              <div style="background: #fef3c7; border-right: 4px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                  <strong>⚠️ تنبيه أمني:</strong> إذا لم تطلب هذا الرمز، يرجى تجاهل هذه الرسالة وعدم مشاركتها مع أي شخص.
                </p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <div style="text-align: center;">
                <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">
                  هذه رسالة تلقائية، يرجى عدم الرد عليها
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">
                  © ${new Date().getFullYear()} احجزلي - جميع الحقوق محفوظة
                </p>
              </div>
            </div>
          `
                })
            })

            if (!emailResponse.ok) {
                const errorText = await emailResponse.text()
                console.error('❌ Brevo email send failed:', errorText)
                throw new Error('Failed to send email')
            }

            console.log('✅ Email sent successfully to:', contact)

        } else if (type === 'phone') {
            // Send SMS via WhatsApp
            if (!WHAPI_TOKEN) {
                throw new Error('WhatsApp service not configured (WHAPI_TOKEN missing)')
            }

            // Format phone number
            let formattedPhone = contact.replace(/\D/g, '')
            if (!formattedPhone.startsWith('966')) {
                formattedPhone = '966' + formattedPhone.replace(/^0+/, '')
            }

            const message = `مرحباً ${userData.full_name || 'عزيزي المستخدم'},

رمز التحقق الخاص بك هو:

*${code}*

⏱️ هذا الرمز صالح لمدة 10 دقائق فقط.

⚠️ إذا لم تطلب هذا الرمز، يرجى تجاهل هذه الرسالة.

- منصة احجزلي 🚌`

            const whatsappResponse = await fetch('https://gate.whapi.cloud/messages/text', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'authorization': `Bearer ${WHAPI_TOKEN}`,
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    to: formattedPhone + '@s.whatsapp.net',
                    body: message
                })
            })

            if (!whatsappResponse.ok) {
                const errorText = await whatsappResponse.text()
                console.error('❌ WhatsApp send failed:', errorText)
                throw new Error('Failed to send WhatsApp message')
            }

            console.log('✅ WhatsApp sent successfully to:', formattedPhone)
        }

        // Log activity
        await supabaseClient.rpc('log_user_activity', {
            p_user_id: userData.user_id,
            p_auth_id: user.id,
            p_activity_type: 'verification_code_sent',
            p_activity_category: 'security',
            p_description: `تم إرسال رمز التحقق عبر ${type === 'email' ? 'البريد الإلكتروني' : 'الهاتف'}`,
            p_metadata: { type, contact }
        })

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Verification code sent successfully',
                expiresAt: expiresAt.toISOString()
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error('❌ Send verification error:', error.message)
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            }
        )
    }
})
