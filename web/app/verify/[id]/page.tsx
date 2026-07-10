import { notFound } from 'next/navigation';
import { prisma } from '../../../lib/prisma';
import { ownerOf, getParcel } from '../../../lib/chain';

export default async function VerifyPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  if (isNaN(id)) notFound();

  // 1. Fetch DB Meta
  const meta = await prisma.parcelMeta.findUnique({
    where: { id },
  });

  if (!meta) notFound();

  // 2. Fetch Chain Data
  const ownerWallet = await ownerOf(id).catch(() => null);
  const chainParcel = await getParcel(id).catch(() => null);

  if (!ownerWallet || !chainParcel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <p className="text-lg">Error securely connecting to the BhoomiChain network.</p>
      </div>
    );
  }

  // 3. Fetch User (if exists)
  const ownerUser = await prisma.user.findUnique({
    where: { wallet: ownerWallet },
  });

  const displayOwner = ownerUser?.maskedId || ownerUser?.name || ownerWallet;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header Badge */}
        <div className="flex items-center justify-center space-x-2 bg-emerald-100/60 border border-emerald-200/80 text-emerald-800 px-5 py-2.5 rounded-full w-fit mx-auto shadow-sm backdrop-blur-sm">
          <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="font-semibold text-sm tracking-wide">Verified on BhoomiChain</span>
        </div>

        {/* Main Certificate Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/60 overflow-hidden relative transition-all hover:shadow-2xl">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
          
          <div className="p-8 sm:p-12 relative z-10">
            <div className="text-center mb-12">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Land Title Certificate</h1>
              <p className="mt-3 text-sm font-medium text-slate-500 uppercase tracking-widest">Official Record of Ownership</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Owner Info */}
              <div className="col-span-1 md:col-span-2 bg-slate-50/50 rounded-2xl p-6 border border-slate-100 backdrop-blur-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Current Owner</h3>
                <p className="text-xl font-semibold text-slate-900 break-all">{displayOwner}</p>
                <div className="mt-2 text-xs font-mono text-slate-500 bg-white inline-block px-2 py-1 rounded border border-slate-100">
                  Wallet: {ownerWallet}
                </div>
              </div>

              {/* Property Details */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Survey Number</h3>
                  <p className="text-slate-900 font-medium text-lg">{meta.surveyNumber}</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Area</h3>
                  <p className="text-slate-900 font-medium text-lg">{meta.area} sq ft</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">District</h3>
                  <p className="text-slate-900 font-medium text-lg">{meta.district}</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Coordinates (Lat, Lng)</h3>
                  <p className="text-slate-700 font-mono text-sm bg-slate-50 px-2 py-1 rounded w-fit border border-slate-100">{meta.lat}, {meta.lng}</p>
                </div>
              </div>
              
              <div className="col-span-1 md:col-span-2 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Blockchain Status</h3>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                  chainParcel.status === 'ACTIVE' 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-2 ${chainParcel.status === 'ACTIVE' ? 'bg-blue-600' : 'bg-amber-600'}`}></span>
                  {chainParcel.status === 'ACTIVE' ? 'ACTIVE' : 'IN TRANSFER'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-50/80 px-8 py-5 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-xs font-medium text-slate-500">
              Parcel ID: <span className="font-mono bg-white px-2 py-1 rounded border border-slate-200">{id}</span>
            </div>
            <div className="text-xs font-medium text-slate-500 flex items-center">
              <svg className="w-4 h-4 mr-1.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Registered: {new Date(meta.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Placeholder for History */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 border-dashed p-10 text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10">
            <svg className="mx-auto h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-sm font-bold text-slate-700">Ownership History</h3>
            <p className="mt-1 text-sm text-slate-400">Timeline will be available in Phase 3.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
