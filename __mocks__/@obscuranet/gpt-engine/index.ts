import { jest } from '@jest/globals';

export const analyzeContribution = jest.fn().mockResolvedValue({
  category: 'TECHNICAL',
  gptScore: 8.5,
  aiComment: 'Great technical contribution with clear explanations.'
});

export const analyzeContributionLegacy = jest.fn().mockResolvedValue('Mock legacy GPT response');

export const evaluateProject = jest.fn().mockResolvedValue({
  feasibilityScore: 8,
  originalityScore: 7,
  clarityScore: 9,
  overallScore: 8,
  feedback: 'This is a promising project with good potential.',
  evaluatedAt: new Date()
});

// Export as default and named exports for flexibility
export default {
  analyzeContribution,
  analyzeContributionLegacy,
  evaluateProject
};