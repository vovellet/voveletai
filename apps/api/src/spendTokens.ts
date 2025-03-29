import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { SERVICE_TYPES, SERVICES, TokenSpendEvent, ServiceType } from '@obscuranet/shared';
import { canAccessService } from '@obscuranet/zcore';

// Initialize Firestore if not already done
let db: admin.firestore.Firestore;
if (!admin.apps.length) {
  admin.initializeApp();
}
db = admin.firestore();

/**
 * Spend tokens on a service
 * This function validates, processes, and records token spending events
 */
export const spendTokens = functions
  .runWith({
    timeoutSeconds: 60,
    memory: '256MB',
  })
  .https.onCall(async (data, context) => {
    try {
      // In a production app, verify the auth context
      // if (!context.auth) {
      //   throw new functions.https.HttpsError(
      //     'unauthenticated',
      //     'User must be authenticated to spend tokens'
      //   );
      // }
      // const userId = context.auth.uid;
      
      // For demo purposes, we'll use the userId from the request
      const { userId, tokenType, amount, serviceType } = data;
      
      // Validate inputs
      if (!userId || !tokenType || !amount || !serviceType) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Missing required parameters: userId, tokenType, amount, or serviceType'
        );
      }
      
      // Check if service type is valid
      if (!Object.values(SERVICE_TYPES).includes(serviceType)) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          `Invalid service type: ${serviceType}`
        );
      }
      
      // Get service details
      const service = SERVICES[serviceType as ServiceType];
      
      // Verify token type and amount match the service requirements
      if (tokenType !== service.tokenType) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          `Service ${service.name} requires ${service.tokenType} tokens, but ${tokenType} was provided`
        );
      }
      
      if (parseFloat(amount) !== service.amount) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          `Service ${service.name} requires ${service.amount} ${service.tokenType} tokens, but ${amount} was provided`
        );
      }
      
      // Get user document
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'User not found'
        );
      }
      
      const userData = userDoc.data();
      if (!userData) {
        throw new functions.https.HttpsError(
          'internal',
          'Failed to fetch user data'
        );
      }
      
      // Check if user has the required Z-score level
      if (!userData.zScoreLevel || !canAccessService(userData.zScoreLevel, serviceType as ServiceType)) {
        throw new functions.https.HttpsError(
          'permission-denied',
          `Your Z-score level (${userData.zScoreLevel || 'basic'}) is not high enough to access this service.`
        );
      }
      
      // Check if user has enough tokens
      if (!userData.walletBalance || !userData.walletBalance[tokenType]) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          `You don't have any ${tokenType} tokens.`
        );
      }
      
      const userBalance = userData.walletBalance[tokenType];
      if (userBalance < parseFloat(amount)) {
        throw new functions.https.HttpsError(
          'resource-exhausted',
          `Insufficient ${tokenType} tokens. You have ${userBalance}, but need ${amount}.`
        );
      }
      
      // Create a token spend event in Firestore
      const spendEvent: Omit<TokenSpendEvent, 'id'> = {
        userId,
        serviceType: serviceType as ServiceType,
        tokenType,
        amount: parseFloat(amount),
        timestamp: new Date(),
        status: 'completed',
        metadata: {
          serviceName: service.name,
          serviceDescription: service.description,
        },
      };
      
      const spendLogRef = await db.collection('spendLogs').add(spendEvent);
      
      // Update user's token balance
      await db.collection('users').doc(userId).update({
        [`walletBalance.${tokenType}`]: admin.firestore.FieldValue.increment(-parseFloat(amount)),
        lastSpendAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      // Get the updated user wallet balance
      const updatedUserDoc = await db.collection('users').doc(userId).get();
      const updatedUserData = updatedUserDoc.data();
      
      return {
        success: true,
        spendLogId: spendLogRef.id,
        serviceType,
        serviceName: service.name,
        tokenType,
        amount: parseFloat(amount),
        timestamp: new Date().toISOString(),
        newBalance: updatedUserData?.walletBalance || {},
        message: `Successfully used ${amount} ${tokenType} tokens for ${service.name}.`,
      };
    } catch (error: any) {
      console.error('Error spending tokens:', error);
      
      throw new functions.https.HttpsError(
        error.code || 'internal',
        error.message || 'Failed to spend tokens'
      );
    }
  });

/**
 * Get a user's spending history
 */
export const getSpendingHistory = functions.https.onCall(
  async (data, context) => {
    try {
      // In a production app, verify the auth context
      // if (!context.auth) {
      //   throw new functions.https.HttpsError(
      //     'unauthenticated',
      //     'User must be authenticated'
      //   );
      // }
      // const userId = context.auth.uid;
      
      // For demo purposes, we'll use the userId from the request
      const { userId } = data;
      
      if (!userId) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'userId is required'
        );
      }
      
      // Get all spending logs for this user
      const spendLogsSnapshot = await db.collection('spendLogs')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .get();
      
      const spendLogs: any[] = [];
      spendLogsSnapshot.forEach(doc => {
        const log = doc.data();
        spendLogs.push({
          id: doc.id,
          ...log,
          timestamp: log.timestamp.toDate().toISOString(),
        });
      });
      
      return {
        success: true,
        userId,
        spendLogs,
      };
    } catch (error: any) {
      console.error('Error getting spending history:', error);
      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Failed to get spending history'
      );
    }
  }
);