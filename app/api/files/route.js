import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let allData = [];
    let page = 0;

    while (true) {
      const { data, error } = await supabase
        .from('leads')
        .select('file_name')
        .range(page * 1000, (page + 1) * 1000 - 1);

      if (error) throw error;
      if (!data || data.length === 0) break;

      allData = allData.concat(data);
      if (data.length < 1000) break;
      page++;
    }

    const uniqueFiles = [...new Set(allData.map(d => d.file_name))];

    return NextResponse.json({ files: uniqueFiles });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
