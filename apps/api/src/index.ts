import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { analyzeContribution, analyzeContributionLegacy } from '@obscuranet/gpt-engine';
import { calculateZScoreFromGpt, generateTokens, generateTokenRewardsWithBoost } from '@obscuranet/zcore';
import { Contribution, ContributionAnalysis, TokenRewards } from '@obscuranet/shared';

// Import rate limiter middleware
import { applyRateLimitToFunction } from './middleware/rateLimiter';

// Import blockchain event listeners
import { startEventListeners } from './listeners/contractEvents';

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Start blockchain event listeners if in production
if (process.env.NODE_ENV === 'production') {
  startEventListeners().catch(error => {
    console.error('Failed to start blockchain event listeners:', error);
  });
}

/**
 * Firebase Function to handle contribution submissions
 * This endpoint analyzes a contribution using GPT,
 * calculates its Z-score, and determines token rewards
 * Protected by rate limiting middleware
 */
export const submitContribution = functions.https.onCall(
  applyRateLimitToFunction(async (data, context) => {
    try {
      // Verify authentication (in a real app)
      // if (!context.auth) {
      //   throw new functions.https.HttpsError(
      //     'unauthenticated',
      //     'User must be authenticated'
      //   );
      // }
      // const userId = context.auth.uid;
      const userId = data.userId || 'test-user-id';
      
      // Validate input
      const { text } = data;
      if (!text || typeof text !== 'string') {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Text contribution is required'
        );
      }
      
      // Analyze the contribution using GPT
      const analysis: ContributionAnalysis = await analyzeContribution(text);
      
      // For backward compatibility
      const gptResponse = await analyzeContributionLegacy(text);
      
      // Calculate Z-score from GPT score
      const zScore = calculateZScoreFromGpt(analysis.gptScore);
      
      // Generate token amount (legacy)
      const tokenAmount = generateTokens(zScore);
      
      // Generate token rewards by category with a boost for the primary category
      const rewards = generateTokenRewardsWithBoost(zScore, analysis.category);
      
      // Create a new contribution document
      const contributionData: Omit<Contribution, 'id'> = {
        userId,
        text,
        gptResponse, // Keep legacy response for backward compatibility
        category: analysis.category,
        gptScore: analysis.gptScore,
        aiComment: analysis.aiComment,
        zScore,
        tokenAmount, // Keep for backward compatibility
        rewards, // New token rewards by category
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Save to Firestore
      const contributionRef = await db.collection('contributions').add(contributionData);
      
      // In a real implementation, we would also trigger a token generation event
      // and update the user's token balance
      
      return {
        success: true,
        contributionId: contributionRef.id,
        analysis: {
          category: analysis.category,
          gptScore: analysis.gptScore,
          aiComment: analysis.aiComment
        },
        zScore,
        tokenAmount,
        rewards, // Include token rewards in the response
      };
    } catch (error) {
      console.error('Error submitting contribution:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to process contribution'
      );
    }
  })
);

/**
 * Get a user's wallet balance (total rewards across all contributions)
 */
export const getWalletBalance = functions.https.onCall(
  async (data, context) => {
    try {
      // In a real app, we would verify authentication and use the auth context
      // if (!context.auth) {
      //   throw new functions.https.HttpsError(
      //     'unauthenticated',
      //     'User must be authenticated'
      //   );
      // }
      // const userId = context.auth.uid;
      const userId = data.userId || 'test-user-id';
      
      // Get all contributions for this user
      const contributionsSnapshot = await db.collection('contributions')
        .where('userId', '==', userId)
        .get();
      
      // Initialize empty wallet balance
      const walletBalance: TokenRewards = {
        STX: 0,
        VIZ: 0,
        LOG: 0,
        CRE: 0,
        ANA: 0,
        SYN: 0,
      };
      
      // Sum up all token rewards from all contributions
      contributionsSnapshot.forEach(doc => {
        const contribution = doc.data() as Contribution;
        
        if (contribution.rewards) {
          // Add each category's rewards to the wallet balance
          Object.keys(contribution.rewards).forEach(category => {
            walletBalance[category] += contribution.rewards[category];
          });
        }
      });
      
      // Format to 2 decimal places for cleaner display
      Object.keys(walletBalance).forEach(category => {
        walletBalance[category] = parseFloat(walletBalance[category].toFixed(2));
      });
      
      // Check if user doc exists and update/create it with the latest balance
      const userDoc = await db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        // Create user document if it doesn't exist
        await db.collection('users').doc(userId).set({
          userId,
          walletBalance,
          contributionsCount: contributionsSnapshot.size,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        // Update existing user document with calculated balance
        await db.collection('users').doc(userId).update({
          walletBalance,
          contributionsCount: contributionsSnapshot.size,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
      
      return {
        success: true,
        userId,
        walletBalance,
        contributionsCount: contributionsSnapshot.size,
      };
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to get wallet balance'
      );
    }
  }
);

// Export blockchain-related functions
export { mintTokens, getOnChainBalance } from './mintTokens';

// Export token spending functions
export { spendTokens, getSpendingHistory } from './spendTokens';

// Export NFT-related functions
export { createNFT, getUserNFTs } from './createNFT';

// Export Z-Origin project functions
export { submitProject, getUserProjects } from './zorigin/submitProject';
export { approveProject, rejectProject } from './zorigin/approveProject';

// Export Z-Borsa functions
export { swapTokens, getSwapHistory } from './zborsa/swapTokens';
export { stakeTokens, getActiveStakes, withdrawStake, processYields } from './zborsa/stakeTokens';

// Export blockchain listeners
export { startBlockchainListeners } from './listeners/contractEvents';
