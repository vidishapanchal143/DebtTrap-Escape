// src/app/api/wallet/confirm/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { confirmTransfer, PreparedTransfer, ConfirmTransferResult } from '@/lib/ledger';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PreparedTransfer;
    const result: ConfirmTransferResult = confirmTransfer(body);
    return NextResponse.json({
      transactionId: result.txId,
      transactionHash: result.txHash,
      status: 'confirmed',
      message: 'Transfer committed successfully.',
    });
  } catch (error: unknown) {
    console.error('Error confirming transfer:', error);
    const message = error instanceof Error ? error.message : 'Failed to confirm transfer.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
