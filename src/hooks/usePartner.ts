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
  bank_name: string | null;
  iban: string | null;
  account_number: string | null;
  swift_code: string | null;
  commercial_registration: string | null;
  tax_number: string | null;
  website: string | null;
  logo_url: string | null;
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
          .select('partner_id, company_name, contact_person, address, commission_percentage, status, bank_name, iban, account_number, swift_code, commercial_registration, tax_number, website, logo_url')
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
    setPartner
  };
};
