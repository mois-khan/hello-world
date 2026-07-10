import { NextResponse } from 'next/server';
export async function POST() { return NextResponse.json({ ok: true, data: { hashMatch: true, sha256: '', riskScore: 0, verdict: 'LIKELY_GENUINE', indicators: { fontConsistency: '', sealIntegrity: '', digitalArtifacts: '', numeralTampering: '' }, reasons: [], model: '' } }); }
