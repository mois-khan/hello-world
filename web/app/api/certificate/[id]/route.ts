import { NextResponse } from 'next/server';
export async function GET() { return new NextResponse(Buffer.from('PDF'), { headers: { 'Content-Type': 'application/pdf' } }); }
