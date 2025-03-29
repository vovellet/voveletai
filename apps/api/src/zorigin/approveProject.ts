import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { 
  PROJECT_STATUS, 
  ProjectSubmission, 
  ProjectToken,
  getBlockchainConfig 
} from '@obscuranet/shared';
import { ethers } from 'ethers';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

// Initialize Firestore if not already done
let db: admin.firestore.Firestore;
if (!admin.apps.length) {
  admin.initializeApp();
}
db = admin.firestore();

// Admin role UID list (in production, this would be in a secure location)
const ADMIN_UIDS = ['admin-uid-1', 'admin-uid-2'];

/**
 * Simplified ProjectToken ABI for deployment reference
 */
const PROJECT_TOKEN_ABI = [
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function projectId() external view returns (string)"
];

/**
 * Deploys a project token using Hardhat
 * @param project The project submission to deploy a token for
 * @param userWalletAddress The wallet address of the project owner
 * @returns Object with deployment information
 */
async function deployProjectToken(
  project: ProjectSubmission, 
  userWalletAddress: string
): Promise<{
  contractAddress: string;
  txHash: string;
  network: string;
  deploymentInfo: any;
}> {
  try {
    // Get workspace root directory
    const rootDir = path.resolve(__dirname, '../../../../');
    const deployScriptPath = path.join(rootDir, 'blockchain/contracts/scripts/deployProjectToken.ts');
    
    // Total supply in token units (not wei)
    const totalSupply = project.tokenSupply.toString();
    
    // In production, we would use dynamic network configuration
    // For this example, we'll assume deploying to a local hardhat network
    
    // Construct command for deploying via Hardhat
    const command = `cd ${path.join(rootDir, 'blockchain/contracts')} && npx hardhat run ${deployScriptPath} --network localhost -- "${project.name}" "${project.symbol}" "${userWalletAddress}" "${totalSupply}" "${project.id}"`;
    
    console.log(`Executing command: ${command}`);
    
    // Execute the command
    const output = execSync(command).toString();
    console.log('Deployment output:', output);
    
    // Read the deployment info from the output file
    const deploymentInfoPath = path.join(rootDir, `blockchain/contracts/deployed/${project.id}.json`);
    if (!fs.existsSync(deploymentInfoPath)) {
      throw new Error(`Deployment info file not found: ${deploymentInfoPath}`);
    }
    
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentInfoPath, 'utf8'));
    
    return {
      contractAddress: deploymentInfo.address,
      txHash: deploymentInfo.txHash,
      network: deploymentInfo.network,
      deploymentInfo,
    };
  } catch (error) {
    console.error('Error deploying project token:', error);
    throw new Error(`Failed to deploy project token: ${(error as Error).message}`);
  }
}

/**
 * Firebase Function to approve and deploy a Z-Origin project
 * This is an admin-only endpoint that approves a project and deploys its token
 */
