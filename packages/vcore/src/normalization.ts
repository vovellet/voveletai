/**
 * Normalize Z-score to a 0-10 scale for display or calculations
 * 
 * @param zScore - Original Z-score (typically 0-25)
 * @returns Normalized Z-score (0-10)
 */
export function normalizeZScore(zScore: number): number {
  if (typeof zScore !== 'number' || isNaN(zScore)) {
    return 0;
  }
  
  // Scale from 0-25 to 0-10
  return Math.min(Math.max(zScore / 2.5, 0), 10);
}