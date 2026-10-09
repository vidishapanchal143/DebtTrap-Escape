import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const message = typeof body.message === "string" ? body.message.slice(0, 2000) : "";
  if (!message.trim()) {
    return NextResponse.json({ error: "Please provide a message." }, { status: 400 });
  }

  // Safe placeholder: no external AI provider is called yet.
  // Next implementation step: connect Gemini using server-only GEMINI_API_KEY,
  // structured output, explicit uncertainty, and evidence-linked responses.
  return NextResponse.json({
    mode: "demo",
    reply: "The agent API route is scaffolded, but Gemini is not connected yet. Your question was received. Next, connect a server-side model with validated inputs and evidence-grounded outputs.",
    receivedCharacters: message.length
  });
}