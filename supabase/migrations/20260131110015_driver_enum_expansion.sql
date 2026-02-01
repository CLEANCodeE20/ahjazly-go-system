-- ENUM ENHANCEMENT: System-wide Document Types & Statuses
-- Adding missing types for drivers and 'expired' status safely.

ALTER TYPE public.document_type ADD VALUE IF NOT EXISTS 'national_id';
ALTER TYPE public.document_type ADD VALUE IF NOT EXISTS 'health_certificate';
ALTER TYPE public.document_type ADD VALUE IF NOT EXISTS 'criminal_record';
ALTER TYPE public.document_type ADD VALUE IF NOT EXISTS 'contract';

-- Adding expired status to verification_status
ALTER TYPE public.verification_status ADD VALUE IF NOT EXISTS 'expired';
