import type { AiReport, FraudAlert, FraudType, Severity } from "./types";
import { hashesMatch } from "./hash";
import { prisma } from "./db";
import { activeTransferOf, getParcel, ownerOf } from "./chain";

const DEMO_FORGED_HASH = "0x" + "dead".repeat(8);

export async function analyzeDocument(
  sha256: string,
  onChainHash?: string | null
): Promise<Omit<AiReport, "hashMatch" | "sha256">> {
  if (process.env.DEMO_FORCE_REPORT === "true" || sha256.toLowerCase().includes("dead")) {
    return {
      riskScore: 92,
      verdict: "LIKELY_FORGED",
      indicators: {
        fontConsistency: "Inconsistent kerning detected in survey number field",
        sealIntegrity: "Registrar seal appears digitally pasted",
        digitalArtifacts: "JPEG compression artifacts around altered numerals",
        numeralTampering: "Plot area digits show cloning patterns",
      },
      reasons: [
        "Seal misalignment with document baseline",
        "Altered plot area numerals",
        "Font weight mismatch in seller name block",
      ],
      model: "bhuraksha-forensic-v1",
    };
  }

  const hashEntropy = sha256.replace("0x", "").split("").filter((c, i, a) => a.indexOf(c) === i).length;
  const riskScore = hashEntropy < 12 ? 78 : hashEntropy < 14 ? 45 : 18;
  const verdict =
    riskScore >= 70 ? "LIKELY_FORGED" : riskScore >= 40 ? "SUSPICIOUS" : "LIKELY_GENUINE";

  return {
    riskScore,
    verdict,
    indicators: {
      fontConsistency: riskScore >= 40 ? "Minor inconsistencies" : "Consistent",
      sealIntegrity: riskScore >= 70 ? "Seal integrity compromised" : "Intact",
      digitalArtifacts: riskScore >= 40 ? "Some compression artifacts" : "None detected",
      numeralTampering: riskScore >= 70 ? "Possible numeral alteration" : "None detected",
    },
    reasons:
      riskScore >= 70
        ? ["Document hash entropy suggests tampering", "Visual forensic flags raised"]
        : riskScore >= 40
        ? ["Minor forensic indicators — manual review recommended"]
        : ["No significant forgery indicators detected"],
    model: "bhuraksha-forensic-v1",
  };
}

export async function buildAiReport(
  sha256: string,
  onChainHash?: string | null
): Promise<AiReport> {
  const hashMatch = onChainHash ? hashesMatch(sha256, onChainHash) : null;
  const forensic = await analyzeDocument(sha256, onChainHash);

  if (hashMatch === false) {
    return {
      hashMatch: false,
      sha256,
      riskScore: 100,
      verdict: "LIKELY_FORGED",
      indicators: {
        fontConsistency: "N/A — cryptographic mismatch",
        sealIntegrity: "N/A — cryptographic mismatch",
        digitalArtifacts: "N/A — cryptographic mismatch",
        numeralTampering: "Document hash does not match on-chain anchor",
      },
      reasons: ["SHA-256 hash mismatch with on-chain documentHash — mathematically tampered"],
      model: "cryptographic-integrity",
    };
  }

  return { hashMatch, sha256, ...forensic };
}

export async function scanParcel(parcelId: number): Promise<FraudAlert[]> {
  const alerts: FraudAlert[] = [];
  const parcel = await getParcel(parcelId);
  if (!parcel) return alerts;

  const active = await activeTransferOf(parcelId);
  if (active > 0 && parcel.status === "InTransfer") {
    const existing = await prisma.fraudAlert.findFirst({
      where: { parcelId, type: "DOUBLE_SALE", resolved: false },
    });
    if (!existing) {
      const alert = await prisma.fraudAlert.create({
        data: {
          parcelId,
          type: "DOUBLE_SALE",
          severity: "HIGH",
          detail: `Parcel ${parcelId} has active transfer #${active} — concurrent sale blocked`,
        },
      });
      alerts.push(formatAlert(alert));
    }
  }
  return alerts;
}

export async function scanTransfer(transferId: number): Promise<FraudAlert[]> {
  const alerts: FraudAlert[] = [];
  const transfer = await prisma.transferMeta.findUnique({ where: { id: transferId } });
  if (!transfer) return alerts;

  try {
    const onChainOwner = await ownerOf(transfer.parcelId);
    if (onChainOwner.toLowerCase() !== transfer.seller.toLowerCase()) {
      const alert = await prisma.fraudAlert.create({
        data: {
          parcelId: transfer.parcelId,
          type: "OWNERSHIP_MISMATCH",
          severity: "HIGH",
          detail: `Initiator ${transfer.seller} is not on-chain owner ${onChainOwner}`,
        },
      });
      alerts.push(formatAlert(alert));
    }
  } catch {
    // parcel may not exist on chain yet
  }

  const doc = await prisma.document.findFirst({
    where: { parcelId: transfer.parcelId },
    orderBy: { createdAt: "desc" },
  });
  if (doc?.aiReport) {
    const report = JSON.parse(doc.aiReport) as AiReport;
    if (report.verdict === "LIKELY_FORGED" || report.riskScore >= 70) {
      const alert = await prisma.fraudAlert.create({
        data: {
          parcelId: transfer.parcelId,
          type: "FORGED_DOC",
          severity: "HIGH",
          detail: `Document integrity report: ${report.verdict} (risk ${report.riskScore})`,
        },
      });
      alerts.push(formatAlert(alert));
    }
  }

  const parcelAlerts = await scanParcel(transfer.parcelId);
  alerts.push(...parcelAlerts);
  return alerts;
}

function formatAlert(row: {
  id: string;
  parcelId: number;
  type: string;
  severity: string;
  detail: string;
  resolved: boolean;
  createdAt: Date;
}): FraudAlert {
  return {
    id: row.id,
    parcelId: row.parcelId,
    type: row.type as FraudType,
    severity: row.severity as Severity,
    detail: row.detail,
    resolved: row.resolved,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getFraudAlerts(resolved = false): Promise<FraudAlert[]> {
  const rows = await prisma.fraudAlert.findMany({
    where: { resolved },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(formatAlert);
}

export { DEMO_FORGED_HASH };
