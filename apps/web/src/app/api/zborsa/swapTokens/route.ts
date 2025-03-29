import { NextRequest, NextResponse } from 'next/server';
import { swapTokens } from '../../../../lib/firebase';

/**
 * API handler for swapping tokens
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, fromToken, toToken, amount } = body;
    
    if (!userId || !fromToken || !toToken || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Call Firebase Function
    const result = await swapTokens({
      userId,
      fromToken,
      toToken,
      amount
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in swapTokens API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to swap tokens' },
      { status: 500 }
    );
  }
}