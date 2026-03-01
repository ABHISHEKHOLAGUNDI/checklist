const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ndippkwhkjaqjviqtfrf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kaXBwa3doa2phcWp2aXF0ZnJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzODU3OTcsImV4cCI6MjA4Nzk2MTc5N30.YXtcehqV5-tNu_VIaSVsffaCChg1ipe1rTfLxbF678c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
    const { data, error } = await supabase
        .from('leads')
        .select('file_name, id, status, notes');

    if (error) {
        console.error('Error:', error);
        return;
    }

    const uniqueFiles = [...new Set(data.map(d => d.file_name))];
    console.log('--- DB SUMMARY ---');
    console.log(`Total rows in DB: ${data.length}`);
    console.log(`Unique files (${uniqueFiles.length}):`);
    uniqueFiles.forEach(f => {
        const count = data.filter(d => d.file_name === f).length;
        console.log(`- ${f} (${count} leads)`);
    });
}

checkDb();
