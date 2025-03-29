import * as admin from 'firebase-admin';
import * as functionsTestModule from 'firebase-functions-test';
import { submitContribution } from '../src/submitContribution';

// Initialize test environment
const functionsTest = require('firebase-functions-test');
const testEnv = functionsTest();

describe('submitContribution Function', () => {
  // Mock user for testing
  const mockUser = { uid: 'test-user-id' };
  
  // Mock context with auth
  const mockContext = {
    auth: mockUser
  };

  // Sample contribution data
  const validContribution = {
    text: 'This is a sample contribution with sufficient length to be analyzed by the Vove Engine.',
    tags: ['test', 'sample']
  };

  // Add firestore mock - will use the global jest.setup.ts mock
  const mockFirestore = admin.firestore();
  const mockCollection = mockFirestore.collection('');
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  test('should process a valid contribution', async () => {
    // Call function with wrapped context
    const wrappedSubmitContribution = testEnv.wrap(submitContribution);
    const result = await wrappedSubmitContribution(validContribution, mockContext);

    // Verify the result structure
    expect(result).toHaveProperty('contributionId');
    expect(result).toHaveProperty('zScore');
    expect(result).toHaveProperty('tokenRewards');
    expect(result).toHaveProperty('voveScore');
    
    // Verify the Z-score is calculated
    expect(result.zScore).toBeGreaterThan(0);
    
    // Verify token rewards are calculated
    expect(Object.keys(result.tokenRewards).length).toBeGreaterThan(0);
    expect(result.tokenRewards).toHaveProperty('STX');
  });

  test('should reject empty contribution', async () => {
    // Prepare invalid data
    const invalidContribution = {
      text: '',
      tags: ['test']
    };

    // Call function with wrapped context
    const wrappedSubmitContribution = testEnv.wrap(submitContribution);
    
    // Expect function to throw an error
    await expect(wrappedSubmitContribution(invalidContribution, mockContext))
      .rejects.toThrow();
  });

  test('should reject unauthenticated requests', async () => {
    // Context without auth
    const noAuthContext = {};
    
    // Call function with wrapped context
    const wrappedSubmitContribution = testEnv.wrap(submitContribution);
    
    // Expect function to throw an auth error
    await expect(wrappedSubmitContribution(validContribution, noAuthContext))
      .rejects.toThrow();
  });
});