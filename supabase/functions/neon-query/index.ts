import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a connection pool to Neon
const databaseUrl = Deno.env.get('NEON_DATABASE_URL')!;
const pool = new Pool(databaseUrl, 3, true);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, params } = await req.json();
    
    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Executing query:', query);
    console.log('With params:', params);

    const connection = await pool.connect();
    
    try {
      const result = await connection.queryObject(query, params || []);
      
      console.log('Query executed successfully, rows returned:', result.rows.length);
      
      return new Response(
        JSON.stringify({ 
          data: result.rows,
          rowCount: result.rowCount 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } finally {
      connection.release();
    }
  } catch (error: unknown) {
    console.error('Error executing query:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
