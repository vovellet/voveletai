import { NextResponse } from 'next/server';
import { PROJECT_STATUS, ZORIGIN_CONSTANTS } from '@obscuranet/shared';

export async function POST(request: Request) {
  try {
    const { userId, projectName, projectSymbol, description, category, goal } = await request.json();

    // Validate inputs
    if (!userId || !projectName || !projectSymbol || !description || !category || !goal) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Validate project symbol
    if (!/^[A-Z]{3,5}$/.test(projectSymbol)) {
      return NextResponse.json(
        { error: 'Project symbol must be 3-5 uppercase letters' },
        { status: 400 }
      );
    }

    // In a real implementation, this would call our Firebase function
    // const { data } = await httpsCallable(functions, 'submitProject')({
    //   userId,
    //   projectName,
    //   projectSymbol,
    //   description,
    //   category,
    //   goal
    // });
    
    // For demonstration purposes, we'll simulate a successful submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate a random project ID for demo purposes
    const projectId = 'project-' + Math.random().toString(36).substring(2, 10);
    
    // Create mock evaluation
    const mockEvaluation = {
      feasibilityScore: 7.5,
      originalityScore: 8.2,
      clarityScore: 6.9,
      overallScore: 7.5,
      feedback: `## Project Evaluation for "${projectName}"\n\nYour project shows good potential with strong originality. Consider improving the clarity of your description in future iterations. Overall, this is a solid submission.`,
      evaluatedAt: new Date().toISOString()
    };
    
    // Simulate successful project submission
    return NextResponse.json({
      success: true,
      projectId,
      status: PROJECT_STATUS.REVIEWING,
      message: 'Project submitted successfully and is under review.',
      evaluation: mockEvaluation,
      stakeAmount: ZORIGIN_CONSTANTS.STAKE_AMOUNT,
      tokenType: ZORIGIN_CONSTANTS.STAKE_TOKEN_TYPE
    });
  } catch (error: any) {
    console.error('Error submitting project:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to submit project',
        success: false
      },
      { status: 500 }
    );
  }
}