import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-utils";
import { getFraudAlerts } from "@/lib/fraud";
import { ensureSeeded } from "@/lib/seed";

export async function GET(req: NextRequest) {
  try {
    await ensureSeeded();
    const { searchParams } = new URL(req.url);
    const resolved = searchParams.get("resolved") === "true";
    const alerts = await getFraudAlerts(resolved);
    return ok(alerts);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Failed to get fraud alerts", 500);
  }
}
