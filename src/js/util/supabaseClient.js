// Utility for creating and exporting a single Supabase client instance
import { createClient } from '@supabase/supabase-js';

const SERVER_URI = process.env.SERVER_URI;
const ANON_KEY = process.env.ANON_KEY;

export const supabase = createClient(SERVER_URI, ANON_KEY);
