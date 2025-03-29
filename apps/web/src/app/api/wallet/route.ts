import { NextResponse } from 'next/server';
import { TokenRewards, Z_SCORE_LEVELS } from '@obscuranet/shared';
import { determineZScoreLevel } from '@obscuranet/zcore';

export async function GET(request: Request) {
  try {
    // In a real implementation, this would:
    // 1. Authenticate the user
    // 2. Call the Firebase Function to get the wallet balance
    // 3. Return the real wallet data
    
    // Mock data for demonstration purposes
    const userId = 'test-user-id';
    
    // Generate some random token values for demonstration
    const walletBalance: TokenRewards = {
      STX: parseFloat((Math.random() * 10 + 5).toFixed(2)),
      VIZ: parseFloat((Math.random() * 8 + 4).toFixed(2)),
      LOG: parseFloat((Math.random() * 6 + 3).toFixed(2)),
      CRE: parseFloat((Math.random() * 7 + 4).toFixed(2)),
      ANA: parseFloat((Math.random() * 9 + 3).toFixed(2)),
      SYN: parseFloat((Math.random() * 6 + 4).toFixed(2)),
    };
    
    // Generate a random total Z-score for demonstration
    const totalZScore = parseFloat((Math.random() * 30 + 5).toFixed(2));
    const zScoreLevel = determineZScoreLevel(totalZScore);
    
    return NextResponse.json({
      success: true,
      userId,
      walletBalance,
      contributionsCount: Math.floor(Math.random() * 10) + 1,
      zScoreLevel,
      totalZScore,
    });
  } catch (error) {
    console.error('Error fetching wallet data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet data' },
      { status: 500 }
    );
  }
}