import { NFT_CONSTANTS, NFT_ATTRIBUTES } from '@vovelet/shared';
import { uploadImageToIpfs } from './ipfs';
import { generateNftImage } from './image';

/**
 * Creates NFT metadata for a contribution
 * 
 * @param contribution - The contribution data to create metadata for
 * @param options - Additional options for metadata generation
 * @returns IPFS CID for the metadata
 */
export async function createNFTMetadata(
  contribution: any,
  options: {
    includeImage?: boolean;
    pinMetadata?: boolean;
    customAttributes?: Record<string, any>;
  } = {}
): Promise<string> {
  if (!contribution) {
    throw new Error("Invalid contribution data");
  }
  
  try {
    // Generate contribution ID if it doesn't exist
    const contributionId = contribution.id || `temp-${Date.now()}`;
    
    // Generate NFT image if requested
    let imageUrl = '';
    if (options.includeImage !== false) {
      const imageBuffer = await generateNftImage(contribution);
      imageUrl = await uploadImageToIpfs(imageBuffer);
    }
    
    // Prepare external URL
    const externalUrl = NFT_CONSTANTS.EXTERNAL_URL_FORMAT.replace('{id}', contributionId);
    
    // Prepare attributes
    const attributes = [
      {
        trait_type: NFT_ATTRIBUTES.CATEGORY,
        value: contribution.category || 'UNKNOWN'
      },
      {
        trait_type: NFT_ATTRIBUTES.ZSCORE,
        value: contribution.zScore || 0,
        display_type: 'number'
      },
      {
        trait_type: NFT_ATTRIBUTES.VOVE_SCORE,
        value: contribution.voveScore || 0,
        display_type: 'number'
      },
      {
        trait_type: NFT_ATTRIBUTES.CREATED_AT,
        value: contribution.createdAt ? new Date(contribution.createdAt).toISOString() : new Date().toISOString(),
        display_type: 'date'
      }
    ];
    
    // Add Let rewards as attributes if available
    if (contribution.tokenRewards) {
      attributes.push({
        trait_type: NFT_ATTRIBUTES.LET_REWARDS,
        value: Object.values(contribution.tokenRewards).reduce((a: number, b: number) => a + b, 0),
        display_type: 'number'
      });
    }
    
    // Add custom attributes if provided
    if (options.customAttributes) {
      Object.entries(options.customAttributes).forEach(([key, value]) => {
        attributes.push({
          trait_type: key,
          value
        });
      });
    }
    
    // Create metadata object
    const metadata = {
      name: `VoveletAI Contribution #${contributionId}`,
      description: contribution.text ? 
        `${contribution.text.substring(0, 100)}${contribution.text.length > 100 ? '...' : ''}` : 
        'A contribution to the VoveletAI platform',
      image: imageUrl,
      external_url: externalUrl,
      attributes,
      collection: {
        name: NFT_CONSTANTS.COLLECTION_NAME,
        family: 'VoveletAI'
      }
    };
    
    // In a real implementation, this would upload the metadata to IPFS
    // For this simplified version, we're returning a mock IPFS hash
    const mockIpfsHash = `ipfs://Qm${contributionId.substring(0, 8)}${Date.now().toString(16)}`;
    return mockIpfsHash;
    
  } catch (error) {
    console.error('Error creating NFT metadata:', error);
    throw new Error(`Failed to create NFT metadata: ${(error as Error).message}`);
  }
}