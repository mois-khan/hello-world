import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-utils";
import { scanTransfer, scanParcel } from "@/lib/fraud";
import { ensureSeeded } from "@/lib/seed";

export async function POST(req: NextRequest) {
  try {
    await ensureSeeded();
    const body = await req.json();
    const { transferId, parcelId } = body as { transferId?: number; parcelId?: number };
    const alerts = [];
    if (transferId) alerts.push(...(await scanTransfer(transferId)));
    if (parcelId) alerts.push(...(await scanParcel(parcelId)));
    return ok(alerts);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Fraud scan failed", 500);
  }
}
