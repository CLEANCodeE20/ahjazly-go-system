import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface PartnerInfo {
  partner_id: number;
  company_name: string;
  contact_person: string | null;
  commission_percentage: number | null;
  address: string | null;
  status: string | null;
}

export const usePartner = () => {
  const { userRole, isLoading: authLoading } = useAuth();
  const [partner, setPartner] = useState<PartnerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPartner = async () => {
      if (authLoading) return;

      if (userRole?.partner_id) {
        const { data, error } = await supabase
          .from('partners')
          .select('partner_id, company_name, contact_person, address, commission_percentage, status')
          .eq('partner_id', userRole.partner_id)
          .single();

        if (!error && data) {
          setPartner(data);
        }
      }
      setIsLoading(false);
    };

    fetchPartner();
  }, [userRole, authLoading]);

  return {
    partner,
    partnerId: userRole?.partner_id || null,
    isLoading: authLoading || isLoading,
  };
};
