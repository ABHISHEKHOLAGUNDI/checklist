const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ndippkwhkjaqjviqtfrf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kaXBwa3doa2phcWp2aXF0ZnJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzODU3OTcsImV4cCI6MjA4Nzk2MTc5N30.YXtcehqV5-tNu_VIaSVsffaCChg1ipe1rTfLxbF678c';

const supabase = createClient(supabaseUrl, supabaseKey);
const TARGET_DIR = path.resolve('../client checklist');

async function fixDb() {
    console.log('Cleaning up leads with no phone numbers...');

    // Delete all rows where phone is N/A
    const { error: deleteError } = await supabase
        .from('leads')
        .delete()
        .eq('mobile_number', 'N/A');

    if (deleteError) {
        console.error('Error deleting:', deleteError);
    } else {
        console.log('Successfully deleted all rows with N/A mobile numbers.');
    }

    // Check what files are already in the DB
    const { data: existingRecords, error: fetchError } = await supabase
        .from('leads')
        .select('file_name');

    if (!fetchError) {
        const existingFiles = [...new Set(existingRecords.map(d => d.file_name))];
        console.log('Files currently in DB:', existingFiles);

        // Check local files
        const localFiles = fs.readdirSync(TARGET_DIR).filter(f => f.endsWith('.csv'));
        const missingFiles = localFiles.filter(f => !existingFiles.includes(f));

        if (missingFiles.length > 0) {
            console.log('Found missing files. Attempting to insert:', missingFiles);
            for (const file of missingFiles) {
                console.log(`Processing missing file: ${file}`);
                const filePath = path.join(TARGET_DIR, file);
                const csvData = fs.readFileSync(filePath, 'utf8');
                const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });

                const rowsToInsert = parsed.data.map(row => {
                    const firmName = row['Firm/Professional Name'] || row['Hospital/Clinic Name'] || row['Name'] || 'Unknown';
                    const mobileNumber = row['Mobile Number'] || row['Phone'] || 'N/A';
                    const website = row['Website'] || 'No';

                    return {
                        file_name: file,
                        firm_name: firmName,
                        mobile_number: mobileNumber,
                        website: website,
                        status: 'Not Called',
                        notes: ''
                    };
                }).filter(r => r.mobile_number !== 'N/A'); // Filter out N/A rows directly here

                if (rowsToInsert.length > 0) {
                    const { error: insertError } = await supabase.from('leads').insert(rowsToInsert);
                    if (insertError) {
                        console.error(`Error inserting records for ${file}:`, insertError.message);
                    } else {
                        console.log(`Inserted ${rowsToInsert.length} valid records from ${file}`);
                    }
                }
            }
        } else {
            console.log('All local CSV files are already present in Supabase.');
        }
    }
}

fixDb();
