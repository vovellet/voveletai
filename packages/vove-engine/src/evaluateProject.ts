import { ProjectEvaluation, ProjectSubmission } from '@vovelet/shared';
import { getOpenAIConfig } from '@vovelet/shared';

/**
 * Uses GPT to evaluate a project submission
 * @param project The project submission to evaluate
 * @returns ProjectEvaluation object with scores and feedback
 */
export async function evaluateProject(project: ProjectSubmission): Promise<ProjectEvaluation> {
  try {
    // In a real implementation, this would call the OpenAI API
    // For this demo, we'll simulate a GPT evaluation
    
    // Simulating GPT analysis delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate deterministic but varied scores based on project properties
    // (In production, this would be replaced with actual API calls)
    const nameLength = project.name.length;
    const descLength = project.description.length;
    const goalLength = project.goal.length;
    
    // Generate pseudo-random but deterministic scores based on properties
    const randomSeed = (nameLength * descLength * goalLength) % 100;
    
    // Calculate scores - higher for longer, more detailed submissions
    const clarityBase = Math.min(descLength / 100, 1) * 8 + 2; // 2-10 range
    const feasibilityBase = Math.min(goalLength / 80, 1) * 7 + 3; // 3-10 range
    const originalityBase = (nameLength % 10) / 2 + 5; // 5-10 range
    
    // Add some "random" variation based on the seed
    const clarityVariation = (randomSeed % 10) / 20; // ±0.5 variation
    const feasibilityVariation = ((randomSeed + 7) % 10) / 20; // ±0.5 variation
    const originalityVariation = ((randomSeed + 13) % 10) / 20; // ±0.5 variation
    
    // Calculate final scores with limits
    const clarityScore = Math.min(Math.max(clarityBase + clarityVariation - 0.25, 1), 10);
    const feasibilityScore = Math.min(Math.max(feasibilityBase + feasibilityVariation - 0.25, 1), 10);
    const originalityScore = Math.min(Math.max(originalityBase + originalityVariation - 0.25, 1), 10);
    
    // Calculate overall score (weighted average)
    const overallScore = (clarityScore * 0.3 + feasibilityScore * 0.4 + originalityScore * 0.3);
    
    // Generate feedback based on scores
    let feedback = `## Project Evaluation for "${project.name}"\n\n`;
    
    // Clarity feedback
    feedback += `### Clarity (${clarityScore.toFixed(1)}/10)\n`;
    if (clarityScore > 8) {
      feedback += "The project description is exceptionally clear and well-articulated. Key concepts are thoroughly explained, making it easy to understand the project's purpose and functionality.\n\n";
    } else if (clarityScore > 6) {
      feedback += "The project description is generally clear, though some concepts could benefit from further elaboration. Overall, the main purpose is communicated effectively.\n\n";
    } else {
      feedback += "The project description would benefit from improved clarity. Consider providing more detailed explanations of core concepts and the project's objectives.\n\n";
    }
    
    // Feasibility feedback
    feedback += `### Feasibility (${feasibilityScore.toFixed(1)}/10)\n`;
    if (feasibilityScore > 8) {
      feedback += "The project appears highly feasible with clear, achievable goals. The implementation path is realistic given the described resources and approach.\n\n";
    } else if (feasibilityScore > 6) {
      feedback += "The project seems generally feasible, though some aspects may face challenges during implementation. Consider addressing potential bottlenecks in advance.\n\n";
    } else {
      feedback += "There are significant feasibility concerns with the current project formulation. The goals may be overly ambitious or the implementation path is unclear.\n\n";
    }
    
    // Originality feedback
    feedback += `### Originality (${originalityScore.toFixed(1)}/10)\n`;
    if (originalityScore > 8) {
      feedback += "The project demonstrates excellent originality with novel concepts and innovative approaches. It addresses problems in ways not commonly seen in existing solutions.\n\n";
    } else if (originalityScore > 6) {
      feedback += "The project shows good originality in some aspects while building on established concepts in others. There are elements of innovation that distinguish it from similar projects.\n\n";
    } else {
      feedback += "The project's originality could be enhanced. Consider exploring more innovative approaches or unique value propositions to differentiate from existing solutions.\n\n";
    }
    
    // Overall assessment
    feedback += `### Overall Assessment (${overallScore.toFixed(1)}/10)\n`;
    if (overallScore > 8) {
      feedback += "This is a strong project proposal with excellent potential. With proper execution, it could become a valuable addition to the Z-Origin ecosystem with meaningful Let rewards.\n\n";
    } else if (overallScore > 6) {
      feedback += "This is a solid project proposal with good potential, though there are areas that could be improved. Consider the feedback above to strengthen the concept further.\n\n";
    } else {
      feedback += "While the project has interesting elements, substantial revisions are recommended before proceeding. Focus on improving the areas highlighted above.\n\n";
    }
    
    feedback += "### Recommendations\n";
    feedback += "1. " + (clarityScore < 7 ? "Enhance the project description with more specific details about implementation." : "Continue developing the clear documentation approach shown in your submission.") + "\n";
    feedback += "2. " + (feasibilityScore < 7 ? "Break down the project into smaller, more manageable milestones." : "Maintain the realistic scope and clear milestones in your development plan.") + "\n";
    feedback += "3. " + (originalityScore < 7 ? "Explore unique features that would differentiate your project in the market." : "Leverage the innovative aspects of your project in your marketing and community building.") + "\n";
    
    // Return evaluation object
    return {
      clarityScore: parseFloat(clarityScore.toFixed(1)),
      feasibilityScore: parseFloat(feasibilityScore.toFixed(1)),
      originalityScore: parseFloat(originalityScore.toFixed(1)),
      overallScore: parseFloat(overallScore.toFixed(1)),
      feedback,
      evaluatedAt: new Date()
    };
  } catch (error) {
    console.error('Error evaluating project:', error);
    throw new Error(`Failed to evaluate project: ${(error as Error).message}`);
  }
}