import { NextRequest } from "next/server";
import { ok, fail } from "@/lib/api-utils";

const SYSTEM_PROMPT = `
You are Bhumi-Bot, the official AI Legal & Technical Assistant for the BhuRaksha platform.
Your job is to provide highly accurate, professional, and concise answers regarding land registry, smart contracts, and the BhuRaksha platform.

Key Platform Facts:
- BhuRaksha is a multi-signature blockchain land registry system built on Ethereum (Sepolia).
- It prevents property fraud by requiring cryptographic signatures from the Seller, Buyer, and Government Registrar before any land changes hands.
- It uses AI (BhumiShield) to automatically scan uploaded property documents (PDF/Images) and flag forgeries, name mismatches, or missing signatures.
- Every property generates a public 'TrustSeal' QR code that anyone can scan to verify ownership instantly, without logging in.

1. NEVER hallucinate laws or numbers. If you do not know the exact stamp duty or legal fee for a specific state, explicitly say "Please consult the local state revenue department for exact rates."
2. Be highly professional, concise, and helpful. 
3. If asked about unrelated topics (like weather, sports, or coding), politely decline and remind the user that you only assist with BhuRaksha and land registry matters.
4. **NAVIGATION COMMANDS**: If the user explicitly asks to go to a specific page or feature (e.g. "take me to register parcel", "open the war room", "go to my approvals"), you MUST output a secret navigation token at the very beginning of your response in the exact format: \`[NAVIGATE:/path]\`. 
Available paths:
- \`/dashboard\` (Registrar Dashboard)
- \`/dashboard/register\` (Register New Parcel)
- \`/dashboard/transfers\` (Registrar War Room / Transfer Queue)
- \`/portal/parcels\` (My Parcels)
- \`/portal/transfer\` (Initiate a Transfer / Sell Land)
- \`/portal/approvals\` (Buyer Approvals / Pay Stamp Duty)
- \`/verify\` (Verify Property via Hash)
Example response: \`[NAVIGATE:/dashboard/register] I am taking you to the Register Parcel page now.\`
`;

export async function POST(req: NextRequest) {
  try {
    const { message, history = [] } = await req.json();

    if (!message) {
      return fail("Message is required", 400);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return fail("GEMINI_API_KEY is not configured", 500);
    }

    // Format history for Gemini. The first message MUST be a user message.
    let validHistory = history;
    while (validHistory.length > 0 && validHistory[0].role !== "user") {
      validHistory.shift();
    }

    const contents = validHistory.map((msg: { role: string, content: string }) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    // Add current user message
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        system_instruction: {
          parts: { text: SYSTEM_PROMPT }
        },
        contents: contents,
        generationConfig: {
          temperature: 0.2, // Low temperature for higher accuracy
          maxOutputTokens: 500
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API Error:", errText);
      return fail("AI service is currently unavailable.", 500);
    }

    const data = await response.json();
    const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't process that.";

    return ok({ reply: botReply });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return fail(error.message || "Internal server error", 500);
  }
}
