// @obscuranet/zcore mock implementation
// This module handles Z-Score calculations and token reward generation

/**
 * Calculate Z-Score based on GPT evaluation score
 * @param gptScore The score from GPT evaluation (0-10)
 * @returns Z-Score value
 */
export const calculateZScoreFromGpt = jest.fn().mockImplementation((gptScore) => {
  // Simple algorithm: multiply by 2.5 (makes a 0-10 scale into 0-25)
  if (typeof gptScore !== 'number' || isNaN(gptScore)) {
    return 0;
  }
  return Math.min(Math.max(gptScore * 2.5, 0), 25); // Keep within 0-25 range
});

/**
 * Generate token amount based on Z-Score
 * @param zScore The Z-Score value
 * @returns Token amount (integer)
 */
export const generateTokens = jest.fn().mockImplementation((zScore) => {
  if (typeof zScore !== 'number' || isNaN(zScore)) {
    return 0;
  }
  return Math.floor(zScore * 10); // Simple algorithm: 10 tokens per Z point
});

/**
 * Generate token rewards with boost for the primary category
 * @param zScore The Z-Score value
 * @param category The primary content category (TECHNICAL, CREATIVE, etc.)
 * @returns Object with token allocations across categories
 */
export const generateTokenRewardsWithBoost = jest.fn().mockImplementation((zScore, category) => {
  if (typeof zScore !== 'number' || isNaN(zScore)) {
    return {
      STX: 0,
      VIZ: 0,
      LOG: 0,
      CRE: 0,
      ANA: 0, 
      SYN: 0
    };
  }
  
  // Base rewards calculation
  const baseRewards = {
    STX: parseFloat((zScore / 5).toFixed(2)),
    VIZ: parseFloat((zScore / 6).toFixed(2)),
    LOG: parseFloat((zScore / 7).toFixed(2)),
    CRE: parseFloat((zScore / 8).toFixed(2)),
    ANA: parseFloat((zScore / 7.5).toFixed(2)),
    SYN: parseFloat((zScore / 6.5).toFixed(2))
  };
  
  // Apply 1.5x boost to the specified category if valid
  if (category && typeof category === 'string') {
    const validCategories = ['TECHNICAL', 'CREATIVE', 'ANALYSIS', 'SYNTHESIS'];
    if (validCategories.includes(category)) {
      baseRewards[category] = parseFloat((baseRewards[category] * 1.5).toFixed(2));
    }
  }
  
  return baseRewards;
});

/**
 * Legacy function for backward compatibility with tests
 * @param zScore The Z-Score value
 * @param category The primary content category
 * @returns Token rewards object
 */
export const calculateTokenRewards = jest.fn().mockImplementation((zScore, category) => {
  return generateTokenRewardsWithBoost(zScore, category);
});

/**
 * Normalize Z-score to a 0-10 scale
 * @param zScore Original Z-score (typically 0-25)
 * @returns Normalized Z-score (0-10)
 */
export const normalizeZScore = jest.fn().mockImplementation((zScore) => {
  if (typeof zScore !== 'number' || isNaN(zScore)) {
    return 0;
  }
  return Math.min(Math.max(zScore / 2.5, 0), 10);
});

/**
 * Calculate transaction fee based on token amount
 * @param amount The token amount
 * @returns Transaction fee amount
 */
export const calculateTxFee = jest.fn().mockImplementation((amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return 0;
  }
  return Math.max(parseFloat((amount * 0.01).toFixed(2)), 0.5); // 1% fee, min 0.5
});

/**
 * Get Z-score threshold for various platform features
 * @param featureType The feature type
 * @returns Z-score threshold value
 */
export const getZScoreThreshold = jest.fn().mockImplementation((featureType) => {
  const thresholds = {
    'NFT_MINT': 5,
    'PROJECT_CREATION': 10,
    'DAO_VOTING': 3,
    'DAO_PROPOSAL': 8,
    'TOKEN_EXCHANGE': 2
  };
  return thresholds[featureType] || 0;
});

/**
 * Calculate Z-score based on reward distribution
 * For error handling and testing edge cases
 */
export const calculateZScoreFromRewards = jest.fn().mockImplementation((rewards) => {
  if (!rewards || typeof rewards !== 'object') {
    return 0;
  }
  const total = Object.values(rewards).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
  return parseFloat((total / 5).toFixed(2));
});