import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ndippkwhkjaqjviqtfrf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kaXBwa3doa2phcWp2aXF0ZnJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzODU3OTcsImV4cCI6MjA4Nzk2MTc5N30.YXtcehqV5-tNu_VIaSVsffaCChg1ipe1rTfLxbF678c';

export const supabase = createClient(supabaseUrl, supabaseKey);