export const approveProject = functions
  .runWith({
    timeoutSeconds: 300, // 5 minutes for deployment
    memory: '512MB',
  })
  .https.onCall(async (data, context) => {
    try {
      // Verify admin authentication
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'User must be authenticated to approve projects'
        );
      }
      
      const adminUid = context.auth.uid;
      if (!ADMIN_UIDS.includes(adminUid)) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Only administrators can approve projects'
        );
      }
      
      const { projectId } = data;
      
      if (!projectId) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'projectId is required'
        );
      }
      
      // Get the project
      const projectDoc = await db.collection('projects').doc(projectId).get();
      if (!projectDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Project not found'
        );
      }
      
      const project = projectDoc.data() as ProjectSubmission;
      
      // Check if project is in a state that can be approved
      if (project.status === PROJECT_STATUS.APPROVED || project.status === PROJECT_STATUS.DEPLOYED) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          `Project is already ${project.status}`
        );
      }
      
      if (project.status === PROJECT_STATUS.REJECTED) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Cannot approve a rejected project'
        );
      }
      
      // Get the user's wallet address
      const userDoc = await db.collection('users').doc(project.userId).get();
      if (!userDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'User not found'
        );
      }
      
      const userData = userDoc.data();
      if (!userData || !userData.walletAddress) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'User does not have a wallet address'
        );
      }
      
      // Update project status to approved
      await projectDoc.ref.update({
        status: PROJECT_STATUS.APPROVED,
        approvedBy: adminUid,
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      // Mock deployment for demonstration
      // In a real implementation, we would deploy the contract to a real network
      // For now, we'll simulate the deployment with a mock response
      
      // Get blockchain configuration
      const blockchainConfig = getBlockchainConfig();
      
      // Generate mock contract address and transaction hash
      const mockContractAddress = '0x' + Array.from({ length: 40 }, () => 
        '0123456789abcdef'[Math.floor(Math.random() * 16)]
      ).join('');
      
      const mockTxHash = '0x' + Array.from({ length: 64 }, () => 
        '0123456789abcdef'[Math.floor(Math.random() * 16)]
      ).join('');
      
      // Pretend to deploy (comment out in production)
      /*
      const deploymentResult = await deployProjectToken(
        { ...project, id: projectId },
        userData.walletAddress
      );
      */
      
      // Use mock values for demonstration
      const deploymentResult = {
        contractAddress: mockContractAddress,
        txHash: mockTxHash,
        network: blockchainConfig.networkName,
        deploymentInfo: {
          name: project.name,
          symbol: project.symbol,
          totalSupply: project.tokenSupply.toString(),
          owner: userData.walletAddress,
        },
      };
      
      // Create token record
      const tokenData: ProjectToken = {
        contractAddress: deploymentResult.contractAddress,
        name: project.name,
        symbol: project.symbol,
        ownerAddress: userData.walletAddress,
        totalSupply: project.tokenSupply,
        projectId,
        txHash: deploymentResult.txHash,
        network: deploymentResult.network,
        deployedAt: new Date(),
      };
      
      // Save token record to Firestore
      await db.collection('projectTokens').doc(projectId).set(tokenData);
      
      // Update project with deployment details
      await projectDoc.ref.update({
        status: PROJECT_STATUS.DEPLOYED,
        contractAddress: deploymentResult.contractAddress,
        txHash: deploymentResult.txHash,
        network: deploymentResult.network,
        deployedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      // Return success with deployment details
      return {
        success: true,
        projectId,
        status: PROJECT_STATUS.DEPLOYED,
        contractAddress: deploymentResult.contractAddress,
        txHash: deploymentResult.txHash,
        network: deploymentResult.network,
        blockExplorerUrl: `${blockchainConfig.blockExplorerUrl}/address/${deploymentResult.contractAddress}`,
        message: 'Project has been approved and token deployed successfully.',
      };
    } catch (error: any) {
      console.error('Error approving project:', error);
      
      throw new functions.https.HttpsError(
        error.code || 'internal',
        error.message || 'Failed to approve project'
      );
    }
  });

/**
 * Firebase Function to reject a Z-Origin project
 * This is an admin-only endpoint that rejects a project
 */
export const rejectProject = functions
  .runWith({
    timeoutSeconds: 60,
    memory: '256MB',
  })
  .https.onCall(async (data, context) => {
    try {
      // Verify admin authentication
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'User must be authenticated to reject projects'
        );
      }
      
      const adminUid = context.auth.uid;
      if (!ADMIN_UIDS.includes(adminUid)) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Only administrators can reject projects'
        );
      }
      
      const { projectId, reason } = data;
      
      if (!projectId) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'projectId is required'
        );
      }
      
      // Get the project
      const projectDoc = await db.collection('projects').doc(projectId).get();
      if (!projectDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'Project not found'
        );
      }
      
      const project = projectDoc.data() as ProjectSubmission;
      
      // Check if project is in a state that can be rejected
      if (project.status === PROJECT_STATUS.REJECTED) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Project is already rejected'
        );
      }
      
      if (project.status === PROJECT_STATUS.DEPLOYED) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Cannot reject a deployed project'
        );
      }
      
      // Update project status to rejected
      await projectDoc.ref.update({
        status: PROJECT_STATUS.REJECTED,
        rejectedBy: adminUid,
        rejectionReason: reason || 'No reason provided',
        rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      // Get the user
      const userDoc = await db.collection('users').doc(project.userId).get();
      if (userDoc.exists) {
        // Decrement active projects count
        await userDoc.ref.update({
          activeProjects: admin.firestore.FieldValue.increment(-1),
        });
      }
      
      // Return success
      return {
        success: true,
        projectId,
        status: PROJECT_STATUS.REJECTED,
        message: 'Project has been rejected.',
      };
    } catch (error: any) {
      console.error('Error rejecting project:', error);
      
      throw new functions.https.HttpsError(
        error.code || 'internal',
        error.message || 'Failed to reject project'
      );
    }
  });