import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('file_name')
      .limit(10000);

    if (error) throw error;

    // Get unique filenames from the database
    const uniqueFiles = [...new Set(data.map(d => d.file_name))];

    return NextResponse.json({ files: uniqueFiles });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
