import { NextResponse } from 'next/server';
import { NFT_CONSTANTS, CONTRIBUTION_CATEGORIES } from '@obscuranet/shared';

export async function GET(request: Request) {
  try {
    // Get the userId from the URL
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // In a real implementation, this would call our Firebase function
    // const { data } = await httpsCallable(functions, 'getUserNFTs')({
    //   userId
    // });
    
    // For demonstration purposes, we'll generate mock NFT data
    const mockNFTs = [
      {
        id: 'nft1',
        userId,
        contributionId: 'contrib1',
        tokenId: '42',
        tokenURI: 'ipfs://bafybeih7hidwfxvgzvxnk2vle7hgkak6a4d3mpfcexihapqga6vlqmj2vy/42',
        contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
        txHash: '0x' + '1'.repeat(64),
        network: 'goerli',
        mintedAt: new Date().toISOString(),
        metadata: {
          name: 'ObscuraNet Contribution #123456',
          description: 'VIZ contribution by user123',
          image: 'ipfs://bafybeibvpuzyoik2dsk4bjukzrstugmox6x6w7rlsxwm2wgmcbxnij3bhy',
          attributes: [
            {
              trait_type: 'Category',
              value: 'VIZ'
            },
            {
              trait_type: 'Z-Score',
              value: 182.5
            }
          ]
        },
        contribution: {
          id: 'contrib1',
          userId,
          text: 'This is a sample contribution with high visualization value.',
          category: CONTRIBUTION_CATEGORIES.VIZ,
          gptScore: 9.2,
          zScore: 182.5,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
          nftMinted: true
        }
      },
      {
        id: 'nft2',
        userId,
        contributionId: 'contrib2',
        tokenId: '43',
        tokenURI: 'ipfs://bafybeih7hidwfxvgzvxnk2vle7hgkak6a4d3mpfcexihapqga6vlqmj2vy/43',
        contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
        txHash: '0x' + '2'.repeat(64),
        network: 'goerli',
        mintedAt: new Date().toISOString(),
        metadata: {
          name: 'ObscuraNet Contribution #789012',
          description: 'STX contribution by user123',
          image: 'ipfs://bafybeibvpuzyoik2dsk4bjukzrstugmox6x6w7rlsxwm2wgmcbxnij3bhy',
          attributes: [
            {
              trait_type: 'Category',
              value: 'STX'
            },
            {
              trait_type: 'Z-Score',
              value: 156.3
            }
          ]
        },
        contribution: {
          id: 'contrib2',
          userId,
          text: 'This is a sample contribution with high strategic thinking value.',
          category: CONTRIBUTION_CATEGORIES.STX,
          gptScore: 8.7,
          zScore: 156.3,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          nftMinted: true
        }
      }
    ];
    
    return NextResponse.json({
      success: true,
      userId,
      nfts: mockNFTs
    });
  } catch (error: any) {
    console.error('Error fetching user NFTs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user NFTs' },
      { status: 500 }
    );
  }
}