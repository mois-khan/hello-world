import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { ownerOf, getParcel } from '../../../lib/chain';
import { Parcel } from '../../../lib/types';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    
    const where = q ? {
      OR: [
        { surveyNumber: { contains: q, mode: 'insensitive' as const } },
        { district: { contains: q, mode: 'insensitive' as const } }
      ]
    } : {};

    const metas = await prisma.parcelMeta.findMany({ where });
    
    // Merge with on-chain data
    const parcels: Parcel[] = await Promise.all(metas.map(async (meta: any) => {
      const owner = await ownerOf(meta.id);
      const chainParcel = await getParcel(meta.id);
      return {
        id: meta.id,
        surveyNumber: meta.surveyNumber,
        district: meta.district,
        geo: `${meta.lat},${meta.lng}`,
        area: meta.area,
        documentHash: meta.currentDocId || '',
        registeredAt: meta.createdAt.getTime() / 1000,
        status: chainParcel.status,
        owner
      };
    }));

    return NextResponse.json({ ok: true, data: parcels });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
export async function POST() { return NextResponse.json({ ok: true, data: {} }); }
