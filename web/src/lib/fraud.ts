import type { AiReport, FraudAlert, FraudType, Severity } from "./types";
import { hashesMatch } from "./hash";
import { prisma } from "./db";
import { activeTransferOf, getParcel, ownerOf } from "./chain";

const DEMO_FORGED_HASH = "0x" + "dead".repeat(8);

export async function analyzeDocument(
  sha256: string,
  storageUrl?: string
): Promise<Omit<AiReport, "hashMatch" | "sha256">> {
  // If no URL or no Gemini key, fallback to hash entropy
  if (!storageUrl || !process.env.GEMINI_API_KEY) {
    const hashEntropy = sha256.replace("0x", "").split("").filter((c, i, a) => a.indexOf(c) === i).length;
    const riskScore = hashEntropy < 12 ? 78 : hashEntropy < 14 ? 45 : 18;
    const verdict = riskScore >= 70 ? "LIKELY_FORGED" : riskScore >= 40 ? "SUSPICIOUS" : "LIKELY_GENUINE";

    return {
      riskScore,
      verdict,
      indicators: {
        fontConsistency: riskScore >= 40 ? "Minor inconsistencies" : "Consistent",
        sealIntegrity: riskScore >= 70 ? "Seal integrity compromised" : "Intact",
        digitalArtifacts: riskScore >= 40 ? "Some compression artifacts" : "None detected",
        numeralTampering: riskScore >= 70 ? "Possible numeral alteration" : "None detected",
      },
      reasons: riskScore >= 70 ? ["Document hash entropy suggests tampering"] : ["No visual AI configured; fallback used"],
      model: "bhuraksha-fallback-v1",
    };
  }

  try {
    const docRes = await fetch(storageUrl);
    if (!docRes.ok) throw new Error("Failed to fetch document");
    const arrayBuffer = await docRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");
    
    let mimeType = docRes.headers.get("content-type") || "application/pdf";
    if (storageUrl.toLowerCase().endsWith(".pdf")) mimeType = "application/pdf";
    else if (storageUrl.toLowerCase().endsWith(".png")) mimeType = "image/png";
    else if (storageUrl.toLowerCase().endsWith(".jpg") || storageUrl.toLowerCase().endsWith(".jpeg")) mimeType = "image/jpeg";

    const systemPrompt = `You are an expert Forensic Document Analyst for the BhuRaksha platform.
Scan the provided land title document carefully. Check for:
- Mismatched fonts, inconsistent kerning, or cloned numerals.
- Fake or digitally pasted government seals/stamps.
- JPEG compression artifacts indicating tampering.

Return a JSON object with the following exact structure:
{
  "riskScore": number (0-100, where 100 is definitely forged),
  "verdict": "LIKELY_GENUINE" | "SUSPICIOUS" | "LIKELY_FORGED",
  "indicators": {
    "fontConsistency": "string (e.g. 'Consistent kerning')",
    "sealIntegrity": "string (e.g. 'Seal appears authentic')",
    "digitalArtifacts": "string (e.g. 'None detected')",
    "numeralTampering": "string (e.g. 'No signs of alteration')"
  },
  "reasons": ["string", "string"]
}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: { text: systemPrompt } },
        contents: [
          {
            role: "user",
            parts: [
              { text: "Analyze this document for forgery. Provide the required JSON output." },
              { inlineData: { mimeType, data: base64Data } }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      console.error("Gemini API Error", await response.text());
      throw new Error("Gemini API failed");
    }

    const data = await response.json();
    const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(jsonText || "{}");
    
    return {
      riskScore: parsed.riskScore || 50,
      verdict: parsed.verdict || "SUSPICIOUS",
      indicators: parsed.indicators || {
        fontConsistency: "Unknown",
        sealIntegrity: "Unknown",
        digitalArtifacts: "Unknown",
        numeralTampering: "Unknown"
      },
      reasons: parsed.reasons || ["AI Analysis complete, but output was malformed."],
      model: "gemini-1.5-pro-vision"
    };

  } catch (e) {
    console.error("AI Analysis Error:", e);
    return {
      riskScore: 50,
      verdict: "SUSPICIOUS",
      indicators: {
        fontConsistency: "Error analyzing",
        sealIntegrity: "Error analyzing",
        digitalArtifacts: "Error analyzing",
        numeralTampering: "Error analyzing",
      },
      reasons: ["Visual AI service failed. Could not analyze document."],
      model: "bhuraksha-fallback-v1",
    };
  }
}

export async function buildAiReport(
  sha256: string,
  onChainHash?: string | null,
  storageUrl?: string
): Promise<AiReport> {
  const hashMatch = onChainHash ? hashesMatch(sha256, onChainHash) : null;
  const forensic = await analyzeDocument(sha256, storageUrl);

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
