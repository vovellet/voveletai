import { NextResponse } from 'next/server';
import { analyzeContribution, analyzeContributionLegacy } from '@obscuranet/gpt-engine';
import { calculateZScoreFromGpt, generateTokens, generateTokenRewardsWithBoost } from '@obscuranet/zcore';
import { ContributionAnalysis, TokenRewards } from '@obscuranet/shared';

export async function POST(request: Request) {
  try {
    const { text, userId = 'anonymous' } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Valid text is required' },
        { status: 400 }
      );
    }

    // In a real implementation, we'd validate the user is authenticated
    // and get their actual userId

    // Analyze the contribution using GPT
    const analysis: ContributionAnalysis = await analyzeContribution(text);
    
    // For backward compatibility
    const gptResponse = await analyzeContributionLegacy(text);
    
    // Calculate Z-score from GPT score
    const zScore = calculateZScoreFromGpt(analysis.gptScore);
    
    // Generate token amount (legacy)
    const tokenAmount = generateTokens(zScore);
    
    // Generate token rewards by category with a boost for the primary category
    const rewards = generateTokenRewardsWithBoost(zScore, analysis.category);
    
    // In a real implementation, we would store this in Firestore
    const contribution = {
      id: Date.now().toString(),
      userId,
      text,
      gptResponse, // Keep for backward compatibility
      category: analysis.category,
      gptScore: analysis.gptScore,
      aiComment: analysis.aiComment,
      zScore,
      tokenAmount, // Legacy token amount
      rewards, // New token rewards by category
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    return NextResponse.json({
      success: true,
      contribution,
      analysis: {
        category: analysis.category,
        gptScore: analysis.gptScore,
        aiComment: analysis.aiComment
      },
      zScore,
      tokenAmount,
      rewards, // Include token rewards in the response
    });
  } catch (error) {
    console.error('Error submitting contribution:', error);
    return NextResponse.json(
      { error: 'Failed to process contribution' },
      { status: 500 }
    );
  }
}
