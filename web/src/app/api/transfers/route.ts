import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-utils";
import { listTransfers } from "@/lib/chain";
import { ensureSeeded } from "@/lib/seed";

export async function GET(req: NextRequest) {
  try {
    await ensureSeeded();
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get("wallet") ?? undefined;
    const role = searchParams.get("role") ?? undefined;
    const transfers = await listTransfers({ wallet, role });
    return ok(transfers);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to list transfers", 500);
  }
}
