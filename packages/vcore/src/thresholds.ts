/**
 * Get Z-score threshold for various platform features
 * 
 * @param featureType - The feature type identifier
 * @returns Z-score threshold value for the feature
 */
export function getZScoreThreshold(featureType: string): number {
  const thresholds: Record<string, number> = {
    'NFT_MINT': 5,
    'PROJECT_CREATION': 10,
    'DAO_VOTING': 3,
    'DAO_PROPOSAL': 8,
    'TOKEN_EXCHANGE': 2,
    'PREMIUM_ANALYSIS': 4,
    'ADVANCED_FEATURES': 6
  };
  
  return thresholds[featureType] || 0;
}