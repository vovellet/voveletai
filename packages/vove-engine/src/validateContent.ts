/**
 * Validates content for compliance with platform guidelines
 * 
 * @param content - Text content to validate
 * @returns Validation result with status and reason if invalid
 */
export async function validateContent(content: string): Promise<{
  isValid: boolean;
  reason?: string;
}> {
  if (!content || typeof content !== 'string') {
    return { isValid: false, reason: "Empty content" };
  }
  
  if (content.length < 100) {
    return { isValid: false, reason: "Content too short" };
  }
  
  // Check for prohibited terms
  const prohibitedTerms = ['scam', 'hack', 'cheat', 'illegal', 'phishing'];
  for (const term of prohibitedTerms) {
    if (content.toLowerCase().includes(term)) {
      return { 
        isValid: false, 
        reason: `Content contains prohibited term: ${term}` 
      };
    }
  }
  
  return { isValid: true };
}