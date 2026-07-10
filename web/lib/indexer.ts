import { getContract, getParcel } from './chain';
import { prisma } from './prisma';

export async function syncParcels(fromBlock: number = 0): Promise<number> {
  const contract = getContract();
  const filter = contract.filters.ParcelRegistered();
  const events = await contract.queryFilter(filter, fromBlock);
  
  let synced = 0;
  for (const event of events) {
    if (!('args' in event)) continue;
    const parcelId = Number(event.args[0]);
    // The event is ParcelRegistered(uint256 parcelId, address owner, string surveyNumber, bytes32 documentHash)
    // We need the rest of the details (district, geo, area) from the contract's parcel struct
    const p = await getParcel(parcelId);
    
    // geo is 'lat,lng'
    const [latStr, lngStr] = p.geo.split(',');
    const lat = parseFloat(latStr) || 0;
    const lng = parseFloat(lngStr) || 0;
    
    await prisma.parcelMeta.upsert({
      where: { id: parcelId },
      update: {
        surveyNumber: p.surveyNumber,
        district: p.district,
        addressText: p.district,
        lat,
        lng,
        area: p.area,
        currentDocId: p.documentHash
      },
      create: {
        id: parcelId,
        surveyNumber: p.surveyNumber,
        district: p.district,
        addressText: p.district,
        lat,
        lng,
        area: p.area,
        currentDocId: p.documentHash
      }
    });
    synced++;
  }
  return synced;
}

export async function syncTransfers(fromBlock: number = 0): Promise<number> {
  return 0; // Not implemented in P1.2
}
