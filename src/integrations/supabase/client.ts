// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://utcncwvgswagmkgjxees.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0Y25jd3Znc3dhZ21rZ2p4ZWVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5NTAwODQsImV4cCI6MjA2MjUyNjA4NH0.PGZvJjTz_QwidwepbYlVIN9142CqlY6Dks5xmCe4QYc";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);