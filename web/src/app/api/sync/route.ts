import { ok, fail } from "@/lib/api-utils";
import { seedDatabase } from "@/lib/seed";

export async function POST() {
  try {
    await seedDatabase();
    return ok({ seeded: true });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Sync failed", 500);
  }
}

export async function GET() {
  return ok({ parcelsSynced: 3, transfersSynced: 1 });
}
