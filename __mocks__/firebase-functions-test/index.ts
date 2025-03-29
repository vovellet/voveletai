/**
 * Mock for firebase-functions-test
 */
const mockedFunctionsTest = jest.fn().mockReturnValue({
  wrap: jest.fn((fn) => fn),
  firestore: {
    makeDocumentSnapshot: jest.fn((data, path) => ({
      data: () => data,
      exists: true,
      id: path.split('/').pop(),
    })),
    makeChange: jest.fn((before, after) => ({
      before,
      after,
    })),
  },
  auth: {
    makeUserRecord: jest.fn((uid) => ({
      uid,
      email: 'test@example.com',
      emailVerified: true,
      displayName: 'Test User',
    })),
  },
});

module.exports = mockedFunctionsTest;