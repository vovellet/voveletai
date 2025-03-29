import { GPT_CHARACTERS, CONTRIBUTION_CATEGORIES, getEnv, ContributionAnalysis } from '@obscuranet/shared';
import OpenAI from 'openai';

// Initialize OpenAI client with API key from environment variables
const getOpenAIClient = () => {
  const apiKey = getEnv('OPENAI_API_KEY');
  return new OpenAI({ apiKey });
};

// Analysis system prompt
const ANALYSIS_SYSTEM_PROMPT = `You are an AI analyst for ObscuraNet, a platform that evaluates and categorizes contributions.
Your task is to analyze the user's contribution text and provide:

1. A category from the following options:
   - STX: Strategic Thinking - Long-term, goal-oriented thinking considering broad impacts
   - VIZ: Visualization - Ability to create or interpret visual representations
   - LOG: Logical Reasoning - Step-by-step analytical problem-solving
   - CRE: Creative Thinking - Novel, innovative, or unconventional ideas
   - ANA: Analysis - Breaking down complex topics into components
   - SYN: Synthesis - Combining disparate elements into a cohesive whole

2. A score from 0-10 reflecting the quality of the contribution (10 being exceptional)

3. A brief, constructive comment about the contribution

Return your analysis in JSON format as follows:
{
  "category": "STX", 
  "score": 7.5,
  "comment": "Your analysis here"
}`;

/**
 * Analyze a user contribution using OpenAI's GPT
 * @param contribution - User's text contribution
 * @returns Structured analysis of the contribution
 */
export async function analyzeContribution(contribution: string): Promise<ContributionAnalysis> {
  // In a real implementation, this would call the OpenAI API
  // For now, we'll return a mock response
  
  // Mock implementation for demo purposes
  return new Promise((resolve) => {
    setTimeout(() => {
      // Randomly select a category and generate a score between at least 6 and 9
      const categories = Object.keys(CONTRIBUTION_CATEGORIES);
      const randomCategory = categories[Math.floor(Math.random() * categories.length)] as keyof typeof CONTRIBUTION_CATEGORIES;
      const randomScore = 6 + Math.floor(Math.random() * 3.5);
      
      resolve({
        category: randomCategory,
        gptScore: randomScore,
        aiComment: `This is a well-formed ${randomCategory} contribution that demonstrates good understanding of core concepts. The ideas presented are coherent and have potential for further development.`
      });
    }, 500); // Simulate API delay
  });
  
  // Real implementation would look like this:
  /*
  try {
    const openai = getOpenAIClient();
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
        { role: 'user', content: contribution }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });
    
    const content = response.choices[0]?.message?.content || '{}';
    const parsedResponse = JSON.parse(content);
    
    return {
      category: parsedResponse.category,
      gptScore: parsedResponse.score,
      aiComment: parsedResponse.comment
    };
  } catch (error) {
    console.error('Error analyzing contribution:', error);
    throw new Error('Failed to analyze contribution');
  }
  */
}

/**
 * Legacy analyze function for backward compatibility
 * @deprecated Use the new analyzeContribution function instead
 */
export async function analyzeContributionLegacy(
  contribution: string,
  character: keyof typeof GPT_CHARACTERS = GPT_CHARACTERS.ANALYST
): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      switch (character) {
        case GPT_CHARACTERS.ANALYST:
          resolve(`Analysis: This contribution demonstrates thoughtful considerations about the topic. 
                  It shows a good understanding of the core concepts and provides some novel insights.
                  Quality: 0.8, Uniqueness: 0.7, Relevance: 0.9`);
          break;
        case GPT_CHARACTERS.CURATOR:
          resolve(`Curation: This contribution connects well with existing knowledge in our ecosystem.
                  It would pair nicely with recent discussions on related topics.
                  Recommended connections: Topic A, Topic B, and Topic C.`);
          break;
        case GPT_CHARACTERS.CRITIC:
          resolve(`Critique: While the contribution is valuable, it could be improved by:
                  1. Adding more concrete examples
                  2. Considering alternative perspectives
                  3. Providing more detailed reasoning for key points`);
          break;
        default:
          resolve(`Default response: Thank you for your contribution to ObscuraNet.`);
      }
    }, 500);
  });
}

// Export project evaluation function
export { evaluateProject } from './evaluateProject';
