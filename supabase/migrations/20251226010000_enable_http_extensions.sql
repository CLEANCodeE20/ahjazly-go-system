-- Enable Required Extensions for Notifications and HTTP Requests
-- This fixes the "schema net does not exist" error

-- Enable pg_net extension for making HTTP requests from database
-- Used for sending notifications to external services (FCM, WhatsApp, etc.)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Enable http extension as a fallback/alternative
CREATE EXTENSION IF NOT EXISTS http;

-- Grant usage permissions
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;

-- Add comment for documentation
COMMENT ON EXTENSION pg_net IS 'Enables making HTTP requests from PostgreSQL functions';
COMMENT ON EXTENSION http IS 'HTTP client for PostgreSQL, allows web service requests';
