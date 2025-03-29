import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firestore if not already done
let db: admin.firestore.Firestore;
if (!admin.apps.length) {
  admin.initializeApp();
}
db = admin.firestore();

/**
 * Rate limiting configuration
 */
const RATE_LIMITS = {
  CONTRIBUTIONS_PER_DAY: 5,
  COOLDOWN_MINUTES: 10,
  MIN_CHARACTERS: 100
};

/**
 * Rate limiter middleware for contribution endpoints
 * This middleware:
 * - Limits users to 5 contributions per day
 * - Enforces a 10-minute cooldown between submissions
 * - Rejects content under 100 characters
 * - Tracks by IP (for unauthenticated) or wallet/user ID (if authenticated)
 */
export const applyRateLimit = async (
  req: functions.https.Request,
  res: any,
  next: (error?: any) => void
): Promise<void> => {
  try {
    const userId = req.body?.userId || (req.context?.auth?.uid);
    const walletAddress = req.body?.walletAddress;
    const contributionText = req.body?.text;
    const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    
    // Check content length
    if (!contributionText || typeof contributionText !== 'string' || contributionText.length < RATE_LIMITS.MIN_CHARACTERS) {
      res.status(400).send({
        error: {
          code: 'invalid-argument',
          message: `Content too short. Minimum ${RATE_LIMITS.MIN_CHARACTERS} characters required.`
        }
      });
      return;
    }
    
    // Determine identifier for rate limiting (prefer userId > walletAddress > IP)
    const identifier = userId || walletAddress || clientIp;
    
    // Create a document reference for this user's rate limiting
    const rateLimitRef = db.collection('rateLimits').doc(identifier);
    
    // Get the current rate limit data (or create if not exists)
    const rateLimitDoc = await rateLimitRef.get();
    
    if (!rateLimitDoc.exists) {
      // First contribution, create rate limit document
      await rateLimitRef.set({
        identifier,
        dailyCount: 1,
        lastContributionTime: admin.firestore.FieldValue.serverTimestamp(),
        dayStartTime: admin.firestore.FieldValue.serverTimestamp(),
        type: userId ? 'user' : (walletAddress ? 'wallet' : 'ip')
      });
      
      // Allow the request to proceed
      next();
      return;
    }
    
    // Get the rate limit data
    const rateLimitData = rateLimitDoc.data();
    
    if (!rateLimitData) {
      // This should not happen, but just in case
      next(new Error('Failed to retrieve rate limit data'));
      return;
    }
    
    const now = new Date();
    const lastContribution = rateLimitData.lastContributionTime?.toDate() || new Date(0);
    const dayStart = rateLimitData.dayStartTime?.toDate() || new Date(0);
    
    // Check if we're in a new day and should reset the counter
    const daysPassed = (now.getTime() - dayStart.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysPassed >= 1) {
      // Reset for new day
      await rateLimitRef.update({
        dailyCount: 1,
        lastContributionTime: admin.firestore.FieldValue.serverTimestamp(),
        dayStartTime: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Allow the request to proceed
      next();
      return;
    }
    
    // Check if the user has already hit daily limit
    if (rateLimitData.dailyCount >= RATE_LIMITS.CONTRIBUTIONS_PER_DAY) {
      res.status(429).send({
        error: {
          code: 'resource-exhausted',
          message: `Daily contribution limit of ${RATE_LIMITS.CONTRIBUTIONS_PER_DAY} reached. Please try again tomorrow.`
        }
      });
      return;
    }
    
    // Check if the cooldown period has passed
    const minutesSinceLastContribution = (now.getTime() - lastContribution.getTime()) / (1000 * 60);
    
    if (minutesSinceLastContribution < RATE_LIMITS.COOLDOWN_MINUTES) {
      const timeLeft = Math.ceil(RATE_LIMITS.COOLDOWN_MINUTES - minutesSinceLastContribution);
      
      res.status(429).send({
        error: {
          code: 'resource-exhausted',
          message: `Please wait ${timeLeft} minute(s) before submitting another contribution.`
        }
      });
      return;
    }
    
    // All checks passed, update rate limit data
    await rateLimitRef.update({
      dailyCount: admin.firestore.FieldValue.increment(1),
      lastContributionTime: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Allow the request to proceed
    next();
  } catch (error) {
    console.error('Rate limiting error:', error);
    next(error);
  }
};

/**
 * Firebase Function compatible version of the rate limiter
 * Usage example:
 * 
 * export const myFunction = functions.https.onCall(
 *   applyRateLimitToFunction(async (data, context) => {
 *     // Function logic here
 *   })
 * );
 */
export const applyRateLimitToFunction = (handler: (data: any, context: functions.https.CallableContext) => Promise<any>) => {
  return async (data: any, context: functions.https.CallableContext): Promise<any> => {
    try {
      const userId = context.auth?.uid || data.userId;
      const walletAddress = data.walletAddress;
      const contributionText = data.text;
      
      // Check content length
      if (!contributionText || typeof contributionText !== 'string' || contributionText.length < RATE_LIMITS.MIN_CHARACTERS) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          `Content too short. Minimum ${RATE_LIMITS.MIN_CHARACTERS} characters required.`
        );
      }
      
      // Determine identifier for rate limiting
      const identifier = userId || walletAddress || 'unknown-user';
      
      // Create a reference for this user's rate limiting
      const rateLimitRef = db.collection('rateLimits').doc(identifier);
      
      // Get current rate limit data
      const rateLimitDoc = await rateLimitRef.get();
      
      if (!rateLimitDoc.exists) {
        // First contribution, create rate limit document
        await rateLimitRef.set({
          identifier,
          dailyCount: 1,
          lastContributionTime: admin.firestore.FieldValue.serverTimestamp(),
          dayStartTime: admin.firestore.FieldValue.serverTimestamp(),
          type: userId ? 'user' : (walletAddress ? 'wallet' : 'unknown')
        });
        
        // Allow the request to proceed
        return handler(data, context);
      }
      
      // Get the rate limit data
      const rateLimitData = rateLimitDoc.data();
      
      if (!rateLimitData) {
        throw new Error('Failed to retrieve rate limit data');
      }
      
      const now = new Date();
      const lastContribution = rateLimitData.lastContributionTime?.toDate() || new Date(0);
      const dayStart = rateLimitData.dayStartTime?.toDate() || new Date(0);
      
      // Check if we're in a new day and should reset the counter
      const daysPassed = (now.getTime() - dayStart.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysPassed >= 1) {
        // Reset for new day
        await rateLimitRef.update({
          dailyCount: 1,
          lastContributionTime: admin.firestore.FieldValue.serverTimestamp(),
          dayStartTime: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Allow the request to proceed
        return handler(data, context);
      }
      
      // Check if the user has already hit daily limit
      if (rateLimitData.dailyCount >= RATE_LIMITS.CONTRIBUTIONS_PER_DAY) {
        throw new functions.https.HttpsError(
          'resource-exhausted',
          `Daily contribution limit of ${RATE_LIMITS.CONTRIBUTIONS_PER_DAY} reached. Please try again tomorrow.`
        );
      }
      
      // Check if the cooldown period has passed
      const minutesSinceLastContribution = (now.getTime() - lastContribution.getTime()) / (1000 * 60);
      
      if (minutesSinceLastContribution < RATE_LIMITS.COOLDOWN_MINUTES) {
        const timeLeft = Math.ceil(RATE_LIMITS.COOLDOWN_MINUTES - minutesSinceLastContribution);
        
        throw new functions.https.HttpsError(
          'resource-exhausted',
          `Please wait ${timeLeft} minute(s) before submitting another contribution.`
        );
      }
      
      // All checks passed, update rate limit data
      await rateLimitRef.update({
        dailyCount: admin.firestore.FieldValue.increment(1),
        lastContributionTime: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Allow the request to proceed
      return handler(data, context);
    } catch (error) {
      console.error('Rate limiting error:', error);
      throw error;
    }
  };
};