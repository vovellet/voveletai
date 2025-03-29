import { NextResponse } from 'next/server';
import { PROJECT_STATUS, PROJECT_CATEGORIES } from '@obscuranet/shared';

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
    // const { data } = await httpsCallable(functions, 'getUserProjects')({
    //   userId
    // });
    
    // For demonstration purposes, we'll generate mock project data
    const mockProjects = [
      {
        id: 'project1',
        userId,
        name: 'TrendWave',
        symbol: 'TRND',
        description: 'A decentralized social media platform that rewards users for creating high-quality content with TRND tokens.',
        category: PROJECT_CATEGORIES.SOCIAL,
        goal: 'Create a platform that incentivizes thoughtful content creation rather than engagement farming.',
        tokenSupply: 1000000,
        status: PROJECT_STATUS.DEPLOYED,
        stakeAmount: 10,
        contractAddress: '0x' + '1'.repeat(40),
        txHash: '0x' + '1'.repeat(64),
        network: 'goerli',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
        updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
        deployedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
        evaluation: {
          feasibilityScore: 7.5,
          originalityScore: 8.2,
          clarityScore: 6.9,
          overallScore: 7.5,
          feedback: "## Project Evaluation\n\nThis project demonstrates strong potential in the social media space with an innovative token mechanism. The clarity of the implementation plan could be improved.",
          evaluatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days ago
        }
      },
      {
        id: 'project2',
        userId,
        name: 'DataDAO',
        symbol: 'DATA',
        description: 'A decentralized autonomous organization for collaborative data science projects and dataset curation.',
        category: PROJECT_CATEGORIES.DATA,
        goal: 'Create a DAO that coordinates data scientists and incentivizes them to collaborate on important problems.',
        tokenSupply: 500000,
        status: PROJECT_STATUS.REVIEWING,
        stakeAmount: 10,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        evaluation: {
          feasibilityScore: 6.8,
          originalityScore: 7.5,
          clarityScore: 7.2,
          overallScore: 7.1,
          feedback: "## Project Evaluation\n\nThe DataDAO concept is promising but has implementation challenges. The governance structure needs more detailed specification.",
          evaluatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
        }
      }
    ];
    
    return NextResponse.json({
      success: true,
      userId,
      projects: mockProjects
    });
  } catch (error: any) {
    console.error('Error fetching user projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user projects' },
      { status: 500 }
    );
  }
}