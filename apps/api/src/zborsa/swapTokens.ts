import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { 
  getRate, 
  estimateOutput, 
  isValidSwap, 
  recordSwap,
  getUserLevel
} from '@obscuranet/zcore';
import { 
  SwapTransaction, 
  ZBORSA_CONSTANTS
} from '@obscuranet/shared';

// Initialize Firestore if not already initialized
const db = admin.firestore();

/**
 * Swap tokens between different token types
 */
export const swapTokens = functions.https.onCall(
  async (data, context) => {
    try {
      // In a production app, we would verify authentication
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'User must be authenticated'
        );
      }
      
      const userId = context.auth.uid;
      
      // Validate input
      const { fromToken, toToken, amount } = data;
      
      if (!fromToken || !toToken || !amount) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'fromToken, toToken, and amount are required'
        );
      }
      
      if (fromToken === toToken) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Cannot swap a token for itself'
        );
      }
      
      // Check if amount is valid
      if (typeof amount !== 'number' || amount <= 0) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Amount must be a positive number'
        );
      }
      
      // Check if user has sufficient Z-score to use the swap feature
      const userDoc = await db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'User not found'
        );
      }
      
      const userData = userDoc.data();
      
      // If Z-score requirement not met, throw error
      if (userData?.totalZScore < ZBORSA_CONSTANTS.MIN_ZSCORE_FOR_SWAP) {
        throw new functions.https.HttpsError(
          'permission-denied',
          `Z-Score too low. Minimum required: ${ZBORSA_CONSTANTS.MIN_ZSCORE_FOR_SWAP}`
        );
      }
      
      // Check rate and validate swap
      if (!isValidSwap(fromToken, toToken, amount)) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Invalid swap parameters. Check token pair and amount limits.'
        );
      }
      
      // Get settings to check if swaps are enabled
      const settingsDoc = await db.collection('systemSettings').doc('zborsa').get();
      let settings = settingsDoc.exists ? settingsDoc.data() : null;
      
      if (settings && !settings.globalSwapEnabled) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Token swaps are currently disabled by system administrators.'
        );
      }
      
      // Check daily limits
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Check user's daily limit
      const userSwapsToday = await db.collection('swapLogs')
        .where('userId', '==', userId)
        .where('createdAt', '>=', today)
        .get();
      
      if (userSwapsToday.size >= ZBORSA_CONSTANTS.DAILY_SWAP_LIMIT_PER_USER) {
        throw new functions.https.HttpsError(
          'resource-exhausted',
          `You have reached your daily swap limit of ${ZBORSA_CONSTANTS.DAILY_SWAP_LIMIT_PER_USER} swaps.`
        );
      }
      
      // Check global daily limit
      const globalSwapsToday = await db.collection('swapLogs')
        .where('createdAt', '>=', today)
        .get();
      
      if (globalSwapsToday.size >= ZBORSA_CONSTANTS.DAILY_SWAP_LIMIT) {
        throw new functions.https.HttpsError(
          'resource-exhausted',
          'The global daily swap limit has been reached. Please try again tomorrow.'
        );
      }
      
      // Get the user's current balance
      let userBalance = userData.walletBalance || {};
      
      // Check if user has sufficient balance
      if (!userBalance[fromToken] || userBalance[fromToken] < amount) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          `Insufficient ${fromToken} balance`
        );
      }
      
      // Calculate output amount
      const swapResult = estimateOutput(fromToken, toToken, amount);
      
      if (!swapResult) {
        throw new functions.https.HttpsError(
          'internal',
          'Failed to calculate swap output'
        );
      }
      
      const { outputAmount, fee } = swapResult;
      const rate = getRate(fromToken, toToken);
      
      // Create transaction in Firestore
      const swapData: Omit<SwapTransaction, 'id'> = {
        userId,
        fromToken,
        toToken,
        fromAmount: amount,
        toAmount: outputAmount,
        rate: rate || 0,
        fee,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp() as any,
      };
      
      // Execute the swap - use a transaction to ensure consistency
      const batch = db.batch();
      
      // Create swap log entry
      const swapRef = db.collection('swapLogs').doc();
      batch.set(swapRef, swapData);
      
      // Update user's wallet balance
      const userRef = db.collection('users').doc(userId);
      
      // Update the balances
      userBalance[fromToken] = userBalance[fromToken] - amount;
      userBalance[toToken] = (userBalance[toToken] || 0) + outputAmount;
      
      batch.update(userRef, {
        [`walletBalance.${fromToken}`]: admin.firestore.FieldValue.increment(-amount),
        [`walletBalance.${toToken}`]: admin.firestore.FieldValue.increment(outputAmount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Commit the transaction
      await batch.commit();
      
      // Record this swap for rate calculations
      recordSwap(fromToken, toToken, amount);
      
      // Return the swap details
      return {
        success: true,
        swap: {
          id: swapRef.id,
          fromToken,
          toToken,
          fromAmount: amount,
          toAmount: outputAmount,
          rate: rate || 0,
          fee,
        },
        newBalance: userBalance,
      };
      
    } catch (error) {
      console.error('Error executing token swap:', error);
      throw new functions.https.HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to swap tokens'
      );
    }
  }
);

/**
 * Get user's swap history
 */
export const getSwapHistory = functions.https.onCall(
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
      const { limit = 10 } = data || {};
      
      // Get the user's swap history
      const swapsSnapshot = await db.collection('swapLogs')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      
      const swaps = swapsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SwapTransaction[];
      
      return {
        success: true,
        swaps
      };
      
    } catch (error) {
      console.error('Error retrieving swap history:', error);
      throw new functions.https.HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to get swap history'
      );
    }
  }
);