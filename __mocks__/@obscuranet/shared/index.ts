// Define types and constants that might be used in tests
export const CONTRIBUTION_CATEGORIES = {
  TECHNICAL: 'TECHNICAL',
  CREATIVE: 'CREATIVE',
  ANALYSIS: 'ANALYSIS'
};

export const ContributionCategory = {
  TECHNICAL: 'TECHNICAL',
  CREATIVE: 'CREATIVE',
  ANALYSIS: 'ANALYSIS'
};

export const PROJECT_STATUS = {
  PENDING: 'PENDING',
  REVIEWING: 'REVIEWING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  DEPLOYED: 'DEPLOYED'
};

export const NFT_CONSTANTS = {
  MIN_ZSCORE_FOR_NFT: 5
};

export const ZORIGIN_CONSTANTS = {
  MIN_ZSCORE_FOR_PROJECT: 5,
  STAKE_TOKEN_TYPE: 'STX',
  STAKE_AMOUNT: 100,
  DEFAULT_TOKEN_SUPPLY: 1000000,
  MAX_ACTIVE_PROJECTS: 3
};

export const getBlockchainConfig = () => ({
  alchemyApiUrl: 'https://eth-sepolia.g.alchemy.com/v2/mock-key',
  nftContractAddress: '0x1234567890123456789012345678901234567890',
  networkName: 'sepolia',
  blockExplorerUrl: 'https://sepolia.etherscan.io',
  privateKey: '0xMockPrivateKey'
});

// Define interfaces that might be used in tests
export interface TokenRewards {
  STX: number;
  VIZ: number;
  LOG: number;
  CRE: number;
  ANA: number;
  SYN: number;
  [key: string]: number;
}

export interface ContributionAnalysis {
  category: keyof typeof CONTRIBUTION_CATEGORIES;
  gptScore: number;
  aiComment?: string;
}

export interface ProjectEvaluation {
  feasibilityScore: number;
  originalityScore: number;
  clarityScore: number;
  overallScore: number;
  feedback: string;
  evaluatedAt: Date;
}

export interface Contribution {
  id: string;
  userId: string;
  text: string;
  gptResponse: string;
  category: keyof typeof CONTRIBUTION_CATEGORIES;
  gptScore: number;
  aiComment?: string;
  zScore: number;
  tokenAmount?: number;
  rewards: TokenRewards;
  nftMinted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Export as default and named exports for flexibility
export default {
  CONTRIBUTION_CATEGORIES,
  ContributionCategory,
  PROJECT_STATUS,
  NFT_CONSTANTS,
  ZORIGIN_CONSTANTS,
  getBlockchainConfig
};