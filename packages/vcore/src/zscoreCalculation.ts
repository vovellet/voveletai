import { Z_SCORE_WEIGHT } from '@vovelet/shared';

/**
 * Calculates Z-Score based on Vove evaluation score
 * 
 * @param gptScore - The score from Vove evaluation (0-10)
 * @returns Z-Score value (0-25 range)
 */
export function calculateZScoreFromGpt(gptScore: number): number {
  if (typeof gptScore !== 'number' || isNaN(gptScore)) {
    return 0;
  }
  
  // Apply weights to score components
  // In a real implementation, this would use multiple factors from the Vove evaluation
  const qualityScore = gptScore * Z_SCORE_WEIGHT.QUALITY * 2.5;
  const uniquenessScore = gptScore * Z_SCORE_WEIGHT.UNIQUENESS * 2.5;
  const relevanceScore = gptScore * Z_SCORE_WEIGHT.RELEVANCE * 2.5;
  
  const totalScore = qualityScore + uniquenessScore + relevanceScore;
  
  // Ensure the score is within 0-25 range
  return Math.min(Math.max(totalScore, 0), 25);
}