import { jest } from '@jest/globals';

export const createNFTMetadata = jest.fn().mockResolvedValue('ipfs://QmMockIpfsHash');

// Export as default and named exports for flexibility
export default {
  createNFTMetadata
};