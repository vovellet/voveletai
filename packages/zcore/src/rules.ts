import { Z_SCORE_THRESHOLDS, Z_SCORE_LEVELS, SERVICES, SERVICE_TYPES, ZScoreLevel, ServiceType } from '@obscuranet/shared';

/**
 * Determine a user's Z-score level based on their total Z-score
 * @param totalZScore - User's total Z-score across all contributions
 * @returns The user's Z-score level (basic, pro, prime)
 */
export function determineZScoreLevel(totalZScore: number): ZScoreLevel {
  if (totalZScore >= Z_SCORE_THRESHOLDS[Z_SCORE_LEVELS.PRIME]) {
    return Z_SCORE_LEVELS.PRIME;
  } else if (totalZScore >= Z_SCORE_THRESHOLDS[Z_SCORE_LEVELS.PRO]) {
    return Z_SCORE_LEVELS.PRO;
  } else {
    return Z_SCORE_LEVELS.BASIC;
  }
}

/**
 * Get available services based on a user's Z-score level
 * @param zScoreLevel - User's Z-score level
 * @returns Array of available service types
 */
export function getAvailableServices(zScoreLevel: ZScoreLevel): ServiceType[] {
  const availableServices: ServiceType[] = [];
  
  switch (zScoreLevel) {
    case Z_SCORE_LEVELS.PRIME:
      availableServices.push(SERVICE_TYPES.Z_ORIGIN_BOOST);
      // Fall through to include all PRO services
    case Z_SCORE_LEVELS.PRO:
      availableServices.push(SERVICE_TYPES.NFT_MINT);
      // Fall through to include all BASIC services
    case Z_SCORE_LEVELS.BASIC:
      availableServices.push(SERVICE_TYPES.GPT_PREMIUM);
      break;
    default:
      break;
  }
  
  return availableServices;
}

/**
 * Check if a user with the given Z-score level can access a specific service
 * @param zScoreLevel - User's Z-score level
 * @param serviceType - The service to check access for
 * @returns Boolean indicating if the user can access the service
 */
export function canAccessService(zScoreLevel: ZScoreLevel, serviceType: ServiceType): boolean {
  const serviceZScoreLevel = SERVICES[serviceType].zScoreLevel;
  
  switch (zScoreLevel) {
    case Z_SCORE_LEVELS.PRIME:
      return true; // PRIME users can access all services
    case Z_SCORE_LEVELS.PRO:
      return serviceZScoreLevel === Z_SCORE_LEVELS.PRO || serviceZScoreLevel === Z_SCORE_LEVELS.BASIC;
    case Z_SCORE_LEVELS.BASIC:
      return serviceZScoreLevel === Z_SCORE_LEVELS.BASIC;
    default:
      return false;
  }
}

/**
 * Calculate a user's total Z-score based on all their contributions
 * @param zScores - Array of Z-scores from all the user's contributions
 * @returns Total Z-score value
 */
export function calculateTotalZScore(zScores: number[]): number {
  if (!zScores || zScores.length === 0) {
    return 0;
  }
  
  // Sum all Z-scores and round to 2 decimal places
  return parseFloat(zScores.reduce((sum, score) => sum + score, 0).toFixed(2));
}