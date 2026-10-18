import { NextResponse, NextRequest } from 'next/server';

export type CancelTransferResponse = {
  status: 'cancelled' | 'not_found' | 'conflict';
  message?: string;
  error?: string;
  idempotencyKey: string;
};
import { cancelTransfer } from '@/lib/ledger';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  let idempotencyKey: string | undefined;
  try {
    const body = await request.json();
    idempotencyKey = body?.idempotencyKey;

    if (!idempotencyKey || typeof idempotencyKey !== 'string') {
      return NextResponse.json(
        { error: 'idempotencyKey is required and must be a non-empty string.' },
        { status: 400 }
      );
    }

    const wasCancelled = cancelTransfer(idempotencyKey);

    if (wasCancelled) {
      return NextResponse.json({
        status: 'cancelled',
        message: 'Transfer cancelled successfully.',
        idempotencyKey,
      });
    }

    // cancelTransfer returned false → no row existed for this key
    return NextResponse.json(
      {
        status: 'not_found',
        message: 'No pending transaction found for this idempotency key.',
        idempotencyKey,
      },
      { status: 404 }
    );
  } catch (error: unknown) {
    console.error('Error cancelling transfer:', error);
    const message = error instanceof Error ? error.message : 'Failed to cancel transfer.';

    // Distinguish between a conflict (already confirmed) and a generic error.
    if (message.includes('Cannot cancel a confirmed transaction') ||
        message.includes('concurrent operation may have confirmed')) {
      return NextResponse.json(
        { error: message, status: 'conflict' },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
