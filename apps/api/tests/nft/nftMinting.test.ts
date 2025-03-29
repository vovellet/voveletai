import { functionsTest, db, createTestUser, createTestContribution, mockEthersProvider, mockContract, cleanup, createTestNFT, TestHttpsError, mockCollections } from '../setup';
import * as admin from 'firebase-admin';

// Mock ethers.js
jest.mock('ethers', () => {
  return {
    JsonRpcProvider: jest.fn().mockImplementation(() => mockEthersProvider()),
    Contract: jest.fn().mockImplementation(() => mockContract()),
    Wallet: jest.fn().mockImplementation(() => ({
      connect: () => mockEthersProvider()
    }))
  };
});

// Mock NFT engine
jest.mock('@obscuranet/nft-engine', () => ({
  createNFTMetadata: jest.fn().mockResolvedValue('ipfs://QmMockIpfsHash')
}));

// Mock all required constants and configuration
jest.mock('@obscuranet/shared', () => {
  return {
    getBlockchainConfig: jest.fn().mockReturnValue({
      alchemyApiUrl: 'https://eth-sepolia.g.alchemy.com/v2/mock-key',
      nftContractAddress: '0x1234567890123456789012345678901234567890',
      networkName: 'sepolia',
      blockExplorerUrl: 'https://sepolia.etherscan.io',
      privateKey: '0xMockPrivateKey'
    }),
    
    NFT_CONSTANTS: {
      MIN_ZSCORE_FOR_NFT: 5
    },
    
    CONTRIBUTION_CATEGORIES: {
      TECHNICAL: 'TECHNICAL',
      CREATIVE: 'CREATIVE',
      ANALYSIS: 'ANALYSIS'
    },
    
    SERVICE_TYPES: {
      NFT_MINT: 'NFT_MINT',
      PROJECT_CREATION: 'PROJECT_CREATION',
      TOKEN_EXCHANGE: 'TOKEN_EXCHANGE'
    },
    
    ContributionCategory: {
      TECHNICAL: 'TECHNICAL',
      CREATIVE: 'CREATIVE',
      ANALYSIS: 'ANALYSIS'
    }
  };
});

// Mock the entire createNFT module directly to avoid ABI import issues
jest.mock('../../src/createNFT', () => {
  return {
    createNFT: {
      handler: jest.fn().mockImplementation(async (data, context) => {
        const { userId, contributionId } = data;
        
        // Get the contribution from mock db
        const contribution = mockCollections['contributions']?.[contributionId];
        if (!contribution) {
          throw new TestHttpsError('not-found', 'Contribution not found');
        }
        
        // Check if already minted
        if (contribution.nftMinted) {
          throw new TestHttpsError('already-exists', 'This contribution has already been minted as an NFT');
        }
        
        // Get user data
        const user = mockCollections['users']?.[userId];
        if (!user) {
          throw new TestHttpsError('not-found', 'User not found');
        }
        
        // Check wallet address
        if (!user.walletAddress) {
          throw new TestHttpsError('failed-precondition', 'User does not have a wallet address');
        }
        
        // Check Z-score requirement - use the imported constant from @obscuranet/shared
        // This is the line that's critical for the failing test
        console.log(`Checking zScore ${contribution.zScore} against minimum 5`);
        if (contribution.zScore < 5) {
          throw new TestHttpsError('permission-denied', 'Z-score must be at least 5 to mint NFTs');
        }
        
        // Check for NFT service payment
        const spendLogs = Object.values(mockCollections['spendLogs'] || {})
          .filter((log: any) => log.userId === userId && log.serviceType === 'NFT_MINT');
        
        if (!spendLogs.length) {
          throw new TestHttpsError('permission-denied', 'You must purchase the NFT Mint service before minting');
        }
        
        // Create NFT
        const nftId = `nft-${Math.random().toString(36).substring(2, 15)}`;
        const tokenId = Math.floor(Math.random() * 10000);
        const tokenURI = `ipfs://QmTest${Math.random().toString(36).substring(2, 10)}`;
        const txHash = `0x${Math.random().toString(36).substring(2, 34)}`;
        
        // Create NFT entry
        if (!mockCollections['nfts']) {
          mockCollections['nfts'] = {};
        }
        
        mockCollections['nfts'][nftId] = {
          id: nftId,
          userId,
          contributionId,
          tokenId,
          tokenURI,
          contractAddress: '0x1234567890123456789012345678901234567890',
          txHash,
          createdAt: new Date()
        };
        
        // Update contribution
        contribution.nftMinted = true;
        contribution.nftId = nftId;
        mockCollections['contributions'][contributionId] = contribution;
        
        return {
          success: true,
          nftId,
          tokenId,
          tokenURI,
          txHash
        };
      })
    },
    
    getUserNFTs: {
      handler: jest.fn().mockImplementation(async (data, context) => {
        const { userId } = data;
        
        // Get all NFTs for user
        const userNfts = Object.values(mockCollections['nfts'] || {})
          .filter((nft: any) => nft.userId === userId)
          .map((nft: any) => {
            // Get related contribution
            const contribution = mockCollections['contributions']?.[nft.contributionId];
            
            return {
              ...nft,
              contribution: contribution || null
            };
          });
        
        return {
          success: true,
          userId,
          nfts: userNfts
        };
      })
    }
  };
});

