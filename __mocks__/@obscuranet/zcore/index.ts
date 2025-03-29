import { jest } from '@jest/globals';

export const calculateTokenRewards = jest.fn().mockImplementation((zScore, category) => ({
  STX: Math.floor(zScore / 5 * 10) / 10,
  VIZ: Math.floor(zScore / 6 * 10) / 10,
  LOG: Math.floor(zScore / 7 * 10) / 10,
  CRE: Math.floor(zScore / 8 * 10) / 10,
  ANA: Math.floor(zScore / 7.5 * 10) / 10,
  SYN: Math.floor(zScore / 6.5 * 10) / 10,
  [category]: Math.floor(zScore / 5 * 10 * 1.5) / 10
}));

export const normalizeZScore = jest.fn().mockImplementation((score) => 
  Math.min(10, Math.max(0, score))
);

// Add additional functions from the original implementation that might be used in tests
export const calculateZScoreFromGpt = jest.fn().mockImplementation(score => score * 2.5);
export const generateTokens = jest.fn().mockImplementation(zScore => Math.floor(zScore * 10));
export const generateTokenRewardsWithBoost = jest.fn().mockImplementation((zScore, category) => ({
  STX: Math.floor(zScore / 5 * 10) / 10,
  VIZ: Math.floor(zScore / 6 * 10) / 10,
  LOG: Math.floor(zScore / 7 * 10) / 10,
  CRE: Math.floor(zScore / 8 * 10) / 10,
  ANA: Math.floor(zScore / 7.5 * 10) / 10,
  SYN: Math.floor(zScore / 6.5 * 10) / 10,
  [category]: Math.floor(zScore / 5 * 10 * 1.5) / 10
}));

// Export as default and named exports for flexibility
export default {
  calculateTokenRewards,
  normalizeZScore,
  calculateZScoreFromGpt,
  generateTokens,
  generateTokenRewardsWithBoost
};