import { supabase } from "@/integrations/supabase/client";

interface NeonQueryResult<T = unknown> {
  data: T[] | null;
  rowCount: number | null;
  error: string | null;
}

export async function queryNeon<T = unknown>(
  query: string,
  params?: unknown[]
): Promise<NeonQueryResult<T>> {
  try {
    const { data, error } = await supabase.functions.invoke('neon-query', {
      body: { query, params }
    });

    if (error) {
      console.error('Error calling neon-query function:', error);
      return { data: null, rowCount: null, error: error.message };
    }

    if (data.error) {
      console.error('Database error:', data.error);
      return { data: null, rowCount: null, error: data.error };
    }

    return { 
      data: data.data as T[], 
      rowCount: data.rowCount,
      error: null 
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Unexpected error:', errorMessage);
    return { data: null, rowCount: null, error: errorMessage };
  }
}
