import { NextResponse } from 'next/server';
import { getWalletBalance } from '@/lib/ledger';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const balance = getWalletBalance();
    return NextResponse.json({
      balance: balance.balance,
      asset: balance.asset,
      message: 'Simulation mode – demo funds only. No real crypto is transferred.',
    });
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    return NextResponse.json({ error: 'Failed to retrieve wallet balance.' }, { status: 500 });
  }
}
