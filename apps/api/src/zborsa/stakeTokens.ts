import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { 
  StakeRecord, 
  ZBORSA_CONSTANTS,
  Z_SCORE_LEVELS
} from '@obscuranet/shared';

// Initialize Firestore if not already initialized
const db = admin.firestore();

/**
 * Stake tokens to earn yield
 */
export const stakeTokens = functions.https.onCall(
  async (data, context) => {
    try {
      // Verify authentication
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'User must be authenticated'
        );
      }
      
      const userId = context.auth.uid;
      
      // Validate input
      const { tokenType, amount, yieldToken, lockPeriodDays } = data;
      
      if (!tokenType || !amount || !yieldToken || !lockPeriodDays) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'tokenType, amount, yieldToken, and lockPeriodDays are required'
        );
      }
      
      // Check if amount is valid
      if (typeof amount !== 'number' || amount <= 0) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Amount must be a positive number'
        );
      }
      
      // Get settings to check if staking is enabled
      const settingsDoc = await db.collection('systemSettings').doc('zborsa').get();
      let settings = settingsDoc.exists ? settingsDoc.data() : null;
      
      if (settings && !settings.stakingEnabled) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Staking is currently disabled by system administrators.'
        );
      }
      
      // Validate staking option
      const stakingOptions = settings?.stakingOptions || ZBORSA_CONSTANTS.DEFAULT_STAKING_OPTIONS;
      
      const selectedOption = stakingOptions.find(option => 
        option.tokenType === tokenType && 
        option.yieldToken === yieldToken && 
        option.lockPeriodDays === lockPeriodDays
      );
      
      if (!selectedOption) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Invalid staking option. Please select a valid combination of token type, yield token, and lock period.'
        );
      }
      
      // Check amount limits
      if (amount < selectedOption.minAmount || amount > selectedOption.maxAmount) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          `Amount must be between ${selectedOption.minAmount} and ${selectedOption.maxAmount}`
        );
      }
      
      // Get the user's current balance
      const userDoc = await db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'User not found'
        );
      }
      
      const userData = userDoc.data();
      const userBalance = userData?.walletBalance || {};
      
      // Check if user has sufficient balance
      if (!userBalance[tokenType] || userBalance[tokenType] < amount) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          `Insufficient ${tokenType} balance`
        );
      }
      
      // Calculate start and end dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + lockPeriodDays);
      
      // Create stake record
      const stakeData: Omit<StakeRecord, 'id'> = {
        userId,
        tokenType,
        amount,
        yieldToken,
        yieldRate: selectedOption.yieldRate,
        lockPeriodDays,
        startDate,
        endDate,
        totalYieldAccrued: 0,
        lastYieldAt: startDate,
        status: 'active'
      };
      
      // Execute the staking - use a transaction to ensure consistency
      const batch = db.batch();
      
      // Create stake record entry
      const stakeRef = db.collection('stakeRecords').doc();
      batch.set(stakeRef, stakeData);
      
      // Update user's wallet balance
      const userRef = db.collection('users').doc(userId);
      
      batch.update(userRef, {
        [`walletBalance.${tokenType}`]: admin.firestore.FieldValue.increment(-amount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Commit the transaction
      await batch.commit();
      
      // Return the stake details
      return {
        success: true,
        stake: {
          id: stakeRef.id,
          ...stakeData
        }
      };
      
    } catch (error) {
      console.error('Error staking tokens:', error);
      throw new functions.https.HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to stake tokens'
      );
    }
  }
);

/**
 * Get user's active stakes
 */
export const getActiveStakes = functions.https.onCall(
  async (data, context) => {
    try {
      // Verify authentication
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'User must be authenticated'
        );
      }
      
      const userId = context.auth.uid;
      
      // Get the user's active stakes
      const stakesSnapshot = await db.collection('stakeRecords')
        .where('userId', '==', userId)
        .where('status', '==', 'active')
        .get();
      
      const stakes = stakesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StakeRecord[];
      
      // Calculate current yields for active stakes
      const updatedStakes = stakes.map(stake => {
        const now = new Date();
        const lastYieldDate = stake.lastYieldAt instanceof Date ? 
          stake.lastYieldAt : 
          new Date(stake.lastYieldAt);
          
        // Calculate days since last yield update
        const daysSinceLastYield = (now.getTime() - lastYieldDate.getTime()) / (1000 * 60 * 60 * 24);
        
        // Calculate the newly accrued yield
        const newYield = stake.amount * stake.yieldRate * (daysSinceLastYield / 365);
        
        // Return updated stake with projected yield
        return {
          ...stake,
          projectedYield: stake.totalYieldAccrued + newYield
        };
      });
      
      return {
        success: true,
        stakes: updatedStakes
      };
      
    } catch (error) {
      console.error('Error retrieving active stakes:', error);
      throw new functions.https.HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to get active stakes'
      );
    }
  }
);

/**
 * Withdraw from a stake
 */
