import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase';
import { sha256 } from '../../../lib/hash';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ ok: false, error: 'No file provided' }, { status: 400 });

    const hash = await sha256(file);
    const fileName = `${hash}-${file.name}`;

    const { data, error } = await supabaseAdmin.storage
      .from('documents')
      .upload(fileName, file, { upsert: true });

    if (error) throw error;
    
    const { data: { publicUrl } } = supabaseAdmin.storage.from('documents').getPublicUrl(fileName);

    return NextResponse.json({ ok: true, data: { url: publicUrl, sha256: hash } });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
