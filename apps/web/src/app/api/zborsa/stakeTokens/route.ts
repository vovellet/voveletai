import { NextRequest, NextResponse } from 'next/server';
import { stakeTokens } from '../../../../lib/firebase';

/**
 * API handler for staking tokens
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, tokenType, amount, yieldToken, lockPeriodDays } = body;
    
    if (!userId || !tokenType || !amount || !yieldToken || !lockPeriodDays) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Call Firebase Function
    const result = await stakeTokens({
      userId,
      tokenType,
      amount,
      yieldToken,
      lockPeriodDays
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in stakeTokens API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to stake tokens' },
      { status: 500 }
    );
  }
}