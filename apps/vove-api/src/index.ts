/**
 * VoveletAI API - Main entry point
 * 
 * This file exports all Firebase Cloud Functions for the VoveletAI API.
 */
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Import function modules
import { createNFT } from './createNFT';
import { mintTokens } from './mintTokens';
import { submitContribution } from './submitContribution';
import { submitProject } from './zorigin/submitProject';
import { approveProject } from './zorigin/approveProject';
import { swapTokens } from './zborsa/swapTokens';
import { stakeTokens } from './zborsa/stakeTokens';

// Contribution and Let functions
export const submitContributionFunction = functions.https.onCall(submitContribution);
export const mintTokensFunction = functions.https.onCall(mintTokens);

// NFT functions
export const createNFTFunction = functions.https.onCall(createNFT);

// Z-Origin project functions
export const submitProjectFunction = functions.https.onCall(submitProject);
export const approveProjectFunction = functions.https.onCall(approveProject);

// Z-Borsa token functions
export const swapTokensFunction = functions.https.onCall(swapTokens);
export const stakeTokensFunction = functions.https.onCall(stakeTokens);

// Additional scheduled functions can be added here
// export const updateTokenRates = functions.pubsub.schedule('every 1 hours').onRun(updateRates);