import { NextRequest } from "next/server";
import { mergeParcelWithMeta } from "@/lib/seed";
import { getHistory } from "@/lib/chain";
import { ensureSeeded } from "@/lib/seed";
import { fail } from "@/lib/api-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSeeded();
    const { id } = await params;
    const parcelId = parseInt(id, 10);
    const parcel = await mergeParcelWithMeta(parcelId);
    if (!parcel) return fail("Parcel not found", 404);

    const history = await getHistory(parcelId);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const pdfContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 200>>stream
BT /F1 14 Tf 50 700 Td (BhuRaksha Title Certificate) Tj
0 -30 Td (Parcel ID: ${parcelId}) Tj
0 -20 Td (Survey: ${parcel.surveyNumber}) Tj
0 -20 Td (District: ${parcel.district}) Tj
0 -20 Td (Owner: ${parcel.owner}) Tj
0 -20 Td (Verify: ${appUrl}/verify/${parcelId}) Tj
ET
endstream endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000000518 00000 n 
trailer<</Size 6/Root 1 0 R>>
startxref
595
%%EOF`;

    return new Response(pdfContent, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="trustseal-${parcelId}.pdf"`,
      },
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Certificate generation failed", 500);
  }
}
