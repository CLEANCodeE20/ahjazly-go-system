import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type TableNames = keyof Database['public']['Tables'];

interface UseSupabaseCRUDOptions {
  tableName: TableNames;
  primaryKey?: string;
  initialFetch?: boolean;
  orderBy?: { column: string; ascending?: boolean };
}

export function useSupabaseCRUD<T>({
  tableName,
  primaryKey = 'id',
  initialFetch = true,
  orderBy
}: UseSupabaseCRUDOptions) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase.from(tableName).select('*');
      
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
      }
      
      const { data: result, error: fetchError } = await query;
      
      if (fetchError) {
        throw fetchError;
      }
      
      setData((result as unknown as T[]) || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء جلب البيانات';
      setError(errorMessage);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [tableName, orderBy]);

  const create = useCallback(async (record: Partial<T>) => {
    setLoading(true);
    try {
      const { data: result, error: insertError } = await supabase
        .from(tableName)
        .insert(record as never)
        .select()
        .single();
      
      if (insertError) {
        throw insertError;
      }
      
      setData(prev => [...prev, result as unknown as T]);
      toast({
        title: "تمت الإضافة",
        description: "تم إضافة السجل بنجاح"
      });
      return result as unknown as T;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء الإضافة';
      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive"
      });
      console.error('Create error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tableName]);

  const update = useCallback(async (id: string | number, record: Partial<T>) => {
    setLoading(true);
    try {
      const { data: result, error: updateError } = await supabase
        .from(tableName)
        .update(record as never)
        .eq(primaryKey as never, id as never)
        .select()
        .single();
      
      if (updateError) {
        throw updateError;
      }
      
      setData(prev => prev.map(item => 
        (item as Record<string, unknown>)[primaryKey] === id ? (result as unknown as T) : item
      ));
      toast({
        title: "تم التحديث",
        description: "تم تحديث السجل بنجاح"
      });
      return result as unknown as T;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء التحديث';
      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive"
      });
      console.error('Update error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tableName, primaryKey]);

  const remove = useCallback(async (id: string | number) => {
    setLoading(true);
    try {
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq(primaryKey as never, id as never);
      
      if (deleteError) {
        throw deleteError;
      }
      
      setData(prev => prev.filter(item => (item as Record<string, unknown>)[primaryKey] !== id));
      toast({
        title: "تم الحذف",
        description: "تم حذف السجل بنجاح"
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء الحذف';
      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive"
      });
      console.error('Delete error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tableName, primaryKey]);

  useEffect(() => {
    if (initialFetch) {
      fetchData();
    }
  }, [initialFetch, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    create,
    update,
    remove
  };
}
