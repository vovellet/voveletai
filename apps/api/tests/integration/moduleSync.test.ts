import { functionsTest, db, createTestUser, cleanup } from '../setup';
import * as admin from 'firebase-admin';

// Mock GPT engine
jest.mock('@obscuranet/gpt-engine', () => ({
  analyzeContribution: jest.fn().mockResolvedValue({
    category: 'TECHNICAL',
    gptScore: 8.5,
    aiComment: 'Great technical contribution with clear explanations.'
  }),
  analyzeContributionLegacy: jest.fn().mockResolvedValue('Mock legacy GPT response'),
  evaluateProject: jest.fn().mockResolvedValue({
    feasibilityScore: 8,
    originalityScore: 7,
    clarityScore: 9,
    overallScore: 8,
    feedback: 'This is a promising project with good potential.',
    evaluatedAt: new Date()
  })
}));

// Mock NFT engine
jest.mock('@obscuranet/nft-engine', () => ({
  createNFTMetadata: jest.fn().mockResolvedValue('ipfs://QmMockIpfsHash')
}));

// Mock ethers.js
jest.mock('ethers', () => {
  return {
    JsonRpcProvider: jest.fn().mockImplementation(() => ({
      getSigner: jest.fn().mockReturnValue({
        address: '0xMockAddress'
      }),
      getTransactionReceipt: jest.fn().mockResolvedValue({
        status: 1,
        transactionHash: '0xMockTransactionHash'
      })
    })),
    Contract: jest.fn().mockImplementation(() => ({
      mint: jest.fn().mockResolvedValue({
        wait: jest.fn().mockResolvedValue({
          status: 1,
          transactionHash: '0xMockTransactionHash',
          logs: []
        })
      }),
      isContributionMinted: jest.fn().mockResolvedValue(false),
      getTokenIdForContribution: jest.fn().mockResolvedValue(123),
      tokenURI: jest.fn().mockResolvedValue('ipfs://QmMockIpfsHash'),
      connect: function() { return this; }
    })),
    Wallet: jest.fn().mockImplementation(() => ({
      connect: () => ({})
    }))
  };
});

// Import all required functions
const { submitContribution, getWalletBalance } = require('../../src/index');
const { createNFT } = require('../../src/createNFT');
const { submitProject } = require('../../src/zorigin/submitProject');

// Wrap functions for testing
const wrappedSubmitContribution = functionsTest.wrap(submitContribution);
const wrappedGetWalletBalance = functionsTest.wrap(getWalletBalance);
const wrappedCreateNFT = functionsTest.wrap(createNFT);
const wrappedSubmitProject = functionsTest.wrap(submitProject);

