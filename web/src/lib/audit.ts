import { prisma } from "@/lib/db";

export async function logAudit(actor: string, action: string, target: string, meta?: string) {
  try {
    await prisma.auditLog.create({
      data: {
        actor,
        action,
        target,
        meta: meta || null,
      },
    });
  } catch (error) {
    console.error("Failed to log audit event:", error);
  }
}
