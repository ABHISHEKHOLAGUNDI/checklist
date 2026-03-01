import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get('file');

    if (!file) {
        return NextResponse.json({ error: 'Invalid file' }, { status: 400 });
    }

    try {
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .eq('file_name', file)
            .order('id', { ascending: true });

        if (error) throw error;

        // Map DB column names back to what the React UI expects
        const uiData = data.map(row => ({
            id: row.id,
            "Firm/Professional Name": row.firm_name,
            "Mobile Number": row.mobile_number,
            "Website": row.website,
            "Status": row.status,
            "Notes": row.notes
        }));

        return NextResponse.json({ data: uiData });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get('file');

    if (!file) {
        return NextResponse.json({ error: 'Invalid file' }, { status: 400 });
    }

    try {
        const { data } = await request.json();

        for (const lead of data) {
            if (lead.id) {
                const { error } = await supabase
                    .from('leads')
                    .update({
                        status: lead.Status,
                        notes: lead.Notes
                    })
                    .eq('id', lead.id);

                if (error) throw error;
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
