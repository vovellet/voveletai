import { ContributionCategory, ZScoreLevel, ServiceType, ProjectCategory, ProjectStatus } from './constants';

export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  displayName?: string;
  walletAddress?: string;
  role?: UserRole;
  zScoreLevel?: ZScoreLevel;
  totalZScore?: number;
  activeProjects?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Token rewards broken down by category
 */
export interface TokenRewards {
  STX: number; // Strategic Thinking tokens
  VIZ: number; // Visualization tokens
  LOG: number; // Logical Reasoning tokens
  CRE: number; // Creative Thinking tokens
  ANA: number; // Analysis tokens
  SYN: number; // Synthesis tokens
  [key: string]: number; // Allow indexing with string
}

/**
 * User contribution with analysis and rewards data
 */
export interface Contribution {
  id: string;
  userId: string;
  text: string;
  gptResponse: string;
  category: ContributionCategory;
  gptScore: number; // 0-10 score
  aiComment?: string;
  zScore: number;
  tokenAmount?: number;
  rewards: TokenRewards;
  nftMinted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Analysis of a contribution by the GPT engine
 */
export interface ContributionAnalysis {
  category: ContributionCategory;
  gptScore: number;
  aiComment?: string;
}

export interface TokenGenerationEvent {
  id: string;
  contributionId: string;
  userId: string;
  amount: number;
  createdAt: Date;
}

/**
 * Service requirements for token spending
 */
export interface ServiceRequirement {
  tokenType: string;
  amount: number;
  zScoreLevel: ZScoreLevel;
}

/**
 * Token spending transaction record
 */
export interface TokenSpendEvent {
  id: string;
  userId: string;
  serviceType: ServiceType;
  tokenType: string;
  amount: number;
  timestamp: Date;
  status: 'completed' | 'failed';
  metadata?: Record<string, any>;
}

/**
 * NFT metadata structure (follows OpenSea standard)
 */
export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  animation_url?: string;
  background_color?: string;
}

/**
 * NFT record stored in Firestore
 */
export interface NFT {
  id: string;
  userId: string;
  contributionId: string;
  tokenId: number;
  tokenURI: string;
  contractAddress: string;
  txHash: string;
  network: string;
  mintedAt: Date;
  metadata: NFTMetadata;
}

/**
 * Z-Origin project submission
 */
export interface ProjectSubmission {
  id: string;
  userId: string;
  name: string; // Project name
  symbol: string; // Token symbol (e.g., TRND)
  description: string;
  category: ProjectCategory;
  goal: string;
  tokenSupply: number;
  status: ProjectStatus;
  stakeAmount: number;
  evaluation?: ProjectEvaluation;
  contractAddress?: string;
  txHash?: string;
  network?: string;
  deployedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * GPT evaluation of a project
 */
export interface ProjectEvaluation {
  feasibilityScore: number; // 0-10
  originalityScore: number; // 0-10
  clarityScore: number; // 0-10
  overallScore: number; // 0-10
  feedback: string;
  evaluatedAt: Date;
}

/**
 * Project token details
 */
export interface ProjectToken {
  contractAddress: string;
  name: string;
  symbol: string;
  ownerAddress: string; // Creator's wallet address
  totalSupply: number;
  projectId: string;
  txHash: string;
  network: string;
  deployedAt: Date;
}

/**
 * System configuration parameters managed by admins
 */
export interface SystemConfig {
  id: string;
  tokenMintingCaps: {
    [key: string]: number; // Category: cap amount (e.g. STX: 1000)
  };
  stakingRequirements: {
    [key: string]: number; // Feature: required amount (e.g. PROJECT: 10)
  };
  minimumZScores: {
    [key: string]: number; // Feature: minimum Z-score (e.g. PROJECT: 150)
  };
  globalSettings: {
    registrationEnabled: boolean;
    contributionsEnabled: boolean;
    mintingEnabled: boolean;
    nftMintingEnabled: boolean;
    projectCreationEnabled: boolean;
  };
  lastUpdatedBy: string; // Admin user ID
  updatedAt: Date;
}

/**
 * GPT character configuration
 */
export interface GPTCharacter {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  temperature: number;
  active: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * System statistics
 */
export interface SystemStats {
  id: string;
  totalUsers: number;
  totalContributions: number;
  totalTokensMinted: {
    [key: string]: number; // Token type: amount
  };
  totalOnChainMints: number;
  totalNFTsMinted: number;
  totalProjects: number;
  activeProjects: number;
  deployedProjects: number;
  timestamp: Date;
}

/**
 * Z-Borsa token swap transaction
 */
export interface SwapTransaction {
  id: string;
  userId: string;
  fromToken: string;
  toToken: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
  fee: number;
  txHash?: string;
  status: 'completed' | 'failed' | 'pending';
  createdAt: Date;
}

/**
 * Z-Borsa staking record
 */
export interface StakeRecord {
  id: string;
  userId: string;
  tokenType: string;
  amount: number;
  yieldToken: string;
  yieldRate: number;
  lockPeriodDays: number;
  startDate: Date;
  endDate: Date;
  totalYieldAccrued: number;
  lastYieldAt: Date;
  status: 'active' | 'completed' | 'withdrawn';
}

/**
 * Z-Borsa token pair with rate information
 */
export interface TokenPair {
  fromToken: string;
  toToken: string;
  rate: number;
  fee: number;
  minAmount: number;
  maxAmount: number;
  isActive: boolean;
}

/**
 * Z-Borsa settings for admin panel
 */
export interface ZBorsaSettings {
  id: string;
  tokenPairs: TokenPair[];
  dailySwapLimit: number;
  dailySwapLimitPerUser: number;
  globalSwapEnabled: boolean;
  stakingEnabled: boolean;
  stakingOptions: {
    tokenType: string;
    yieldToken: string;
    yieldRate: number;
    lockPeriodDays: number;
    minAmount: number;
    maxAmount: number;
  }[];
  lastUpdatedBy: string;
  updatedAt: Date;
}
