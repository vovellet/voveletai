/**
 * Generates a summary of user contributions
 * 
 * @param contributions - Array of user contributions
 * @returns Summary text analyzing the user's contributions
 */
export async function generateContributionSummary(contributions: any[]): Promise<string> {
  if (!Array.isArray(contributions) || contributions.length === 0) {
    throw new Error("No contributions to summarize");
  }
  
  // Count contributions by category
  const categoryCounts: Record<string, number> = {};
  let totalScore = 0;
  
  contributions.forEach(contribution => {
    const category = contribution.category || 'UNKNOWN';
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    totalScore += contribution.zScore || 0;
  });
  
  // Find primary category
  let primaryCategory = 'various categories';
  let maxCount = 0;
  
  Object.entries(categoryCounts).forEach(([category, count]) => {
    if (count > maxCount) {
      maxCount = count;
      primaryCategory = category.toLowerCase();
    }
  });
  
  // Calculate average score
  const averageScore = contributions.length > 0 
    ? (totalScore / contributions.length).toFixed(1) 
    : 'N/A';
  
  return `This user has made ${contributions.length} contributions to the VoveletAI platform, ` +
    `with an average Z-score of ${averageScore}. ` +
    `Their work primarily focuses on ${primaryCategory} with clear explanations and insightful analysis.`;
}