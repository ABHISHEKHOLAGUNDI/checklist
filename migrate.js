const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ndippkwhkjaqjviqtfrf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kaXBwa3doa2phcWp2aXF0ZnJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzODU3OTcsImV4cCI6MjA4Nzk2MTc5N30.YXtcehqV5-tNu_VIaSVsffaCChg1ipe1rTfLxbF678c';

const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_DIR = path.resolve('../client checklist');

async function migrateData() {
    console.log('Starting Migration to Supabase...');

    if (!fs.existsSync(TARGET_DIR)) {
        console.error(`Folder not found: ${TARGET_DIR}`);
        return;
    }

    const files = fs.readdirSync(TARGET_DIR).filter(f => f.endsWith('.csv'));

    if (files.length === 0) {
        console.log('No CSV files found to migrate.');
        return;
    }

    for (const file of files) {
        console.log(`Processing ${file}...`);
        const filePath = path.join(TARGET_DIR, file);
        const csvData = fs.readFileSync(filePath, 'utf8');

        const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });

        const rowsToInsert = parsed.data.map(row => {
            // Handle the different column names dynamically based on the history
            const firmName = row['Firm/Professional Name'] || row['Hospital/Clinic Name'] || row['Name'] || 'Unknown';
            const mobileNumber = row['Mobile Number'] || row['Phone'] || 'N/A';
            const website = row['Website'] || 'No';
            const status = row['Status'] || 'Not Called';
            const notes = row['Notes'] || '';

            return {
                file_name: file,
                firm_name: firmName,
                mobile_number: mobileNumber,
                website: website,
                status: status,
                notes: notes
            };
        });

        if (rowsToInsert.length > 0) {
            const { data, error } = await supabase
                .from('leads')
                .insert(rowsToInsert);

            if (error) {
                console.error(`\u274c Error inserting records for ${file}:`, error.message);
            } else {
                console.log(`\u2705 Inserted ${rowsToInsert.length} records from ${file}`);
            }
        }
    }

    console.log('Migration Attempt Complete.');
}

migrateData();
