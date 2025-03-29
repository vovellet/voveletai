export const Z_SCORE_WEIGHT = {
  QUALITY: 0.4,
  UNIQUENESS: 0.3,
  RELEVANCE: 0.3,
};

export const TOKEN_GENERATION = {
  BASE_AMOUNT: 10,
  MULTIPLIER: 2,
  MAX_TOKENS_PER_CONTRIBUTION: 100,
};

export const VOVE_CHARACTERS = {
  ANALYST: 'analyst',
  CURATOR: 'curator',
  CRITIC: 'critic',
};

export const CONTRIBUTION_CATEGORIES = {
  STX: 'STX', // Strategic Thinking
  VIZ: 'VIZ', // Visualization
  LOG: 'LOG', // Logical Reasoning
  CRE: 'CRE', // Creative Thinking
  ANA: 'ANA', // Analysis
  SYN: 'SYN', // Synthesis
};

export type ContributionCategory = keyof typeof CONTRIBUTION_CATEGORIES;

// Z-Score levels for user card
export const Z_SCORE_LEVELS = {
  BASIC: 'basic',
  PRO: 'pro',
  PRIME: 'prime',
};

export type ZScoreLevel = keyof typeof Z_SCORE_LEVELS;

// Z-Score thresholds for each level
export const Z_SCORE_THRESHOLDS = {
  [Z_SCORE_LEVELS.BASIC]: 0,     // 0-10 total Z-score
  [Z_SCORE_LEVELS.PRO]: 10,      // 10-25 total Z-score
  [Z_SCORE_LEVELS.PRIME]: 25,    // 25+ total Z-score
};

// Service types available for spending Lets
export const SERVICE_TYPES = {
  VOVE_PREMIUM: 'vove_premium',
  NFT_MINT: 'nft_mint',
  Z_ORIGIN_BOOST: 'z_origin_boost',
};

export type ServiceType = keyof typeof SERVICE_TYPES;

// Service details with Let requirements and Z-score level requirements
export const SERVICES = {
  [SERVICE_TYPES.VOVE_PREMIUM]: {
    name: 'Vove Premium',
    description: 'Access to premium Vove features and models',
    tokenType: 'LOG',
    amount: 2.5,
    zScoreLevel: Z_SCORE_LEVELS.BASIC,
  },
  [SERVICE_TYPES.NFT_MINT]: {
    name: 'NFT Mint',
    description: 'Mint an exclusive VoveCard NFT',
    tokenType: 'VIZ',
    amount: 3.5,
    zScoreLevel: Z_SCORE_LEVELS.PRO,
  },
  [SERVICE_TYPES.Z_ORIGIN_BOOST]: {
    name: 'Z-Origin Boost',
    description: 'Boost your Z-score calculation for all future contributions',
    tokenType: 'STX',
    amount: 5.0,
    zScoreLevel: Z_SCORE_LEVELS.PRIME,
  },
};

// NFT-related constants
export const NFT_CONSTANTS = {
  // Minimum Z-score required to be eligible for NFT minting
  MIN_ZSCORE_FOR_NFT: 150,
  
  // Default background colors based on contribution category
  BACKGROUND_COLORS: {
    [CONTRIBUTION_CATEGORIES.STX]: '#4A5568', // Strategic Thinking - Slate gray
    [CONTRIBUTION_CATEGORIES.VIZ]: '#3182CE', // Visualization - Blue
    [CONTRIBUTION_CATEGORIES.LOG]: '#805AD5', // Logical Reasoning - Purple
    [CONTRIBUTION_CATEGORIES.CRE]: '#F6AD55', // Creative Thinking - Orange
    [CONTRIBUTION_CATEGORIES.ANA]: '#48BB78', // Analysis - Green
    [CONTRIBUTION_CATEGORIES.SYN]: '#F56565', // Synthesis - Red
  },
  
  // Collection name and description for OpenSea metadata
  COLLECTION_NAME: 'VoveletAI Contributions',
  COLLECTION_DESCRIPTION: 'Unique NFTs representing high-quality contributions to the VoveletAI platform.',
  
  // External URL format (to be used with contribution ID)
  EXTERNAL_URL_FORMAT: 'https://vovelet.example.com/contributions/{id}',
};

// NFT attributes based on contribution properties
export const NFT_ATTRIBUTES = {
  CATEGORY: 'Category',
  ZSCORE: 'Z-Score',
  VOVE_SCORE: 'Vove Score',
  CREATED_AT: 'Created At',
  LET_REWARDS: 'Let Rewards',
};

// Z-Origin project categories
export const PROJECT_CATEGORIES = {
  DEFI: 'defi',
  NFT: 'nft',
  GAMING: 'gaming',
  SOCIAL: 'social',
  UTILITY: 'utility',
  DATA: 'data',
  OTHER: 'other',
};

