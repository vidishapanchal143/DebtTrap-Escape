// src/app/api/wallet/prepare/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prepareTransfer, TransferRequest, PreparedTransfer } from '@/lib/ledger';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<TransferRequest>;
    // Validate required fields
    if (!body.recipient) {
      return NextResponse.json({ error: 'Invalid recipient address format' }, { status: 400 });
    }
    const prepared: PreparedTransfer = prepareTransfer(body as TransferRequest);
    // prepared variable defined after validation
    // Return the prepared data – note that balance is not changed yet.
    return NextResponse.json({
      recipient: prepared.recipient,
      amountCents: prepared.amountCents,
      feeCents: prepared.feeCents,
      totalDebitCents: prepared.totalDebit,
      totalDebit: prepared.totalDebit,
      idempotencyKey: prepared.idempotencyKey,
      message: 'Transfer prepared – confirm to commit.',
    });
  } catch (error: unknown) {
    console.error('Error preparing transfer:', error);
    const message = error instanceof Error ? error.message : 'Failed to prepare transfer.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
