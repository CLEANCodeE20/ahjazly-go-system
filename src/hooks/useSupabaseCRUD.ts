import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type TableNames = keyof Database['public']['Tables'];

export interface UseSupabaseCRUDOptions {
  tableName: TableNames;
  primaryKey?: string;
  initialFetch?: boolean;
  orderBy?: { column: string; ascending?: boolean };
  select?: string;
  pageSize?: number;
  filter?: (query: any) => any;
}

export function useSupabaseCRUD<T>({
  tableName,
  primaryKey = 'id',
  initialFetch = true,
  orderBy,
  select = '*',
  pageSize = 10,
  filter
}: UseSupabaseCRUDOptions) {
  const [data, setData] = useState<T[]>([]);
  const [count, setCount] = useState<number>(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase.from(tableName).select(select, { count: 'exact' });

      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
      }

      if (filter) {
        query = filter(query);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      query = query.range(from, to);

      const { data: result, error: fetchError, count: totalCount } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setData((result as unknown as T[]) || []);
      setCount(totalCount || 0);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء جلب البيانات';
      setError(errorMessage);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [tableName, orderBy, select, pageSize, page, filter]);

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

      // Optimistic update or refetch? 
      // For pagination, refetching is safer to ensure correct order and count, 
      // but appending to current page is faster. 
      // Let's just refetch to be safe with pagination.
      fetchData();

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
  }, [tableName, fetchData]);

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
      // Also update count?
      setCount(prev => Math.max(0, prev - 1));

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
    count,
    page,
    pageSize,
    totalPages: Math.ceil(count / pageSize),
    setPage,
    loading,
    error,
    refetch: fetchData,
    create,
    update,
    remove
  };
}
