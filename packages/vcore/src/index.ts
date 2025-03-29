import { Z_SCORE_WEIGHT, TOKEN_GENERATION, CONTRIBUTION_CATEGORIES, TokenRewards } from '@vovelet/shared';

/**
 * Calculate Z-score based on contribution quality metrics
 * @param quality - Quality score (0-1)
 * @param uniqueness - Uniqueness score (0-1)
 * @param relevance - Relevance score (0-1)
 * @returns Z-score value between 0 and 1
 */
export function calculateZScore(
  quality: number,
  uniqueness: number,
  relevance: number
): number {
  // Simple weighted average for now
  const zScore =
    quality * Z_SCORE_WEIGHT.QUALITY +
    uniqueness * Z_SCORE_WEIGHT.UNIQUENESS +
    relevance * Z_SCORE_WEIGHT.RELEVANCE;

  // Ensure the value is between 0 and 1
  return Math.max(0, Math.min(1, zScore));
}

/**
 * Calculate Z-score based on GPT score
 * @param gptScore - GPT score (0-10)
 * @returns Z-score value
 */
export function calculateZScoreFromGpt(gptScore: number): number {
  // Simple calculation as per requirements
  return gptScore * 2.5 + Math.random();
}

/**
 * Generate token amount based on Z-score
 * @param zScore - Z-score value between 0 and 1
 * @returns Number of tokens to be generated
 */
export function generateTokens(zScore: number): number {
  const tokenAmount = TOKEN_GENERATION.BASE_AMOUNT +
    Math.floor(zScore * TOKEN_GENERATION.MULTIPLIER * TOKEN_GENERATION.BASE_AMOUNT);

  // Cap the maximum tokens per contribution
  return Math.min(tokenAmount, TOKEN_GENERATION.MAX_TOKENS_PER_CONTRIBUTION);
}

/**
 * Generate estimated token rewards per category based on Z-score
 * @param zScore - Z-score value
 * @returns Object with token amounts per category
 */
export function generateTokenRewards(zScore: number): TokenRewards {
  // Initialize rewards object with all categories set to 0
  const rewards: TokenRewards = {
    STX: 0,
    VIZ: 0,
    LOG: 0,
    CRE: 0,
    ANA: 0,
    SYN: 0,
  };
  
  // Calculate token values per category using the simplified formulas
  rewards.STX = parseFloat((zScore / 5).toFixed(2));
  rewards.VIZ = parseFloat((zScore / 6).toFixed(2));
  rewards.LOG = parseFloat((zScore / 7).toFixed(2));
  rewards.CRE = parseFloat((zScore / 8).toFixed(2));
  rewards.ANA = parseFloat((zScore / 7.5).toFixed(2));
  rewards.SYN = parseFloat((zScore / 6.5).toFixed(2));
  
  return rewards;
}

/**
 * Generate token rewards with a boost for the primary category
 * @param zScore - Z-score value
 * @param category - Primary category of the contribution
 * @returns Object with token amounts per category
 */
export function generateTokenRewardsWithBoost(zScore: number, category: keyof typeof CONTRIBUTION_CATEGORIES): TokenRewards {
  // Get base rewards
  const rewards = generateTokenRewards(zScore);
  
  // Apply a boost (1.5x) to the primary category
  rewards[category] = parseFloat((rewards[category] * 1.5).toFixed(2));
  
  return rewards;
}

// Export all Z-score level and service utility functions
export * from './rules';

// Export token rate functions
export * from './tokenRates';
