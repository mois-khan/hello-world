import { NextResponse } from 'next/server';
import { syncParcels } from '../../../lib/indexer';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const fromBlock = body.from || 0;
    const parcelsSynced = await syncParcels(fromBlock);
    
    return NextResponse.json({ ok: true, data: { parcelsSynced, transfersSynced: 0 } });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