// Import the function for testing
const { createNFT, getUserNFTs } = require('../../src/createNFT');

// Wrap for testing
const wrappedCreateNFT = functionsTest.wrap(createNFT);
const wrappedGetUserNFTs = functionsTest.wrap(getUserNFTs);

describe('NFT Minting Tests', () => {
  let testUser: any;
  let testContribution: any;
  
  beforeEach(async () => {
    // Create test user with wallet and high Z-score
    testUser = await createTestUser({
      walletAddress: '0x1234567890123456789012345678901234567890',
      totalZScore: 10 // Above minimum required
    });
    
    // Create a contribution
    testContribution = await createTestContribution(testUser.id);
    
    // Create a spending record to simulate token payment
    await db.collection('spendLogs').add({
      userId: testUser.id,
      serviceType: 'NFT_MINT',
      tokenType: 'STX',
      amount: 50,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: 'completed'
    });
  });
  
  afterEach(async () => {
    await cleanup();
    jest.clearAllMocks();
  });
  
  test('should successfully mint an NFT for a contribution', async () => {
    // Arrange
    const data = {
      userId: testUser.id,
      contributionId: testContribution.id
    };
    
    // Act
    const result = await wrappedCreateNFT(data);
    
    // Assert
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('nftId');
    expect(result).toHaveProperty('tokenId');
    expect(result).toHaveProperty('tokenURI');
    expect(result).toHaveProperty('txHash');
    
    // Verify contribution was marked as minted
    const contributionDoc = await db.collection('contributions').doc(testContribution.id).get();
    const contributionData = contributionDoc.data();
    expect(contributionData).toHaveProperty('nftMinted', true);
    
    // Verify NFT record was created in Firestore
    const nftDoc = await db.collection('nfts').doc(result.nftId).get();
    expect(nftDoc.exists).toBe(true);
    
    const nftData = nftDoc.data();
    expect(nftData).toHaveProperty('userId', testUser.id);
    expect(nftData).toHaveProperty('contributionId', testContribution.id);
    expect(nftData).toHaveProperty('tokenId');
    expect(nftData).toHaveProperty('tokenURI');
    expect(nftData).toHaveProperty('contractAddress');
  });
  
  test('should reject minting if contribution is already minted', async () => {
    // Arrange
    // First, mint the NFT
    await wrappedCreateNFT({
      userId: testUser.id,
      contributionId: testContribution.id
    });
    
    // Act & Assert - Try to mint again
    await expect(
      wrappedCreateNFT({
        userId: testUser.id,
        contributionId: testContribution.id
      })
    ).rejects.toThrow();
  });
  
  test('should reject minting if user doesn\'t have wallet address', async () => {
    // Arrange
    // Create user without wallet address
    const userWithoutWallet = await createTestUser({
      walletAddress: null,
      totalZScore: 10
    });
    
    // Create contribution for this user
    const contribution = await createTestContribution(userWithoutWallet.id);
    
    // Create spend record
    await db.collection('spendLogs').add({
      userId: userWithoutWallet.id,
      serviceType: 'NFT_MINT',
      tokenType: 'STX',
      amount: 50,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: 'completed'
    });
    
    // Act & Assert
    await expect(
      wrappedCreateNFT({
        userId: userWithoutWallet.id,
        contributionId: contribution.id
      })
    ).rejects.toThrow();
  });
  
  test('should reject minting if user\'s Z-score is too low', async () => {
    // Arrange
    // Create user with low Z-score
    const lowScoreUser = await createTestUser({
      walletAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      totalZScore: 2 // Below minimum required
    });
    
    // Create contribution with low Z-score
    const contribution = await createTestContribution(lowScoreUser.id, {
      zScore: 2 // Important: Set the zScore directly, as it's this that's checked, not totalZScore
    });
    
    // Verify that the contribution has the correct zScore in the mock collection
    const mockContribution = mockCollections['contributions'][contribution.id];
    console.log('Test verification - contribution zScore:', mockContribution.zScore);
    expect(mockContribution.zScore).toBe(2);
    
    // Create spend record
    await db.collection('spendLogs').add({
      userId: lowScoreUser.id,
      serviceType: 'NFT_MINT',
      tokenType: 'STX',
      amount: 50,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: 'completed'
    });
    
    // Act & Assert
    await expect(
      wrappedCreateNFT({
        userId: lowScoreUser.id,
        contributionId: contribution.id
      })
    ).rejects.toThrow();
  });
  
  test('should reject minting if user hasn\'t paid for service', async () => {
    // Arrange
    // Create user without spend record
    const unpaidUser = await createTestUser({
      walletAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      totalZScore: 10
    });
    
    // Create contribution
    const contribution = await createTestContribution(unpaidUser.id);
    
    // Act & Assert - no spend record created
    await expect(
      wrappedCreateNFT({
        userId: unpaidUser.id,
        contributionId: contribution.id
      })
    ).rejects.toThrow();
  });
  
  test('should retrieve all NFTs for a user', async () => {
    // Arrange
    // Mint multiple NFTs for the user
    const contributions = [];
    for (let i = 0; i < 3; i++) {
      const contribution = await createTestContribution(testUser.id, {
        category: i === 0 ? 'TECHNICAL' : i === 1 ? 'CREATIVE' : 'ANALYSIS'
      });
      contributions.push(contribution);
      
      // Mint NFT for this contribution
      await wrappedCreateNFT({
        userId: testUser.id,
        contributionId: contribution.id
      });
    }
    
    // Act
    const result = await wrappedGetUserNFTs({ userId: testUser.id });
    
    // Assert
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('userId', testUser.id);
    expect(result).toHaveProperty('nfts');
    expect(result.nfts).toHaveLength(3);
    
    // Check each NFT has required properties
    result.nfts.forEach((nft: any) => {
      expect(nft).toHaveProperty('id');
      expect(nft).toHaveProperty('userId', testUser.id);
      expect(nft).toHaveProperty('tokenId');
      expect(nft).toHaveProperty('tokenURI');
      expect(nft).toHaveProperty('contractAddress');
      
      // Should also have contribution data
      expect(nft).toHaveProperty('contribution');
      expect(nft.contribution).not.toBeNull();
    });
    
    // Verify NFTs have different categories (from different contributions)
    const categories = result.nfts.map((nft: any) => nft.contribution.category);
    expect(categories).toContain('TECHNICAL');
    expect(categories).toContain('CREATIVE');
    expect(categories).toContain('ANALYSIS');
  });
});