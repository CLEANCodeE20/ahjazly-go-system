import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const HF_TOKEN = Deno.env.get('HUGGING_FACE_TOKEN')
const SENTIMENT_MODEL = "RafatMohammed/arabic-sentiment-marbertv2"

serve(async (req) => {
    // CORS Headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Safe JSON parsing
        let payload;
        try {
            payload = await req.json()
        } catch (e) {
            return new Response(JSON.stringify({ success: false, error: "Invalid or empty JSON body" }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            })
        }

        console.log('📥 Received payload:', JSON.stringify(payload, null, 2))

        let ratingData
        if (payload.record && payload.table === 'ratings') {
            // Triggered by Webhook
            ratingData = payload.record
        } else {
            // Manual call
            ratingData = payload
        }

        const { rating_id, comment } = ratingData

        if (!rating_id || !comment) {
            return new Response(JSON.stringify({ success: false, error: "Missing rating_id or comment" }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            })
        }

        if (!HF_TOKEN) {
            console.error("❌ HUGGING_FACE_TOKEN not configured")
            return new Response(JSON.stringify({ success: false, error: "HUGGING_FACE_TOKEN not configured" }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            })
        }

        const HF_SPACE_URL = "https://rafatmohammed-marbertv2-arabic-sentiment.hf.space/run/predict"

        console.log(`🧠 Analyzing sentiment for rating ${rating_id}: "${comment}"`)

        let sentiment = 'Neutral'
        let score = 0
        let analyzed = false

        // Try Hugging Face Space first
        try {
            const spaceResponse = await fetch(HF_SPACE_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data: [comment] }),
            })

            if (spaceResponse.ok) {
                const spaceResult = await spaceResponse.json()
                if (spaceResult.data && spaceResult.data[0]) {
                    const output = spaceResult.data[0]
                    if (output.includes('إيجابي') || output.includes('Positive')) sentiment = 'Positive'
                    else if (output.includes('سلبي') || output.includes('Negative')) sentiment = 'Negative'

                    const scoreMatch = output.match(/درجة الثقة: ([\d.]+)/)
                    score = scoreMatch ? parseFloat(scoreMatch[1]) : 1.0
                    analyzed = true
                    console.log(`🤖 Space Result: ${sentiment} (${score})`)
                }
            }
        } catch (e) {
            console.warn("Space API failed, falling back:", e)
        }

        // Fallback to Inference API
        if (!analyzed && HF_TOKEN) {
            console.log("🔄 Calling HF Inference API...")
            const hfResponse = await fetch(
                `https://api-inference.huggingface.co/models/${SENTIMENT_MODEL}`,
                {
                    headers: { Authorization: `Bearer ${HF_TOKEN}` },
                    method: "POST",
                    body: JSON.stringify({ inputs: comment }),
                }
            )

            if (!hfResponse.ok) {
                const errorText = await hfResponse.text()
                console.error(`❌ HF API Error ${hfResponse.status}: ${errorText}`)
                return new Response(JSON.stringify({ success: false, error: `HF API Error: ${errorText}` }), {
                    status: 200,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                })
            }

            const result = await hfResponse.json()
            console.log('🤖 HF Result:', JSON.stringify(result))

            if (Array.isArray(result) && result[0]) {
                const topResult = result[0].reduce((prev: any, current: any) =>
                    (prev.score > current.score) ? prev : current
                )

                const modelLabel = topResult.label.toUpperCase()
                if (modelLabel === 'LABEL_2' || modelLabel.includes('POS') || modelLabel.includes('إيجابي')) sentiment = 'Positive'
                else if (modelLabel === 'LABEL_0' || modelLabel.includes('NEG') || modelLabel.includes('سلبي')) sentiment = 'Negative'
                score = topResult.score
            }
        }

        // Update Database
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!supabaseUrl || !supabaseKey) {
            console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
            return new Response(JSON.stringify({ success: false, error: "Server Configuration Error: Missing DB Credentials" }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            })
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        const { error: updateError } = await supabase
            .from('ratings')
            .update({
                sentiment: sentiment,
                sentiment_score: score
            })
            .eq('rating_id', rating_id)

        if (updateError) {
            console.error("❌ Error updating rating:", updateError)
            return new Response(JSON.stringify({ success: false, error: updateError.message }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            })
        }

        console.log(`✅ Sentiment updated for rating ${rating_id}: ${sentiment} (${score})`)

        return new Response(JSON.stringify({
            success: true,
            rating_id,
            sentiment,
            score
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200
        })

    } catch (error: any) {
        console.error("❌ Main Error:", error)
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
    }
})
