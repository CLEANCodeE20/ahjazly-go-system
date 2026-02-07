import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization') ?? `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}` } } }
        )

        // Perfrom a lightweight query to check DB connection
        const { data, error } = await supabaseClient.from('cities').select('count').limit(1).single()

        if (error) throw error

        return new Response(
            JSON.stringify({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                db_connection: 'connected'
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            },
        )
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return new Response(
            JSON.stringify({
                status: 'unhealthy',
                error: errorMessage
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 503,
            },
        )
    }
})
