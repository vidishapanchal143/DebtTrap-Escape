
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const RequestSchema = z.object({
  message: z.string().trim().min(1).max(2000),
});

const SYSTEM_INSTRUCTION = `
You are DebtTrap Escape, a responsible loan-awareness assistant.

Help users understand loan terms, EMIs, fees, repayment schedules,
and potential warning signs in simple English, Hindi, or Gujarati.

Rules:
- Never invent lender information or claim live RBI verification.
- Do not label a lender fraudulent without reliable evidence.
- Do not claim to calculate an official APR.
- Clearly explain assumptions and uncertainty.
- Never ask users to share PAN, Aadhaar, passwords, or OTPs.
- Do not claim to have reviewed files that were not provided.
- Give educational information, not guaranteed financial or legal advice.
- Help users understand crypto-backed loans, collateral,
  borrowing costs, and liquidation risk.
- Explain that crypto prices can change rapidly and collateral
  may be liquidated if the protocol's conditions are breached.
- Calculate risk only from the values provided by the user.
- Never claim live blockchain data or live protocol verification
  unless an actual data source is connected.
- Never request wallet seed phrases, private keys, or OTPs.
`;

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Enter a message of up to 2000 characters." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL_AGENT;

    if (!apiKey || !model) {
      return NextResponse.json(
        { error: "Gemini server configuration is missing." },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const result = await ai.models.generateContent({
      model,
      contents: parsed.data.message,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        maxOutputTokens: 700,
      },
    });

    const reply = result.text?.trim();

    if (!reply) {
      return NextResponse.json(
        { error: "Gemini returned an empty response. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      mode: "gemini",
      reply,
    });
  } catch (error) {
    console.error(
      "Agent request failed:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return NextResponse.json(
      { error: "The AI assistant could not respond. Please try again." },
      { status: 502 }
    );
  }
}