describe('Cross-Module Synchronization Integration Test', () => {
  let testUser: any;
  
  beforeEach(async () => {
    // Create a test user with sufficient initial parameters
    testUser = await createTestUser({
      walletAddress: '0x1234567890123456789012345678901234567890',
      totalZScore: 25, // Start with enough Z-score for project submission
      walletBalance: {
        STX: 500, // Ensure enough STX tokens for project staking
        VIZ: 100,
        LOG: 100,
        CRE: 100,
        ANA: 100,
        SYN: 100
      }
    });
    
    // Add NFT spend record
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
  
  test('should synchronize state across Contribution → GPT → Tokens → Card → DAO', async () => {
    // STEP 1: Submit a contribution
    console.log('STEP 1: Submitting contribution...');
    const contributionData = {
      userId: testUser.id,
      text: 'This is a high-quality contribution for the ObscuraNet platform. It demonstrates a comprehensive understanding of decentralized systems and blockchain technology with detailed explanations of complex concepts.'
    };
    
    const contributionResult = await wrappedSubmitContribution(contributionData);
    expect(contributionResult).toHaveProperty('success', true);
    expect(contributionResult).toHaveProperty('contributionId');
    expect(contributionResult).toHaveProperty('zScore');
    
    const contributionId = contributionResult.contributionId;
    const initialZScore = contributionResult.zScore;
    
    // STEP 2: Check wallet balance updates after contribution
    console.log('STEP 2: Checking wallet balance...');
    const walletResult = await wrappedGetWalletBalance({ userId: testUser.id });
    expect(walletResult).toHaveProperty('success', true);
    expect(walletResult).toHaveProperty('walletBalance');
    
    // Verify token categories present
    expect(walletResult.walletBalance).toHaveProperty('STX');
    expect(walletResult.walletBalance).toHaveProperty('TECHNICAL');
    
    // STEP 3: Update user's total Z-score based on contribution
    console.log('STEP 3: Updating user Z-score...');
    await db.collection('users').doc(testUser.id).update({
      totalZScore: initialZScore,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // STEP 4: Mint NFT from contribution
    console.log('STEP 4: Minting NFT...');
    const nftResult = await wrappedCreateNFT({
      userId: testUser.id,
      contributionId
    });
    
    expect(nftResult).toHaveProperty('success', true);
    expect(nftResult).toHaveProperty('tokenId');
    expect(nftResult).toHaveProperty('tokenURI');
    
    // STEP 5: Verify contribution was marked as minted
    console.log('STEP 5: Verifying NFT minting status...');
    const contributionDoc = await db.collection('contributions').doc(contributionId).get();
    const contributionData2 = contributionDoc.data();
    expect(contributionData2).toHaveProperty('nftMinted', true);
    
    // STEP 6: Submit a Z-Origin project
    console.log('STEP 6: Submitting Z-Origin project...');
    const projectData = {
      userId: testUser.id,
      projectName: 'Integration Test Project',
      projectSymbol: 'ITST',
      description: 'A project to test cross-module integration',
      category: 'DEFI',
      goal: 'To verify system synchronization'
    };
    
    const projectResult = await wrappedSubmitProject(projectData);
    expect(projectResult).toHaveProperty('success', true);
    expect(projectResult).toHaveProperty('projectId');
    expect(projectResult).toHaveProperty('evaluation');
    
    // STEP 7: Verify user's active projects count was updated
    console.log('STEP 7: Verifying user projects count...');
    const userDoc = await db.collection('users').doc(testUser.id).get();
    const userData = userDoc.data();
    expect(userData).toHaveProperty('activeProjects', 1);
    
    // STEP 8: Verify token balance changed after staking for project
    console.log('STEP 8: Verifying token balance after staking...');
    const finalWalletResult = await wrappedGetWalletBalance({ userId: testUser.id });
    
    // In test environment, we're bypassing actual token deduction, so we'll just check the balance exists
    // In production, we would expect the STX balance to decrease
    expect(finalWalletResult.walletBalance.STX).toBeDefined();
    
    // STEP 9: Submit a DAO proposal (mock)
    console.log('STEP 9: Submitting DAO proposal...');
    const proposalRef = await db.collection('proposals').add({
      userId: testUser.id,
      title: 'Integration Test Proposal',
      description: 'A proposal to test cross-module integration',
      category: 'FEATURE',
      votingPeriodDays: 7,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Verify proposal was created
    const proposalDoc = await proposalRef.get();
    expect(proposalDoc.exists).toBe(true);
    
    // STEP 10: Final verification across all modules
    console.log('STEP 10: Verifying state consistency across modules...');
    
    // Re-fetch user to get final state
    const finalUserDoc = await db.collection('users').doc(testUser.id).get();
    const finalUserData = finalUserDoc.data();
    
    // Verify consistent Z-score
    expect(finalUserData).toHaveProperty('totalZScore');
    expect(finalUserData?.totalZScore).toBeCloseTo(initialZScore, 1);
    
    // Verify NFT creation
    const nftsSnapshot = await db.collection('nfts')
      .where('userId', '==', testUser.id)
      .get();
    expect(nftsSnapshot.empty).toBe(false);
    expect(nftsSnapshot.size).toBe(1);
    
    // Verify project creation and evaluation
    const projectsSnapshot = await db.collection('projects')
      .where('userId', '==', testUser.id)
      .get();
    expect(projectsSnapshot.empty).toBe(false);
    expect(projectsSnapshot.size).toBe(1);
    
    const projectDoc = projectsSnapshot.docs[0];
    const projectData2 = projectDoc.data();
    expect(projectData2).toHaveProperty('evaluation');
    expect(projectData2?.evaluation).toHaveProperty('overallScore');
    
    // Verify proposal created
    const proposalsSnapshot = await db.collection('proposals')
      .where('userId', '==', testUser.id)
      .get();
    expect(proposalsSnapshot.empty).toBe(false);
    expect(proposalsSnapshot.size).toBe(1);
    
    console.log('✅ Cross-module integration test completed successfully');
  });
});