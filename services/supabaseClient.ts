import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://edeqbauafysmlrrlvqvs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZXFiYXVhZnlzbWxycmx2cXZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5ODUxMTgsImV4cCI6MjA3OTU2MTExOH0.5Hs_PC2H-mrFEMDgedhkXYVERoXjEuFwMBuDtcty-oU';

export const supabase = createClient(supabaseUrl, supabaseKey);