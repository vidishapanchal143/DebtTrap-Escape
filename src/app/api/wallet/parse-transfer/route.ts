// src/app/api/wallet/parse-transfer/route.ts
import { NextResponse, NextRequest } from "next/server";
import { parseTransferIntent } from "@/lib/transfer-intent";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, connectedAddress } = body || {};

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { ok: false, error: "A message string is required to parse transfer intent." },
        { status: 400 }
      );
    }

    const result = parseTransferIntent(message, connectedAddress);
    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error || result.clarificationMessage || "Failed to parse transfer intent.",
          missingFields: result.missingFields,
          clarificationMessage: result.clarificationMessage,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      intent: result.intent,
      message: "Transfer intent parsed and validated successfully.",
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Internal error parsing transfer intent.";
    return NextResponse.json({ ok: false, error: errMessage }, { status: 500 });
  }
}