export const withdrawStake = functions.https.onCall(
  async (data, context) => {
    try {
      // Verify authentication
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'User must be authenticated'
        );
      }
      
      const userId = context.auth.uid;
      
      // Validate input
      const { stakeId } = data;
      
      if (!stakeId) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'stakeId is required'
        );
      }
      
      // Get the stake record
      const stakeDoc = await db.collection('stakeRecords').doc(stakeId).get();
      
      if (!stakeDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Stake record not found'
        );
      }
      
      const stakeData = stakeDoc.data() as StakeRecord;
      
      // Check if the stake belongs to the user
      if (stakeData.userId !== userId) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'You do not have permission to withdraw this stake'
        );
      }
      
      // Check if the stake is active
      if (stakeData.status !== 'active') {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'This stake is not active'
        );
      }
      
      // Check if the lock period has ended
      const now = new Date();
      const endDate = stakeData.endDate instanceof Date ? 
        stakeData.endDate : 
        new Date(stakeData.endDate);
        
      const earlyWithdrawal = now < endDate;
      
      // Calculate accrued yield
      const lastYieldDate = stakeData.lastYieldAt instanceof Date ? 
        stakeData.lastYieldAt : 
        new Date(stakeData.lastYieldAt);
        
      // Calculate days since last yield update
      const daysSinceLastYield = (now.getTime() - lastYieldDate.getTime()) / (1000 * 60 * 60 * 24);
      
      // Calculate the newly accrued yield
      let newYield = stakeData.amount * stakeData.yieldRate * (daysSinceLastYield / 365);
      
      // If early withdrawal, penalize by returning only 50% of accrued yield
      if (earlyWithdrawal) {
        newYield *= 0.5;
      }
      
      const totalYield = stakeData.totalYieldAccrued + newYield;
      
      // Update the stake record and user's balance
      const batch = db.batch();
      
      // Update stake record
      const stakeRef = db.collection('stakeRecords').doc(stakeId);
      batch.update(stakeRef, {
        status: 'withdrawn',
        totalYieldAccrued: totalYield,
        lastYieldAt: now
      });
      
      // Update user's wallet balance
      const userRef = db.collection('users').doc(userId);
      
      // Return staked tokens and yield
      batch.update(userRef, {
        [`walletBalance.${stakeData.tokenType}`]: admin.firestore.FieldValue.increment(stakeData.amount),
        [`walletBalance.${stakeData.yieldToken}`]: admin.firestore.FieldValue.increment(totalYield),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Commit the transaction
      await batch.commit();
      
      return {
        success: true,
        withdrawal: {
          stakeId,
          returnedAmount: stakeData.amount,
          yieldAmount: totalYield,
          earlyWithdrawal
        }
      };
      
    } catch (error) {
      console.error('Error withdrawing stake:', error);
      throw new functions.https.HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to withdraw stake'
      );
    }
  }
);

/**
 * Calculate and credit yield for all active stakes (for admin use or cron job)
 */
export const processYields = functions.https.onCall(
  async (data, context) => {
    try {
      // Verify admin privileges
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'User must be authenticated'
        );
      }
      
      // In a production app, check for admin role
      const userDoc = await db.collection('users').doc(context.auth.uid).get();
      const userData = userDoc.data();
      
      if (!userData || userData.role !== 'admin') {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Only admins can process yields'
        );
      }
      
      // Get all active stakes
      const stakesSnapshot = await db.collection('stakeRecords')
        .where('status', '==', 'active')
        .get();
      
      if (stakesSnapshot.empty) {
        return {
          success: true,
          processedCount: 0,
          message: 'No active stakes to process'
        };
      }
      
      const now = new Date();
      let processedCount = 0;
      const batch = db.batch();
      
      // Process each stake
      for (const stakeDoc of stakesSnapshot.docs) {
        const stakeData = stakeDoc.data() as StakeRecord;
        
        // Check if the stake should be completed
        const endDate = stakeData.endDate instanceof Date ? 
          stakeData.endDate : 
          new Date(stakeData.endDate);
          
        if (now >= endDate) {
          // Stake period is completed, mark as completed but don't withdraw yet
          batch.update(stakeDoc.ref, {
            status: 'completed',
            lastYieldAt: now
          });
          processedCount++;
          continue;
        }
        
        // Calculate yield for active stake
        const lastYieldDate = stakeData.lastYieldAt instanceof Date ? 
          stakeData.lastYieldAt : 
          new Date(stakeData.lastYieldAt);
          
        // Calculate days since last yield update
        const daysSinceLastYield = (now.getTime() - lastYieldDate.getTime()) / (1000 * 60 * 60 * 24);
        
        // Only process if at least 1 day has passed
        if (daysSinceLastYield >= 1) {
          // Calculate the newly accrued yield
          const newYield = stakeData.amount * stakeData.yieldRate * (daysSinceLastYield / 365);
          const totalYield = stakeData.totalYieldAccrued + newYield;
          
          // Update stake record
          batch.update(stakeDoc.ref, {
            totalYieldAccrued: totalYield,
            lastYieldAt: now
          });
          
          processedCount++;
        }
      }
      
      // Commit the batch
      if (processedCount > 0) {
        await batch.commit();
      }
      
      return {
        success: true,
        processedCount,
        message: `Processed yields for ${processedCount} active stakes`
      };
      
    } catch (error) {
      console.error('Error processing yields:', error);
      throw new functions.https.HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to process yields'
      );
    }
  }
);