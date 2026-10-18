import { NextResponse } from 'next/server';
import { getTransactionHistory, TransactionRecord } from '@/lib/ledger';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') ?? '20');
    const offset = Number(url.searchParams.get('offset') ?? '0');
    const history: TransactionRecord[] = getTransactionHistory({ limit, offset });
    return NextResponse.json({ history });
  } catch (error: unknown) {
    console.error('Error fetching transaction history:', error);
    const message = error instanceof Error ? error.message : 'Failed to retrieve history.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
