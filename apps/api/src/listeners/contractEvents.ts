import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { ethers } from 'ethers';

// Initialize Firestore if not already done
let db: admin.firestore.Firestore;
if (!admin.apps.length) {
  admin.initializeApp();
}
db = admin.firestore();

// Contract ABIs (minimal for events)
const TOKEN_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Minted(address indexed to, uint256 amount)",
  "function name() view returns (string)",
  "function symbol() view returns (string)"
];

const NFT_ABI = [
  "event ContributionMinted(address indexed to, string contributionId, uint256 tokenId)",
  "function tokenURI(uint256 tokenId) view returns (string)"
];

const STAKING_ABI = [
  "event Staked(address indexed user, uint256 amount)",
  "event Withdrawn(address indexed user, uint256 amount)",
  "event YieldClaimed(address indexed user, uint256 amount)"
];

// Environment configuration
interface BlockchainConfig {
  providerUrl: string;
  tokenAddress: string;
  nftAddress: string;
  stakingAddress: string;
  networkName: string;
  startBlock: number;
}

// Get blockchain configuration from environment
const getBlockchainConfig = (): BlockchainConfig => {
  return {
    providerUrl: process.env.BLOCKCHAIN_PROVIDER_URL || 'https://sepolia.infura.io/v3/your-infura-key',
    tokenAddress: process.env.OBX_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000',
    nftAddress: process.env.NFT_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
    stakingAddress: process.env.STAKING_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
    networkName: process.env.BLOCKCHAIN_NETWORK || 'sepolia',
    startBlock: parseInt(process.env.START_BLOCK_NUMBER || '0')
  };
};

/**
 * Creates event listeners for all relevant smart contracts
 * - OBXToken: Listen for Minted and Transfer events
 * - NFT Contract: Listen for ContributionMinted events
 * - Staking Contract: Listen for Staked, Withdrawn, and YieldClaimed events
 */
