import { NextRequest } from "next/server";
import { mergeParcelWithMeta } from "@/lib/seed";
import { getHistory } from "@/lib/chain";
import { ensureSeeded } from "@/lib/seed";
import { fail } from "@/lib/api-utils";
import { prisma } from "@/lib/db";

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
    const verifyUrl = `${appUrl}/verify/${parcelId}`;

    const latestTransfer = await prisma.transferMeta.findFirst({
      where: { parcelId, status: "Completed" },
      orderBy: { createdAt: "desc" }
    });

    const verificationHash = latestTransfer?.verificationHash || "N/A";
    const txHash = history.length > 0 ? history[history.length - 1].txHash : "N/A";

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Title Certificate - Parcel ${parcelId}</title>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #f3f4f6; padding: 40px; }
    .certificate { background: white; max-width: 800px; margin: 0 auto; padding: 40px; border: 1px solid #ddd; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 20px; }
    .title { color: #1e3a8a; font-size: 28px; font-weight: bold; margin: 0; }
    .subtitle { color: #64748b; font-size: 16px; margin-top: 5px; }
    .content { line-height: 1.6; }
    .row { display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 5px; }
    .label { font-weight: bold; color: #475569; width: 30%; }
    .value { color: #0f172a; width: 70%; word-break: break-all; }
    .footer { margin-top: 40px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 15px; }
    .qr-container img { border: 1px solid #ddd; padding: 5px; border-radius: 4px; }
    .hash-box { background: #f8fafc; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0; text-align: left; width: 100%; box-sizing: border-box;}
    .hash-box .label { display: block; font-size: 12px; color: #64748b; margin-bottom: 4px; width: 100%;}
    .hash-box .value { font-family: monospace; font-size: 13px; color: #334155; width: 100%;}
    @media print {
      body { background: white; padding: 0; }
      .certificate { box-shadow: none; border: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <h1 class="title">Government of India</h1>
      <h2 class="title" style="font-size: 22px; margin-top: 10px;">BhuRaksha Title Certificate</h2>
      <p class="subtitle">Cryptographically Verified Land Record</p>
    </div>
    
    <div class="content">
      <div class="row">
        <div class="label">Parcel ID:</div>
        <div class="value">${parcelId}</div>
      </div>
      <div class="row">
        <div class="label">ULPIN:</div>
        <div class="value">${parcel.ulpin || "Pending"}</div>
      </div>
      <div class="row">
        <div class="label">Survey Number:</div>
        <div class="value">${parcel.surveyNumber}</div>
      </div>
      <div class="row">
        <div class="label">District:</div>
        <div class="value">${parcel.district}</div>
      </div>
      <div class="row">
        <div class="label">Area (sqm):</div>
        <div class="value">${parcel.area}</div>
      </div>
      <div class="row">
        <div class="label">Current Owner:</div>
        <div class="value">${parcel.owner}</div>
      </div>
    </div>

    <div class="footer">
      <div class="qr-container">
        <p style="font-size: 14px; font-weight: bold; margin-bottom: 5px; color: #475569;">Scan to Verify</p>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrl)}" alt="QR Code">
      </div>
      
      <div class="hash-box">
        <div class="label">VERIFICATION HASH (SHA-256)</div>
        <div class="value">${verificationHash}</div>
      </div>

      <div class="hash-box">
        <div class="label">LATEST BLOCKCHAIN TX HASH</div>
        <div class="value">${txHash}</div>
      </div>
    </div>
  </div>
  <script>
    window.onload = () => { setTimeout(() => window.print(), 500); }
  </script>
</body>
</html>
    `;

    return new Response(htmlContent, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Certificate generation failed", 500);
  }
}

