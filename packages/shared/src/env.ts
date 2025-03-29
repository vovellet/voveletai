// Environment configuration helper
export const getEnv = (key: string, defaultValue?: string): string => {
  const value = typeof process !== 'undefined' ? process.env[key] : undefined;
  
  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is not set`);
  }
  
  return value;
};

export const isProduction = (): boolean => {
  return getEnv('NODE_ENV', 'development') === 'production';
};

// Blockchain configuration
export const getBlockchainConfig = () => {
  return {
    alchemyApiUrl: getEnv('ALCHEMY_API_URL', ''),
    privateKey: getEnv('PRIVATE_KEY', ''),
    vletContractAddress: getEnv('VLET_CONTRACT_ADDRESS', ''),
    nftContractAddress: getEnv('NFT_CONTRACT_ADDRESS', ''),
    networkName: getEnv('BLOCKCHAIN_NETWORK', 'goerli'),
    chainId: parseInt(getEnv('CHAIN_ID', '5')), // Default to Goerli testnet
    blockExplorerUrl: getEnv('BLOCK_EXPLORER_URL', 'https://goerli.etherscan.io'),
  };
};

// OpenAI configuration
export const getOpenAIConfig = () => {
  return {
    apiKey: getEnv('OPENAI_API_KEY', ''),
  };
};

// NFT.storage configuration
export const getNFTStorageConfig = () => {
  return {
    apiKey: getEnv('NFT_STORAGE_API_KEY', ''),
  };
};
