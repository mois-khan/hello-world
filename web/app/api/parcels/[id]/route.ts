import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { ownerOf, getParcel, getHistory } from '../../../../lib/chain';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) return NextResponse.json({ ok: false, error: 'Invalid ID' }, { status: 400 });

    const meta = await prisma.parcelMeta.findUnique({
      where: { id },
      include: { documents: { orderBy: { createdAt: 'desc' }, take: 1 } }
    });

    if (!meta) return NextResponse.json({ ok: false, error: 'Parcel not found' }, { status: 404 });

    const owner = await ownerOf(id);
    const chainParcel = await getParcel(id);
    
    const parcel = {
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
    
    const doc = meta.documents[0];
    const document = doc ? {
      url: doc.storageUrl,
      sha256: doc.sha256,
      aiReport: doc.aiReport
    } : null;

    const history = await getHistory(id);

    return NextResponse.json({ ok: true, data: { parcel, meta, document, history } });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
