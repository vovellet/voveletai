import { NextRequest, NextResponse } from 'next/server';
import { getSwapHistory } from '../../../../lib/firebase';

/**
 * API handler for getting swap history
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, limit } = body;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }
    
    // Call Firebase Function
    const result = await getSwapHistory({
      userId,
      limit: limit || 10
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in swapHistory API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get swap history' },
      { status: 500 }
    );
  }
}