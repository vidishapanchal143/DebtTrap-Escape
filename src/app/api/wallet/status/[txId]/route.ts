// src/app/api/wallet/status/[txId]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { getTransactionStatus } from '@/lib/ledger';

export const runtime = 'nodejs';

export async function GET(request: NextRequest, context: { params: Promise<{ txId: string }> }) {
  try {
    const { txId } = await context.params;
    const status = getTransactionStatus(txId);
    return NextResponse.json({ status });
  } catch (error: unknown) {
    console.error('Error fetching transaction status:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch status.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

