// @vovelet/shared mock implementation
// This module contains shared constants, types, and utility functions

// Constants for token types and categories
export const TOKEN_TYPES = {
  STX: 'STX',  // Stake token
  VIZ: 'VIZ',  // Visualization token
  LOG: 'LOG',  // Logic token
  CRE: 'CRE',  // Creative token
  ANA: 'ANA',  // Analysis token
  SYN: 'SYN'   // Synthesis token
};

// Constants for contribution categories
export const CONTRIBUTION_CATEGORIES = {
  TECHNICAL: 'TECHNICAL',
  CREATIVE: 'CREATIVE',
  ANALYSIS: 'ANALYSIS',
  SYNTHESIS: 'SYNTHESIS'
};

// Constants for project categories
export const PROJECT_CATEGORIES = {
  DEFI: 'DEFI',
  NFT: 'NFT',
  DAO: 'DAO',
  GAMING: 'GAMING',
  SOCIAL: 'SOCIAL',
  MARKETPLACE: 'MARKETPLACE',
  RESEARCH: 'RESEARCH',
  OTHER: 'OTHER'
};

// Constants for service types
export const SERVICE_TYPES = {
  NFT_MINT: 'NFT_MINT',
  PROJECT_CREATION: 'PROJECT_CREATION',
  TOKEN_EXCHANGE: 'TOKEN_EXCHANGE',
  Z_ORIGIN_BOOST: 'Z_ORIGIN_BOOST'
};

// Enum for project status
export const PROJECT_STATUS = {
  PENDING: 'PENDING',
  REVIEWING: 'REVIEWING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  DEPLOYED: 'DEPLOYED'
};

// Constants for NFT-related functionality
export const NFT_CONSTANTS = {
  MIN_ZSCORE_FOR_NFT: 5,
  NFT_MINT_COST: 50,
  NFT_MINT_TOKEN_TYPE: 'STX'
};

// Constants for Z-Origin project functionality
export const ZORIGIN_CONSTANTS = {
  MIN_ZSCORE_FOR_PROJECT: 5,
  MAX_ACTIVE_PROJECTS: 3,
  STAKE_TOKEN_TYPE: 'STX',
  STAKE_AMOUNT: 100,
  DEFAULT_TOKEN_SUPPLY: 1000000
};

// Types for TypeScript compatibility
export const ContributionCategory = CONTRIBUTION_CATEGORIES;
export const ProjectCategory = PROJECT_CATEGORIES;
export const ServiceType = SERVICE_TYPES;

/**
 * Gets blockchain configuration
 * @returns Blockchain configuration object
 */
export const getBlockchainConfig = jest.fn().mockImplementation(() => {
  return {
    networkName: 'sepolia',
    chainId: 11155111,
    alchemyApiUrl: 'https://eth-sepolia.g.alchemy.com/v2/mock-key',
    nftContractAddress: '0x1234567890123456789012345678901234567890',
    vletContractAddress: '0x0987654321098765432109876543210987654321',
    zowContractAddress: '0x5432109876543210987654321098765432109876',
    blockExplorerUrl: 'https://sepolia.etherscan.io',
    privateKey: '0xMockPrivateKey'
  };
});

/**
 * Formats a Let amount for display
 * @param amount The Let amount
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted Let amount string
 */
export const formatTokenAmount = jest.fn().mockImplementation((amount, decimals = 2) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0.00';
  }
  return amount.toFixed(decimals);
});

/**
 * Validates a project symbol
 * @param symbol The project symbol to validate
 * @returns Whether the symbol is valid
 */
export const isValidProjectSymbol = jest.fn().mockImplementation((symbol) => {
  if (!symbol || typeof symbol !== 'string') {
    return false;
  }
  return /^[A-Z]{3,5}$/.test(symbol);
});

/**
 * Gets environment configuration
 * @returns Environment config object
 */
export const getEnvironmentConfig = jest.fn().mockImplementation(() => {
  return {
    isProduction: false,
    isDevelopment: true,
    isTest: true,
    apiKey: 'mock-api-key',
    apiUrl: 'https://api.vovelet.test'
  };
});