export const startEventListeners = async (): Promise<void> => {
  try {
    const config = getBlockchainConfig();
    
    // Connect to provider
    const provider = new ethers.JsonRpcProvider(config.providerUrl);
    
    console.log(`Starting blockchain event listeners on ${config.networkName}...`);
    
    // Set up OBX Token contract listener
    if (ethers.isAddress(config.tokenAddress) && config.tokenAddress !== ethers.ZeroAddress) {
      const tokenContract = new ethers.Contract(config.tokenAddress, TOKEN_ABI, provider);
      
      // Get token metadata for logging
      try {
        const tokenName = await tokenContract.name();
        const tokenSymbol = await tokenContract.symbol();
        console.log(`Connected to token contract: ${tokenName} (${tokenSymbol}) at ${config.tokenAddress}`);
      } catch (error) {
        console.warn('Could not fetch token metadata, but continuing with listener setup');
      }
      
      // Listen for Minted events
      tokenContract.on('Minted', async (to, amount, event) => {
        console.log(`Token Minted Event: ${amount} tokens to ${to}`);
        
        // Store event data in Firestore
        await storeContractEvent('token_minted', {
          to,
          amount: amount.toString(),
          txHash: event.log.transactionHash,
          blockNumber: event.log.blockNumber,
          timestamp: new Date(),
          contractAddress: config.tokenAddress
        });
        
        // Update user balance in Firestore
        await updateUserOnChainBalance(to);
      });
      
      // Listen for Transfer events
      tokenContract.on('Transfer', async (from, to, value, event) => {
        console.log(`Token Transfer Event: ${value} tokens from ${from} to ${to}`);
        
        // Skip if from address is zero (minting)
        if (from === ethers.ZeroAddress) {
          return;
        }
        
        // Store event data in Firestore
        await storeContractEvent('token_transfer', {
          from,
          to,
          value: value.toString(),
          txHash: event.log.transactionHash,
          blockNumber: event.log.blockNumber,
          timestamp: new Date(),
          contractAddress: config.tokenAddress
        });
        
        // Update sender and receiver balances
        await updateUserOnChainBalance(from);
        await updateUserOnChainBalance(to);
      });
      
      console.log(`🔄 Token event listeners started for ${config.tokenAddress}`);
    } else {
      console.log('⚠️ Token contract address not configured or invalid');
    }
    
    // Set up NFT contract listener
    if (ethers.isAddress(config.nftAddress) && config.nftAddress !== ethers.ZeroAddress) {
      const nftContract = new ethers.Contract(config.nftAddress, NFT_ABI, provider);
      
      // Listen for ContributionMinted events
      nftContract.on('ContributionMinted', async (to, contributionId, tokenId, event) => {
        console.log(`NFT Minted Event: Token ID ${tokenId} for contribution ${contributionId} to ${to}`);
        
        try {
          // Get token URI
          const tokenURI = await nftContract.tokenURI(tokenId);
          
          // Store event data in Firestore
          await storeContractEvent('nft_minted', {
            to,
            contributionId,
            tokenId: tokenId.toString(),
            tokenURI,
            txHash: event.log.transactionHash,
            blockNumber: event.log.blockNumber,
            timestamp: new Date(),
            contractAddress: config.nftAddress
          });
          
          // Update contribution record in Firestore
          const contributionRef = db.collection('contributions').doc(contributionId);
          await contributionRef.update({
            nftMinted: true,
            nftTokenId: tokenId.toString(),
            nftMintedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        } catch (error) {
          console.error('Error processing NFT minted event:', error);
        }
      });
      
      console.log(`🔄 NFT event listeners started for ${config.nftAddress}`);
    } else {
      console.log('⚠️ NFT contract address not configured or invalid');
    }
    
    // Set up Staking contract listener
    if (ethers.isAddress(config.stakingAddress) && config.stakingAddress !== ethers.ZeroAddress) {
      const stakingContract = new ethers.Contract(config.stakingAddress, STAKING_ABI, provider);
      
      // Listen for Staked events
      stakingContract.on('Staked', async (user, amount, event) => {
        console.log(`Staking Event: ${amount} tokens staked by ${user}`);
        
        // Store event data in Firestore
        await storeContractEvent('token_staked', {
          user,
          amount: amount.toString(),
          txHash: event.log.transactionHash,
          blockNumber: event.log.blockNumber,
          timestamp: new Date(),
          contractAddress: config.stakingAddress
        });
        
        // Update staking records in Firestore
        await updateUserStakingRecords(user);
      });
      
      // Listen for Withdrawn events
      stakingContract.on('Withdrawn', async (user, amount, event) => {
        console.log(`Withdrawal Event: ${amount} tokens withdrawn by ${user}`);
        
        // Store event data in Firestore
        await storeContractEvent('stake_withdrawn', {
          user,
          amount: amount.toString(),
          txHash: event.log.transactionHash,
          blockNumber: event.log.blockNumber,
          timestamp: new Date(),
          contractAddress: config.stakingAddress
        });
        
        // Update staking records in Firestore
        await updateUserStakingRecords(user);
      });
      
      // Listen for YieldClaimed events
      stakingContract.on('YieldClaimed', async (user, amount, event) => {
        console.log(`Yield Claimed Event: ${amount} tokens claimed by ${user}`);
        
        // Store event data in Firestore
        await storeContractEvent('yield_claimed', {
          user,
          amount: amount.toString(),
          txHash: event.log.transactionHash,
          blockNumber: event.log.blockNumber,
          timestamp: new Date(),
          contractAddress: config.stakingAddress
        });
        
        // Update user balance and yield records
        await updateUserOnChainBalance(user);
      });
      
      console.log(`🔄 Staking event listeners started for ${config.stakingAddress}`);
    } else {
      console.log('⚠️ Staking contract address not configured or invalid');
    }
    
    console.log('✅ All blockchain event listeners started successfully');
  } catch (error) {
    console.error('Error starting blockchain event listeners:', error);
    throw error;
  }
};

/**
 * Store contract event data in Firestore
 */
const storeContractEvent = async (eventType: string, eventData: any): Promise<void> => {
  try {
    // Store in events collection
    await db.collection('events').doc(eventData.txHash).set({
      type: eventType,
      ...eventData,
      processedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`Event stored: ${eventType} (${eventData.txHash})`);
  } catch (error) {
    console.error(`Error storing ${eventType} event:`, error);
  }
};

/**
 * Update user's on-chain balance in Firestore
 */
const updateUserOnChainBalance = async (walletAddress: string): Promise<void> => {
  try {
    // Find user with this wallet address
    const usersSnapshot = await db.collection('users')
      .where('walletAddress', '==', walletAddress.toLowerCase())
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      console.log(`No user found with wallet address ${walletAddress}`);
      return;
    }
    
    const userDoc = usersSnapshot.docs[0];
    
    // Implement your balance fetching logic here
    // const balance = await getBalance(walletAddress);
    
    // Update user document with latest on-chain balance
    await userDoc.ref.update({
      lastBalanceUpdate: admin.firestore.FieldValue.serverTimestamp(),
      // onChainBalance: balance
    });
    
    console.log(`Updated on-chain balance for user ${userDoc.id}`);
  } catch (error) {
    console.error(`Error updating on-chain balance for ${walletAddress}:`, error);
  }
};

/**
 * Update user's staking records in Firestore
 */
const updateUserStakingRecords = async (walletAddress: string): Promise<void> => {
  try {
    // Find user with this wallet address
    const usersSnapshot = await db.collection('users')
      .where('walletAddress', '==', walletAddress.toLowerCase())
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      console.log(`No user found with wallet address ${walletAddress}`);
      return;
    }
    
    const userDoc = usersSnapshot.docs[0];
    
    // Get all staking records for this user
    const stakingSnapshot = await db.collection('stakeRecords')
      .where('userId', '==', userDoc.id)
      .where('status', '==', 'active')
      .get();
    
    // Update staking records based on on-chain data
    // This is a placeholder - you would implement your on-chain data fetching logic here
    
    console.log(`Updated staking records for user ${userDoc.id}`);
  } catch (error) {
    console.error(`Error updating staking records for ${walletAddress}:`, error);
  }
};

/**
 * Start the blockchain event listeners as a Firebase function
 */
export const startBlockchainListeners = functions
  .runWith({
    timeoutSeconds: 540, // 9 minutes
    memory: '512MB'
  })
  .pubsub.schedule('every 10 minutes')
  .onRun(async (context) => {
    try {
      await startEventListeners();
      
      // Return after setup since the listeners run asynchronously
      return null;
    } catch (error) {
      console.error('Error in blockchain listener function:', error);
      throw error;
    }
  });

// For direct invocation in initialization code
if (process.env.NODE_ENV === 'production') {
  startEventListeners().catch(error => {
    console.error('Failed to start blockchain listeners during initialization:', error);
  });
}