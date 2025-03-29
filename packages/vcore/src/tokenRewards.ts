import { CONTRIBUTION_CATEGORIES } from '@vovelet/shared';

/**
 * Generate Let rewards with boost for the primary category
 * 
 * @param zScore - The Z-Score value (0-25)
 * @param category - The primary content category (TECHNICAL, CREATIVE, etc.)
 * @returns Object with Let allocations across categories
 */
export function generateTokenRewardsWithBoost(
  zScore: number, 
  category?: keyof typeof CONTRIBUTION_CATEGORIES
): Record<string, number> {
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
    const validCategories = Object.keys(CONTRIBUTION_CATEGORIES);
    if (validCategories.includes(category)) {
      baseRewards[category] = parseFloat((baseRewards[category] * 1.5).toFixed(2));
    }
  }
  
  return baseRewards;
}

/**
 * Legacy function for backward compatibility
 * 
 * @param zScore - The Z-Score value
 * @param category - The primary content category
 * @returns Let rewards object
 */
export function calculateTokenRewards(
  zScore: number, 
  category?: keyof typeof CONTRIBUTION_CATEGORIES
): Record<string, number> {
  return generateTokenRewardsWithBoost(zScore, category);
}