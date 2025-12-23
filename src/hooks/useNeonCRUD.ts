import { useState, useEffect, useCallback } from 'react';
import { queryNeon } from '@/lib/neon';
import { useToast } from '@/hooks/use-toast';

interface UseNeonCRUDOptions {
  tableName: string;
  primaryKey?: string;
  initialFetch?: boolean;
}

export function useNeonCRUD<T>({ 
  tableName, 
  primaryKey = 'id',
  initialFetch = true 
}: UseNeonCRUDOptions) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const result = await queryNeon<T>(`SELECT * FROM ${tableName} ORDER BY created_at DESC`);
      if (result.error) {
        toast({ title: "خطأ", description: result.error, variant: "destructive" });
        return [];
      }
      setData(result.data || []);
      return result.data || [];
    } finally {
      setLoading(false);
    }
  }, [tableName, toast]);

  const create = useCallback(async (record: Partial<T>) => {
    setLoading(true);
    try {
      const keys = Object.keys(record);
      const values = Object.values(record);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const result = await queryNeon<T>(`INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`, values);
      if (result.error) {
        toast({ title: "خطأ", description: result.error, variant: "destructive" });
        return null;
      }
      const newRecord = result.data?.[0];
      if (newRecord) {
        setData(prev => [newRecord, ...prev]);
        toast({ title: "تمت الإضافة", description: "تم إضافة السجل بنجاح" });
      }
      return newRecord || null;
    } finally {
      setLoading(false);
    }
  }, [tableName, toast]);

  const update = useCallback(async (id: string | number, updates: Partial<T>) => {
    setLoading(true);
    try {
      const keys = Object.keys(updates);
      const values = Object.values(updates);
      const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
      const result = await queryNeon<T>(`UPDATE ${tableName} SET ${setClause} WHERE ${primaryKey} = $${keys.length + 1} RETURNING *`, [...values, id]);
      if (result.error) {
        toast({ title: "خطأ", description: result.error, variant: "destructive" });
        return null;
      }
      const updatedRecord = result.data?.[0];
      if (updatedRecord) {
        setData(prev => prev.map(item => (item as Record<string, unknown>)[primaryKey] === id ? updatedRecord : item));
        toast({ title: "تم التحديث", description: "تم تحديث السجل بنجاح" });
      }
      return updatedRecord || null;
    } finally {
      setLoading(false);
    }
  }, [tableName, primaryKey, toast]);

  const remove = useCallback(async (id: string | number) => {
    setLoading(true);
    try {
      const result = await queryNeon(`DELETE FROM ${tableName} WHERE ${primaryKey} = $1`, [id]);
      if (result.error) {
        toast({ title: "خطأ", description: result.error, variant: "destructive" });
        return false;
      }
      setData(prev => prev.filter(item => (item as Record<string, unknown>)[primaryKey] !== id));
      toast({ title: "تم الحذف", description: "تم حذف السجل بنجاح" });
      return true;
    } finally {
      setLoading(false);
    }
  }, [tableName, primaryKey, toast]);

  useEffect(() => {
    if (initialFetch) fetchAll();
  }, [initialFetch, fetchAll]);

  return { data, loading, error, fetchAll, create, update, remove, setData };
}