export type ProjectCategory = keyof typeof PROJECT_CATEGORIES;

// Z-Origin project status values
export const PROJECT_STATUS = {
  PENDING: 'pending',
  REVIEWING: 'reviewing',
  APPROVED: 'approved',
  DEPLOYED: 'deployed',
  REJECTED: 'rejected',
};

export type ProjectStatus = typeof PROJECT_STATUS[keyof typeof PROJECT_STATUS];

// Z-Origin project constants
export const ZORIGIN_CONSTANTS = {
  // Minimum Z-score required to create a project
  MIN_ZSCORE_FOR_PROJECT: 150,
  
  // Required VLET stake amount
  STAKE_AMOUNT: 10,
  
  // Maximum active projects per user
  MAX_ACTIVE_PROJECTS: 1,
  
  // Default token supply for new projects
  DEFAULT_TOKEN_SUPPLY: 1000000,
  
  // Stake token type
  STAKE_TOKEN_TYPE: 'VLET',
};

// Z-Borsa swap constants
export const ZBORSA_CONSTANTS = {
  // Base tokens available in Z-Borsa
  TOKENS: {
    VLET: 'VLET', // VoveletAI token
    STX: 'STX', // Strategic Thinking
    VIZ: 'VIZ', // Visualization
    LOG: 'LOG', // Logical Reasoning
    CRE: 'CRE', // Creative Thinking
    ANA: 'ANA', // Analysis
    SYN: 'SYN', // Synthesis
  },
  
  // Default token pairs with initial rates
  DEFAULT_TOKEN_PAIRS: [
    { fromToken: 'VLET', toToken: 'STX', rate: 2.4, fee: 0.01, minAmount: 0.1, maxAmount: 100, isActive: true },
    { fromToken: 'VLET', toToken: 'VIZ', rate: 2.2, fee: 0.01, minAmount: 0.1, maxAmount: 100, isActive: true },
    { fromToken: 'VLET', toToken: 'LOG', rate: 2.0, fee: 0.01, minAmount: 0.1, maxAmount: 100, isActive: true },
    { fromToken: 'VLET', toToken: 'CRE', rate: 1.8, fee: 0.01, minAmount: 0.1, maxAmount: 100, isActive: true },
    { fromToken: 'VLET', toToken: 'ANA', rate: 1.6, fee: 0.01, minAmount: 0.1, maxAmount: 100, isActive: true },
    { fromToken: 'VLET', toToken: 'SYN', rate: 1.4, fee: 0.01, minAmount: 0.1, maxAmount: 100, isActive: true },
    { fromToken: 'STX', toToken: 'VLET', rate: 0.4, fee: 0.02, minAmount: 0.5, maxAmount: 200, isActive: true },
    { fromToken: 'VIZ', toToken: 'VLET', rate: 0.45, fee: 0.02, minAmount: 0.5, maxAmount: 200, isActive: true },
    { fromToken: 'LOG', toToken: 'VLET', rate: 0.5, fee: 0.02, minAmount: 0.5, maxAmount: 200, isActive: true },
    { fromToken: 'CRE', toToken: 'VLET', rate: 0.55, fee: 0.02, minAmount: 0.5, maxAmount: 200, isActive: true },
    { fromToken: 'ANA', toToken: 'VLET', rate: 0.6, fee: 0.02, minAmount: 0.5, maxAmount: 200, isActive: true },
    { fromToken: 'SYN', toToken: 'VLET', rate: 0.7, fee: 0.02, minAmount: 0.5, maxAmount: 200, isActive: true },
  ],
  
  // Staking options with yields
  DEFAULT_STAKING_OPTIONS: [
    { tokenType: 'VLET', yieldToken: 'STX', yieldRate: 0.08, lockPeriodDays: 7, minAmount: 5, maxAmount: 100 },
    { tokenType: 'VLET', yieldToken: 'VIZ', yieldRate: 0.07, lockPeriodDays: 7, minAmount: 5, maxAmount: 100 },
    { tokenType: 'VLET', yieldToken: 'STX', yieldRate: 0.15, lockPeriodDays: 30, minAmount: 10, maxAmount: 200 },
    { tokenType: 'VLET', yieldToken: 'VIZ', yieldRate: 0.13, lockPeriodDays: 30, minAmount: 10, maxAmount: 200 },
  ],
  
  // System limits
  DAILY_SWAP_LIMIT: 1000,
  DAILY_SWAP_LIMIT_PER_USER: 50,
  
  // Rate update frequency (in milliseconds)
  RATE_UPDATE_INTERVAL: 3600000, // 1 hour
  
  // Z-Score requirements for swap access
  MIN_ZSCORE_FOR_SWAP: 5,
  
  // Influence factors for rate calculation
  DEMAND_INFLUENCE: 0.3,
  VOLUME_INFLUENCE: 0.2,
  TIME_DECAY_INFLUENCE: 0.1,
};