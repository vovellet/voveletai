import { NextRequest, NextResponse } from 'next/server';
import { withdrawStake } from '../../../../lib/firebase';

/**
 * API handler for withdrawing a stake
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, stakeId } = body;
    
    if (!userId || !stakeId) {
      return NextResponse.json(
        { error: 'userId and stakeId are required' },
        { status: 400 }
      );
    }
    
    // Call Firebase Function
    const result = await withdrawStake({
      userId,
      stakeId
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in withdrawStake API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to withdraw stake' },
      { status: 500 }
    );
  }
}