// @obscuranet/gpt-engine mock implementation
// This module handles interactions with GPT API for content analysis

/**
 * Analyzes a contribution and returns category, score, and comments
 * @param contribution The contribution object or text content
 * @returns Analysis result with category, score, and comments
 */
export const analyzeContribution = jest.fn().mockImplementation(async (contribution) => {
  // Handle different input types
  const text = typeof contribution === 'string' 
    ? contribution 
    : (contribution?.text || '');
  
  if (!text || text.length < 10) {
    return Promise.reject(new Error("Content too short for analysis"));
  }
  
  // Determine mock category based on text content
  let category = 'TECHNICAL';
  if (text.toLowerCase().includes('creative') || text.toLowerCase().includes('design')) {
    category = 'CREATIVE';
  } else if (text.toLowerCase().includes('analysis') || text.toLowerCase().includes('research')) {
    category = 'ANALYSIS';
  } else if (text.toLowerCase().includes('synthesis') || text.toLowerCase().includes('integration')) {
    category = 'SYNTHESIS';
  }
  
  // Always return exactly 8.5 as specified in the test
  const gptScore = 8.5;
  
  return Promise.resolve({
    category,
    gptScore,
    aiComment: `This is a high-quality ${category.toLowerCase()} contribution with valuable insights.`,
    timestamp: new Date()
  });
});

/**
 * Legacy analysis function for backward compatibility
 * @param text The text to analyze
 * @returns Raw GPT response string
 */
export const analyzeContributionLegacy = jest.fn().mockImplementation(async (text) => {
  if (!text || typeof text !== 'string' || text.length < 10) {
    return Promise.reject(new Error("Content too short for analysis"));
  }
  
  return Promise.resolve(
    `ANALYSIS RESULTS:\n` +
    `Category: TECHNICAL\n` +
    `Score: 8.5/10\n` +
    `Comments: This contribution demonstrates good understanding of the technical concepts.`
  );
});

/**
 * Evaluates a project submission
 * @param project The project data
 * @returns Evaluation scores and feedback
 */
export const evaluateProject = jest.fn().mockImplementation(async (project) => {
  if (!project || !project.description || typeof project.description !== 'string') {
    return Promise.reject(new Error("Invalid project data for evaluation"));
  }
  
  // Generate scores based on description length
  const baseScore = 6 + Math.min((project.description.length % 100) / 25, 3);
  
  return Promise.resolve({
    feasibilityScore: parseFloat((baseScore - 0.5).toFixed(1)),
    originalityScore: parseFloat((baseScore - 1).toFixed(1)),
    clarityScore: parseFloat((baseScore + 0.5).toFixed(1)),
    overallScore: parseFloat(baseScore.toFixed(1)),
    feedback: "This project shows promise and aligns with platform goals. Consider expanding the technical implementation details.",
    evaluatedAt: new Date()
  });
});

/**
 * Generates a summary of user contributions
 * @param contributions Array of user contributions
 * @returns Summary text
 */
export const generateContributionSummary = jest.fn().mockImplementation(async (contributions) => {
  if (!Array.isArray(contributions) || contributions.length === 0) {
    return Promise.reject(new Error("No contributions to summarize"));
  }
  
  return Promise.resolve(
    `This user has made ${contributions.length} contributions to the platform. ` +
    `Their work primarily focuses on technical aspects with clear explanations and insightful analysis.`
  );
});

/**
 * Validates content for compliance with platform guidelines
 * @param content The content to validate
 * @returns Validation result
 */
export const validateContent = jest.fn().mockImplementation(async (content) => {
  if (!content || typeof content !== 'string') {
    return Promise.resolve({ isValid: false, reason: "Empty content" });
  }
  
  if (content.length < 100) {
    return Promise.resolve({ isValid: false, reason: "Content too short" });
  }
  
  // Check for prohibited terms
  const prohibitedTerms = ['scam', 'hack', 'cheat', 'illegal', 'phishing'];
  for (const term of prohibitedTerms) {
    if (content.toLowerCase().includes(term)) {
      return Promise.resolve({ 
        isValid: false, 
        reason: `Content contains prohibited term: ${term}` 
      });
    }
  }
  
  return Promise.resolve({ isValid: true });
});