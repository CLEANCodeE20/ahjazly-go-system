import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        console.log('Starting automated backup process...')

        const tables = [
            'partners', 'users', 'trips', 'bookings', 'passengers',
            'buses', 'drivers', 'cities', 'routes', 'route_stops',
            'cancellation_policies', 'cancel_policy_rules',
            'branches', 'commissions', 'payment_transactions', 'seats'
        ]

        const backupData: Record<string, any> = {}

        for (const table of tables) {
            console.log(`Backing up table: ${table}`)
            const { data, error } = await supabaseAdmin.from(table).select('*')
            if (error) {
                console.error(`Error fetching table ${table}:`, error)
                continue
            }
            backupData[table] = data
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const fileName = `backup-${timestamp}.json`
        const fileContent = JSON.stringify(backupData, null, 2)

        console.log(`Uploading backup to storage: ${fileName}`)

        const { error: uploadError } = await supabaseAdmin.storage
            .from('db-backups')
            .upload(`daily/${fileName}`, fileContent, {
                contentType: 'application/json',
                upsert: true
            })

        if (uploadError) {
            if ((uploadError as any).message?.includes('bucket not found')) {
                console.log('Creating bucket db-backups...')
                await supabaseAdmin.storage.createBucket('db-backups', { public: false })
                // Retry upload
                const { error: retryError } = await supabaseAdmin.storage
                    .from('db-backups')
                    .upload(`daily/${fileName}`, fileContent, {
                        contentType: 'application/json',
                        upsert: true
                    })
                if (retryError) throw retryError
            } else {
                throw uploadError
            }
        }

        console.log('Backup completed successfully.')

        return new Response(
            JSON.stringify({ message: 'Backup completed successfully', fileName }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )

    } catch (error: any) {
        console.error('Backup failed:', error.message)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500
            }
        )
    }
})
