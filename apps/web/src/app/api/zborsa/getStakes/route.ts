import { NextRequest, NextResponse } from 'next/server';
import { getActiveStakes } from '../../../../lib/firebase';

/**
 * API handler for getting active stakes
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }
    
    // Call Firebase Function
    const result = await getActiveStakes({
      userId
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in getStakes API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get active stakes' },
      { status: 500 }
    );
  }
}