import { 
  TokenPair,
  ZBORSA_CONSTANTS, 
  CONTRIBUTION_CATEGORIES 
} from '@obscuranet/shared';

// Store for the current token rates
let currentRates: TokenPair[] = [...ZBORSA_CONSTANTS.DEFAULT_TOKEN_PAIRS];

// Track demand for each token type
const tokenDemand: Record<string, number> = {};
Object.values(ZBORSA_CONSTANTS.TOKENS).forEach(token => {
  tokenDemand[token] = 1; // Base demand
});

// Track swap volume for each token pair
const pairVolume: Record<string, number> = {};
ZBORSA_CONSTANTS.DEFAULT_TOKEN_PAIRS.forEach(pair => {
  const pairKey = `${pair.fromToken}-${pair.toToken}`;
  pairVolume[pairKey] = 0;
});

/**
 * Get the current exchange rate between two tokens
 * @param fromToken Source token
 * @param toToken Target token
 * @returns Exchange rate or null if pair doesn't exist
 */
export function getRate(fromToken: string, toToken: string): number | null {
  const pair = currentRates.find(p => 
    p.fromToken === fromToken && p.toToken === toToken && p.isActive
  );
  
  return pair ? pair.rate : null;
}

/**
 * Estimate the output amount for a token swap
 * @param fromToken Source token
 * @param toToken Target token
 * @param amount Amount to swap
 * @returns Estimated output amount and fee or null if pair doesn't exist
 */
export function estimateOutput(
  fromToken: string, 
  toToken: string, 
  amount: number
): { outputAmount: number; fee: number } | null {
  const pair = currentRates.find(p => 
    p.fromToken === fromToken && p.toToken === toToken && p.isActive
  );
  
  if (!pair || amount < pair.minAmount || amount > pair.maxAmount) {
    return null;
  }
  
  const fee = amount * pair.fee;
  const outputAmount = (amount - fee) * pair.rate;
  
  return {
    outputAmount,
    fee
  };
}

/**
 * Check if a swap is valid (exists and within limits)
 * @param fromToken Source token
 * @param toToken Target token
 * @param amount Amount to swap
 * @returns Boolean indicating if swap is valid
 */
export function isValidSwap(
  fromToken: string, 
  toToken: string, 
  amount: number
): boolean {
  const pair = currentRates.find(p => 
    p.fromToken === fromToken && p.toToken === toToken && p.isActive
  );
  
  return !!(pair && amount >= pair.minAmount && amount <= pair.maxAmount);
}

/**
 * Update token demand based on contribution category
 * @param category The contribution category
 * @param score The contribution score (0-10)
 */
export function updateTokenDemand(category: string, score: number): void {
  if (Object.values(CONTRIBUTION_CATEGORIES).includes(category)) {
    // Increase demand for the token type based on the score
    tokenDemand[category] += score / 10;
    
    // Update rates based on new demand
    updateRates();
  }
}

/**
 * Record a swap to adjust volumes and influence rates
 * @param fromToken Source token
 * @param toToken Target token
 * @param amount Amount swapped
 */
export function recordSwap(fromToken: string, toToken: string, amount: number): void {
  const pairKey = `${fromToken}-${toToken}`;
  
  // Increase volume for this pair
  if (pairVolume[pairKey] !== undefined) {
    pairVolume[pairKey] += amount;
  } else {
    pairVolume[pairKey] = amount;
  }
  
  // Increase demand for the target token
  tokenDemand[toToken] += amount * 0.01;
  
  // Update rates based on new volume and demand
  updateRates();
}

/**
 * Update all exchange rates based on demand, volume, and time factors
 */
function updateRates(): void {
  currentRates = currentRates.map(pair => {
    const pairKey = `${pair.fromToken}-${pair.toToken}`;
    const volume = pairVolume[pairKey] || 0;
    
    // Calculate rate based on demand and volume
    const demandFactor = tokenDemand[pair.toToken] / tokenDemand[pair.fromToken];
    const volumeFactor = Math.log(volume + 1) / 10;
    
    // Create a base rate as the starting point (from default rates)
    const defaultPair = ZBORSA_CONSTANTS.DEFAULT_TOKEN_PAIRS.find(
      p => p.fromToken === pair.fromToken && p.toToken === pair.toToken
    );
    
    const baseRate = defaultPair ? defaultPair.rate : 1;
    
    // Calculate the new rate with demand and volume influences
    let newRate = baseRate;
    newRate *= (1 + (demandFactor - 1) * ZBORSA_CONSTANTS.DEMAND_INFLUENCE);
    newRate *= (1 + volumeFactor * ZBORSA_CONSTANTS.VOLUME_INFLUENCE);
    
    // Add a small random factor to simulate market dynamics
    const randomFactor = 1 + (Math.random() * 0.02 - 0.01); // ±1% random change
    newRate *= randomFactor;
    
    return {
      ...pair,
      rate: parseFloat(newRate.toFixed(4))
    };
  });
}

/**
 * Get all active token pairs with current rates
 * @returns Array of token pairs
 */
export function getAllTokenPairs(): TokenPair[] {
  return currentRates.filter(pair => pair.isActive);
}

/**
 * Get all token pairs for a specific token
 * @param token The token to find pairs for
 * @returns Array of token pairs where the specified token is either source or target
 */
export function getTokenPairs(token: string): TokenPair[] {
  return currentRates.filter(
    pair => (pair.fromToken === token || pair.toToken === token) && pair.isActive
  );
}

/**
 * Reset rates to default values (for testing or emergency reset)
 */
export function resetRates(): void {
  currentRates = [...ZBORSA_CONSTANTS.DEFAULT_TOKEN_PAIRS];
  
  Object.values(ZBORSA_CONSTANTS.TOKENS).forEach(token => {
    tokenDemand[token] = 1;
  });
  
  Object.keys(pairVolume).forEach(key => {
    pairVolume[key] = 0;
  });
}

// Initialize with a scheduled rate update
setInterval(updateRates, ZBORSA_CONSTANTS.RATE_UPDATE_INTERVAL);