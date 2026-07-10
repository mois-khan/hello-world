import { NextResponse } from 'next/server';
export async function POST() { return NextResponse.json({ ok: true, data: { parcelsSynced: 0, transfersSynced: 0 } }); }
