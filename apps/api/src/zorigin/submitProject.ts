import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { 
  ProjectSubmission, 
  PROJECT_STATUS, 
  ZORIGIN_CONSTANTS, 
  TokenSpendEvent, 
  ServiceType,
  ProjectCategory
} from '@obscuranet/shared';
import { evaluateProject } from '@obscuranet/gpt-engine';

// Initialize Firestore if not already done
let db: admin.firestore.Firestore;
if (!admin.apps.length) {
  admin.initializeApp();
}
db = admin.firestore();

/**
 * Firebase Function to handle Z-Origin project submissions
 * This endpoint validates project requirements and processes token staking
 */
export const submitProject = functions
  .runWith({
    timeoutSeconds: 180, // 3 minutes for processing and evaluation
    memory: '256MB',
  })
  .https.onCall(async (data, context) => {
    try {
      // In a production app, verify the auth context
      // if (!context.auth) {
      //   throw new functions.https.HttpsError(
      //     'unauthenticated',
      //     'User must be authenticated to submit a project'
      //   );
      // }
      // const userId = context.auth.uid;
      
      // For demo purposes, we'll use the userId from the request
      const { userId, projectName, projectSymbol, description, category, goal } = data;
      
      // Validate required inputs
      if (!userId || !projectName || !projectSymbol || !description || !category || !goal) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Missing required parameters: userId, projectName, projectSymbol, description, category, or goal'
        );
      }
      
      // Validate project symbol (3-5 uppercase letters)
      if (!/^[A-Z]{3,5}$/.test(projectSymbol)) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Project symbol must be 3-5 uppercase letters'
        );
      }
      
      // Check if project symbol is already taken
      const existingProjectBySymbol = await db.collection('projects')
        .where('symbol', '==', projectSymbol)
        .get();
      
      if (!existingProjectBySymbol.empty) {
        throw new functions.https.HttpsError(
          'already-exists',
          `Project symbol "${projectSymbol}" is already taken. Please choose another symbol.`
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
      
      // Verify user's Z-score meets minimum requirement (bypass this check in test environment)
      if (process.env.NODE_ENV !== 'test') {
        if (!userData.totalZScore || userData.totalZScore < ZORIGIN_CONSTANTS.MIN_ZSCORE_FOR_PROJECT) {
          throw new functions.https.HttpsError(
            'permission-denied',
            `Your Z-score (${userData.totalZScore || 0}) is below the minimum required (${ZORIGIN_CONSTANTS.MIN_ZSCORE_FOR_PROJECT}) to create a Z-Origin project.`
          );
        }
      } else {
        console.log('Bypassing Z-score check in test environment');
      }
      
      // Verify user has not exceeded maximum active projects
      const activeProjectsCount = userData.activeProjects || 0;
      if (activeProjectsCount >= ZORIGIN_CONSTANTS.MAX_ACTIVE_PROJECTS) {
        throw new functions.https.HttpsError(
          'resource-exhausted',
          `You have reached the maximum number of active projects (${ZORIGIN_CONSTANTS.MAX_ACTIVE_PROJECTS}).`
        );
      }
      
      // Verify user has enough tokens for staking (bypass this check in test environment)
      if (process.env.NODE_ENV !== 'test') {
        if (
          !userData.walletBalance || 
          !userData.walletBalance[ZORIGIN_CONSTANTS.STAKE_TOKEN_TYPE] || 
          userData.walletBalance[ZORIGIN_CONSTANTS.STAKE_TOKEN_TYPE] < ZORIGIN_CONSTANTS.STAKE_AMOUNT
        ) {
          throw new functions.https.HttpsError(
            'resource-exhausted',
            `Insufficient ${ZORIGIN_CONSTANTS.STAKE_TOKEN_TYPE} tokens. You need at least ${ZORIGIN_CONSTANTS.STAKE_AMOUNT} tokens to stake for a project.`
          );
        }
      } else {
        console.log('Bypassing token balance check in test environment');
      }
      
      // Process token staking by creating a spend event
      const stakeEvent: Omit<TokenSpendEvent, 'id'> = {
        userId,
        serviceType: 'Z_ORIGIN_BOOST' as ServiceType, // Using Z_ORIGIN_BOOST service type for staking
        tokenType: ZORIGIN_CONSTANTS.STAKE_TOKEN_TYPE,
        amount: ZORIGIN_CONSTANTS.STAKE_AMOUNT,
        timestamp: new Date(),
        status: 'completed',
        metadata: {
          actionType: 'project_stake',
          projectName,
          projectSymbol,
        },
      };
      
      const stakeLogRef = await db.collection('spendLogs').add(stakeEvent);
      
      // Update user's token balance (reduce by stake amount)
      await db.collection('users').doc(userId).update({
        [`walletBalance.${ZORIGIN_CONSTANTS.STAKE_TOKEN_TYPE}`]: admin.firestore.FieldValue.increment(-ZORIGIN_CONSTANTS.STAKE_AMOUNT),
        activeProjects: admin.firestore.FieldValue.increment(1),
        lastStakedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      // Create the project submission
      const projectData: Omit<ProjectSubmission, 'id' | 'evaluation'> = {
        userId,
        name: projectName,
        symbol: projectSymbol,
        description,
        category: category as ProjectCategory,
        goal,
        tokenSupply: ZORIGIN_CONSTANTS.DEFAULT_TOKEN_SUPPLY,
        status: PROJECT_STATUS.PENDING,
        stakeAmount: ZORIGIN_CONSTANTS.STAKE_AMOUNT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Save project to Firestore
      const projectRef = await db.collection('projects').add(projectData);
      
      // Trigger GPT evaluation of the project
      // In production, this might be done as a separate background function
      try {
        const evaluation = await evaluateProject({
          ...projectData,
          id: projectRef.id,
        } as ProjectSubmission);
        
        // Update project with evaluation
        await projectRef.update({
          evaluation,
          status: PROJECT_STATUS.REVIEWING, // Move to reviewing status after evaluation
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        // Return success with evaluation included
        return {
          success: true,
          projectId: projectRef.id,
          stakeLogId: stakeLogRef.id,
          status: PROJECT_STATUS.REVIEWING,
          message: 'Project submitted successfully and is under review.',
          evaluation,
        };
      } catch (evalError) {
        console.error('Error evaluating project:', evalError);
        
        // If evaluation fails, still return success but without evaluation
        return {
          success: true,
          projectId: projectRef.id,
          stakeLogId: stakeLogRef.id,
          status: PROJECT_STATUS.PENDING,
          message: 'Project submitted successfully but automatic evaluation failed. An admin will review it manually.',
        };
      }
    } catch (error: any) {
      console.error('Error submitting project:', error);
      
      throw new functions.https.HttpsError(
        error.code || 'internal',
        error.message || 'Failed to submit project'
      );
    }
  });

/**
 * Get a user's projects
 */
export const getUserProjects = functions.https.onCall(
  async (data, context) => {
    try {
      // For demo purposes, we'll use the userId from the request
      const { userId } = data;
      
      if (!userId) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'userId is required'
        );
      }
      
      // Get all projects for this user
      const projectsSnapshot = await db.collection('projects')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
      
      const projects: any[] = [];
      projectsSnapshot.forEach(doc => {
        const project = doc.data();
        projects.push({
          id: doc.id,
          ...project,
          createdAt: project.createdAt?.toDate?.() || project.createdAt,
          updatedAt: project.updatedAt?.toDate?.() || project.updatedAt,
          deployedAt: project.deployedAt?.toDate?.() || project.deployedAt,
          evaluation: project.evaluation ? {
            ...project.evaluation,
            evaluatedAt: project.evaluation.evaluatedAt?.toDate?.() || project.evaluation.evaluatedAt,
          } : undefined,
        });
      });
      
      return {
        success: true,
        userId,
        projects,
      };
    } catch (error: any) {
      console.error('Error getting user projects:', error);
      throw new functions.https.HttpsError(
        'internal',
        error.message || 'Failed to get user projects'
      );
    }
  }
);