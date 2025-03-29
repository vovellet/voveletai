/**
 * Submit Contribution API
 * Handles the submission and analysis of new content contributions
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { analyzeContribution } from '@vovelet/vove-engine';
import { calculateZScoreFromGpt, calculateTokenRewards } from '@vovelet/vcore';

interface ContributionData {
  text: string;
  url?: string;
  tags?: string[];
}

/**
 * Handles submission of a new contribution
 * 
 * @param data - Contribution data from client
 * @param context - Firebase callable context with auth
 * @returns Processed contribution with Z-score and Let rewards
 */
export async function submitContribution(
  data: ContributionData,
  context: functions.https.CallableContext
) {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to submit a contribution'
    );
  }

  const userId = context.auth.uid;
  
  // Validate input
  if (!data || !data.text || data.text.trim().length < 50) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Contribution text must be at least 50 characters'
    );
  }
  
  try {
    // Analyze contribution with Vove Engine
    const analysisResult = await analyzeContribution(data.text);
    
    // Calculate Z-score from Vove analysis
    const zScore = calculateZScoreFromGpt(analysisResult.gptScore);
    
    // Calculate Let rewards based on Z-score and category
    const tokenRewards = calculateTokenRewards(zScore, analysisResult.category as any);
    
    // Prepare contribution document
    const contributionDoc = {
      userId,
      text: data.text,
      url: data.url || null,
      tags: data.tags || [],
      category: analysisResult.category,
      zScore,
      tokenRewards,
      voveScore: analysisResult.gptScore,
      aiComment: analysisResult.aiComment,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Store in Firestore
    const db = admin.firestore();
    const contributionRef = await db.collection('contributions').add(contributionDoc);
    
    // Update user profile with new Z-score and Lets
    const userRef = db.collection('users').doc(userId);
    
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'User document not found'
        );
      }
      
      const userData = userDoc.data() || {};
      
      // Update total Z-score
      const currentZScore = userData.totalZScore || 0;
      const newTotalZScore = currentZScore + zScore;
      
      // Update token balances
      const currentWalletBalance = userData.walletBalance || {};
      const updatedWalletBalance = { ...currentWalletBalance };
      
      Object.entries(tokenRewards).forEach(([tokenType, amount]) => {
        updatedWalletBalance[tokenType] = (updatedWalletBalance[tokenType] || 0) + amount;
      });
      
      // Update user document
      transaction.update(userRef, {
        totalZScore: newTotalZScore,
        walletBalance: updatedWalletBalance,
        lastContributionAt: admin.firestore.FieldValue.serverTimestamp(),
        contributionCount: admin.firestore.FieldValue.increment(1)
      });
    });
    
    // Return success with contribution ID and rewards
    return {
      contributionId: contributionRef.id,
      zScore,
      tokenRewards,
      voveScore: analysisResult.gptScore
    };
    
  } catch (error) {
    console.error('Error processing contribution:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to process contribution. Please try again later.',
      error as any
    );
  }
}