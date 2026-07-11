import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Delete all sim transfers that are not completed
  await prisma.simTransfer.deleteMany({
    where: { status: { in: ['PendingBuyer', 'PendingRegistrar'] } }
  });

  // Reset all sim parcels to Active
  await prisma.simParcel.updateMany({
    where: { status: 'InTransfer' },
    data: { status: 'Active' }
  });

  // Delete all transfer metas
  await prisma.transferMeta.deleteMany({
    where: { status: { in: ['PendingBuyer', 'PendingRegistrar'] } }
  });

  console.log("Transfers reset successfully.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
