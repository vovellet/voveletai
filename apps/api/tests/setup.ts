import * as admin from 'firebase-admin';
import { v4 as uuid } from 'uuid';
import * as functions from 'firebase-functions';

// Initialize admin app if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'obscuranet-test'
  });
}

// Create a custom test error helper
export class TestHttpsError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'HttpsError';
  }
}

// Helper function to create errors that match Firebase HttpsError format
export function createHttpsError(code: string, message: string) {
  return { code, message };
}

// Create firestore mock with complete FieldValue implementation
const firestoreMock = (() => {
  // Create FieldValue implementation
  const FieldValue = {
    serverTimestamp: jest.fn().mockImplementation(() => {
      // Create a Firestore-like timestamp that has toDate()
      const timestamp = new Date();
      // Add toDate() to simulate Firestore timestamp
      timestamp.toDate = function() { return new Date(this); };
      // Add toString() for debugging
      timestamp.toString = function() { return `Timestamp(seconds=${Math.floor(this.getTime()/1000)}, nanoseconds=${(this.getTime() % 1000) * 1000000})`; };
      // Add isEqual for comparison
      timestamp.isEqual = function(other) { return this.getTime() === other.getTime(); };
      return timestamp;
    }),
    increment: jest.fn().mockImplementation((num) => ({
      _increment: true,
      value: num,
      operand: 'increment',
      valueOf: function() { return this.value; }
    })),
    arrayUnion: jest.fn().mockImplementation((...elements) => ({
      _arrayUnion: true,
      elements,
      operand: 'arrayUnion',
      valueOf: function() { return this.elements; }
    })),
    arrayRemove: jest.fn().mockImplementation((...elements) => ({
      _arrayRemove: true,
      elements,
      operand: 'arrayRemove',
      valueOf: function() { return this.elements; }
    }))
  };
  
  // Mock the admin.firestore getter to return our firestore mock
  jest.spyOn(admin, 'firestore').mockImplementation(() => {
    return {
      collection: jest.fn().mockImplementation((collectionPath) => {
        return {
          doc: jest.fn().mockImplementation((docId) => {
            return {
              get: jest.fn().mockResolvedValue({
                exists: mockCollections[collectionPath]?.[docId] ? true : false,
                data: () => mockCollections[collectionPath]?.[docId] || null,
                id: docId,
                ref: {
                  path: `${collectionPath}/${docId}`,
                  id: docId,
                  collection: jest.fn(),
                  update: jest.fn().mockImplementation(async (data) => {
                    if (!mockCollections[collectionPath]) {
                      mockCollections[collectionPath] = {};
                    }
                    mockCollections[collectionPath][docId] = {
                      ...(mockCollections[collectionPath][docId] || {}),
                      ...data
                    };
                    return Promise.resolve();
                  }),
                  set: jest.fn().mockImplementation(async (data, options) => {
                    if (!mockCollections[collectionPath]) {
                      mockCollections[collectionPath] = {};
                    }
                    if (options?.merge) {
                      mockCollections[collectionPath][docId] = {
                        ...(mockCollections[collectionPath][docId] || {}),
                        ...data
                      };
                    } else {
                      mockCollections[collectionPath][docId] = { ...data };
                    }
                    return Promise.resolve();
                  })
                }
              }),
              set: jest.fn().mockImplementation(async (data, options) => {
                if (!mockCollections[collectionPath]) {
                  mockCollections[collectionPath] = {};
                }
                if (options?.merge) {
                  mockCollections[collectionPath][docId] = {
                    ...(mockCollections[collectionPath][docId] || {}),
                    ...data
                  };
                } else {
                  mockCollections[collectionPath][docId] = { ...data };
                }
                return Promise.resolve();
              }),
              update: jest.fn().mockImplementation(async (data) => {
                if (!mockCollections[collectionPath]) {
                  mockCollections[collectionPath] = {};
                }
                
                // Handle FieldValue.increment operations
                const updatedData = { ...(mockCollections[collectionPath][docId] || {}) };
                
                // Process each field in the update
                Object.entries(data).forEach(([key, value]) => {
                  // Check if it's a FieldValue.increment operation
                  if (value && typeof value === 'object' && value._increment) {
                    // Extract the path from the key (handles nested fields like 'walletBalance.STX')
                    const pathParts = key.split('.');
                    
                    if (pathParts.length === 1) {
                      // Simple field
                      updatedData[key] = (updatedData[key] || 0) + value.value;
                    } else if (pathParts.length === 2) {
                      // Nested field (e.g., walletBalance.STX)
                      const [parent, child] = pathParts;
                      if (!updatedData[parent]) updatedData[parent] = {};
                      updatedData[parent][child] = (updatedData[parent][child] || 0) + value.value;
                    }
                  } else {
                    // Regular field update
                    updatedData[key] = value;
                  }
                });
                
                mockCollections[collectionPath][docId] = updatedData;
                return Promise.resolve();
              }),
              delete: jest.fn().mockResolvedValue({}),
              collection: jest.fn()
            };
          }),
          add: jest.fn().mockImplementation(async (data) => {
            const docId = uuid();
            if (!mockCollections[collectionPath]) {
              mockCollections[collectionPath] = {};
            }
            mockCollections[collectionPath][docId] = { ...data, id: docId };
            
            // Create a proper document reference with all the needed methods
            return {
              id: docId,
              path: `${collectionPath}/${docId}`,
              get: jest.fn().mockResolvedValue({
                exists: true,
                data: () => mockCollections[collectionPath][docId],
                id: docId
              }),
              update: jest.fn().mockImplementation(async (updateData) => {
                // Handle FieldValue.increment operations
                const updatedData = { ...mockCollections[collectionPath][docId] };
                
                // Print current data for debugging
                console.log(`Update ${collectionPath}/${docId}:`, updateData);
                console.log('Current data:', updatedData);
                
                // Process each field in the update
                Object.entries(updateData).forEach(([key, value]) => {
                  console.log(`Processing key ${key} with value:`, value);
                  
                  // Check if it's a FieldValue.increment operation
                  if (value && typeof value === 'object' && value._increment) {
                    // Extract the path from the key (handles nested fields like 'walletBalance.STX')
                    const pathParts = key.split('.');
                    
                    if (pathParts.length === 1) {
                      // Simple field
                      updatedData[key] = (updatedData[key] || 0) + value.value;
                    } else if (pathParts.length === 2) {
                      // Nested field (e.g., walletBalance.STX)
                      const [parent, child] = pathParts;
                      console.log(`Nested field: ${parent}.${child} with increment value:`, value.value);
                      if (!updatedData[parent]) updatedData[parent] = {};
                      updatedData[parent][child] = (updatedData[parent][child] || 0) + value.value;
                      console.log(`New value for ${parent}.${child}:`, updatedData[parent][child]);
                    }
                  } else {
                    // Regular field update
                    updatedData[key] = value;
                  }
                });
                
                console.log('Updated data:', updatedData);
                mockCollections[collectionPath][docId] = updatedData;
                return Promise.resolve();
              }),
              set: jest.fn().mockImplementation(async (newData, options) => {
                if (options?.merge) {
                  mockCollections[collectionPath][docId] = {
                    ...mockCollections[collectionPath][docId],
                    ...newData
                  };
                } else {
                  mockCollections[collectionPath][docId] = { ...newData };
                }
                return Promise.resolve();
              }),
              delete: jest.fn().mockResolvedValue({})
            };
          }),
          where: jest.fn().mockImplementation((field, operator, value) => {
            // Create the mock query object first
            let mockQuery: any = {};
            
            // Then define its methods that return itself
            mockQuery = {
              where: jest.fn().mockReturnValue(mockQuery),
              orderBy: jest.fn().mockReturnValue(mockQuery),
              limit: jest.fn().mockReturnValue(mockQuery),
              get: jest.fn().mockImplementation(async () => {
                // Filter the collection based on field/operator/value
                let filteredDocs = Object.entries(mockCollections[collectionPath] || {});
                
                // Apply filtering logic
                if (field && operator && value !== undefined) {
                  if (operator === '==') {
                    filteredDocs = filteredDocs.filter(([id, doc]) => doc[field] === value);
                  } else if (operator === '<') {
                    filteredDocs = filteredDocs.filter(([id, doc]) => doc[field] < value);
                  } else if (operator === '<=') {
                    filteredDocs = filteredDocs.filter(([id, doc]) => doc[field] <= value);
                  } else if (operator === '>') {
                    filteredDocs = filteredDocs.filter(([id, doc]) => doc[field] > value);
                  } else if (operator === '>=') {
                    filteredDocs = filteredDocs.filter(([id, doc]) => doc[field] >= value);
                  } else if (operator === 'in') {
                    filteredDocs = filteredDocs.filter(([id, doc]) => value.includes(doc[field]));
                  }
                }
                
                // Create the query result
                const result = {
                  empty: filteredDocs.length === 0,
                  size: filteredDocs.length,
                  docs: filteredDocs.map(([id, data]) => ({
                    id,
                    data: () => data,
                    exists: true,
                    ref: {
                      id,
                      path: `${collectionPath}/${id}`,
                      update: jest.fn().mockImplementation(async (updateData) => {
                        mockCollections[collectionPath][id] = {
                          ...mockCollections[collectionPath][id],
                          ...updateData
                        };
                        return Promise.resolve();
                      }),
                      set: jest.fn().mockImplementation(async (newData, options) => {
                        if (options?.merge) {
                          mockCollections[collectionPath][id] = {
                            ...mockCollections[collectionPath][id],
                            ...newData
                          };
                        } else {
                          mockCollections[collectionPath][id] = { ...newData };
                        }
                        return Promise.resolve();
                      }),
                      delete: jest.fn().mockResolvedValue({})
                    }
                  })),
                  forEach: function(callback) {
                    this.docs.forEach(callback);
                  }
                };
                
                return result;
              })
            };
            
            return mockQuery;
          }),
          orderBy: jest.fn().mockImplementation((field, direction) => {
            return {
              where: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              get: jest.fn().mockResolvedValue({
                empty: false,
                docs: Object.entries(mockCollections[collectionPath] || {}).map(([id, data]) => ({
                  id,
                  data: () => data,
                  exists: true,
                  ref: {
                    id,
                    path: `${collectionPath}/${id}`,
                    update: jest.fn(),
                    set: jest.fn(),
                    delete: jest.fn()
                  }
                }))
              })
            };
          }),
          limit: jest.fn().mockReturnThis(),
          get: jest.fn().mockResolvedValue({
            empty: Object.keys(mockCollections[collectionPath] || {}).length === 0,
            size: Object.keys(mockCollections[collectionPath] || {}).length,
            docs: Object.entries(mockCollections[collectionPath] || {}).map(([id, data]) => ({
              id,
              data: () => data,
              exists: true,
              ref: {
                id,
                path: `${collectionPath}/${id}`,
                update: jest.fn().mockImplementation(async (updateData) => {
                  mockCollections[collectionPath][id] = {
                    ...mockCollections[collectionPath][id],
                    ...updateData
                  };
                  return Promise.resolve();
                }),
                set: jest.fn().mockImplementation(async (newData, options) => {
                  if (options?.merge) {
                    mockCollections[collectionPath][id] = {
                      ...mockCollections[collectionPath][id],
                      ...newData
                    };
                  } else {
                    mockCollections[collectionPath][id] = { ...newData };
                  }
                  return Promise.resolve();
                }),
                delete: jest.fn().mockResolvedValue({})
              }
            })),
            forEach: function(callback) {
              this.docs.forEach(callback);
            }
          })
        };
      }),
      batch: jest.fn().mockReturnValue({
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        commit: jest.fn().mockResolvedValue({})
      }),
      runTransaction: jest.fn().mockImplementation(async (callback) => {
        return callback({
          get: jest.fn().mockImplementation(async (docRef) => {
            return docRef.get();
          }),
          set: jest.fn().mockImplementation((docRef, data, options) => {
            docRef.set(data, options);
          }),
          update: jest.fn().mockImplementation((docRef, data) => {
            docRef.update(data);
          }),
          delete: jest.fn().mockImplementation((docRef) => {
            docRef.delete();
          })
        });
      }),
      FieldValue
    };
  });
  
  return { FieldValue };
})();

// Make FieldValue available directly
admin.firestore.FieldValue = firestoreMock.FieldValue;

// Create auth mock with complete user management functionality
const authMock = (() => {
  // Store for mock users
  const mockUsers = new Map();
  
  // Mock the admin.auth method to return our auth mock
  jest.spyOn(admin, 'auth').mockImplementation(() => {
    return {
      // Get user by ID
      getUser: jest.fn().mockImplementation(async (uid) => {
        if (mockUsers.has(uid)) {
          return mockUsers.get(uid);
        }
        
        // Create and store a default user if requested one doesn't exist
        const defaultUser = {
          uid,
          email: `${uid}@example.com`,
          emailVerified: true,
          displayName: `Test User ${uid}`,
          disabled: false,
          customClaims: {},
          metadata: {
            creationTime: new Date().toISOString(),
            lastSignInTime: new Date().toISOString()
          }
        };
        
        mockUsers.set(uid, defaultUser);
        return defaultUser;
      }),
      
      // Create a new user
      createUser: jest.fn().mockImplementation(async (userData) => {
        const uid = userData.uid || uuid();
        const user = {
          uid,
          email: userData.email || `${uid}@example.com`,
          emailVerified: userData.emailVerified !== undefined ? userData.emailVerified : true,
          displayName: userData.displayName || `Test User ${uid}`,
          phoneNumber: userData.phoneNumber,
          photoURL: userData.photoURL,
          disabled: userData.disabled || false,
          customClaims: userData.customClaims || {},
          metadata: {
            creationTime: new Date().toISOString(),
            lastSignInTime: new Date().toISOString()
          }
        };
        
        mockUsers.set(uid, user);
        return user;
      }),
      
      // Update an existing user
      updateUser: jest.fn().mockImplementation(async (uid, userData) => {
        if (!mockUsers.has(uid)) {
          throw new Error(`User with ID ${uid} not found`);
        }
        
        const existingUser = mockUsers.get(uid);
        const updatedUser = {
          ...existingUser,
          ...userData,
          uid // Make sure UID isn't overridden
        };
        
        mockUsers.set(uid, updatedUser);
        return updatedUser;
      }),
      
      // Delete a user
      deleteUser: jest.fn().mockImplementation(async (uid) => {
        if (!mockUsers.has(uid)) {
          throw new Error(`User with ID ${uid} not found`);
        }
        
        mockUsers.delete(uid);
        return true;
      }),
      
      // Verify ID token
      verifyIdToken: jest.fn().mockImplementation(async (token) => {
        // For testing, treat token as UID
        const uid = token || 'test-user-id';
        let user;
        
        if (mockUsers.has(uid)) {
          user = mockUsers.get(uid);
        } else {
          // Create a default user
          user = {
            uid,
            email: `${uid}@example.com`,
            email_verified: true,
            name: `Test User ${uid}`,
            customClaims: {}
          };
          mockUsers.set(uid, user);
        }
        
        return {
          uid: user.uid,
          email: user.email,
          email_verified: user.emailVerified,
          name: user.displayName,
          ...user.customClaims
        };
      }),
      
      // Set custom claims
      setCustomUserClaims: jest.fn().mockImplementation(async (uid, claims) => {
        if (!mockUsers.has(uid)) {
          throw new Error(`User with ID ${uid} not found`);
        }
        
        const user = mockUsers.get(uid);
        user.customClaims = claims || {};
        mockUsers.set(uid, user);
        
        return true;
      }),
      
      // Create custom token
      createCustomToken: jest.fn().mockImplementation(async (uid, developerClaims) => {
        return `mock-custom-token-${uid}-${Date.now()}`;
      }),
      
      // List users
      listUsers: jest.fn().mockImplementation(async (maxResults) => {
        const users = Array.from(mockUsers.values());
        return {
          users,
          pageToken: null
        };
      }),
      
      // Get user by email
      getUserByEmail: jest.fn().mockImplementation(async (email) => {
        for (const user of mockUsers.values()) {
          if (user.email === email) {
            return user;
          }
        }
        
        throw new Error(`User with email ${email} not found`);
      })
    };
  });
  
  return {
    // Helper methods for tests
    _getUsers: () => Array.from(mockUsers.values()),
    _reset: () => mockUsers.clear()
  };
})();

// Setup Firebase emulator test environment
const projectConfig = {
  projectId: 'obscuranet-test',
  databaseURL: 'localhost:8080', // Firestore emulator
};

// Create an extended mock for functionsTest with comprehensive wrap implementation
export const functionsTest = {
  // Ensure wrap function returns a callable function that mimics the original
  wrap: (fn: any) => {
    // If function has a handler property (like a Cloud Function)
    if (fn && typeof fn === 'object' && fn.handler) {
      return async function mockedCloudFunction(data: any, context?: any) {
        try {
          // Create default context object with auth property when not provided
          const defaultContext = {
            auth: {
              uid: data.userId || 'test-user-id',
              token: {
                email: `${data.userId || 'test-user-id'}@example.com`,
                email_verified: true
              }
            },
            rawRequest: {}
          };
          
          return await fn.handler(data, context || defaultContext);
        } catch (error) {
          // If the error is a Firebase HttpsError, create a proper Error object
          if (error && typeof error === 'object' && 'code' in error) {
            // Create a proper Error object that will work with Jest's expect().rejects.toThrow()
            const testError = new TestHttpsError(error.code, error.message);
            // Add extra properties from the original error
            Object.assign(testError, error);
            throw testError;
          }
          
          // Otherwise, wrap it in a Firebase HttpsError
          throw new TestHttpsError(
            'internal', 
            error instanceof Error ? error.message : 'Internal error during test'
          );
        }
      };
    }
    
    // Otherwise, return a function that calls the original
    return async function mockedFunction(data: any, context?: any) {
      try {
        // Create default context object with auth property when not provided
        const defaultContext = {
          auth: {
            uid: data.userId || 'test-user-id',
            token: {
              email: `${data.userId || 'test-user-id'}@example.com`,
              email_verified: true
            }
          },
          rawRequest: {}
        };
        
        return await fn(data, context || defaultContext);
      } catch (error) {
        // If the error is a Firebase HttpsError, create a proper Error object
        if (error && typeof error === 'object' && 'code' in error) {
          // Create a proper Error object that will work with Jest's expect().rejects.toThrow()
          const testError = new TestHttpsError(error.code, error.message);
          // Add extra properties from the original error
          Object.assign(testError, error);
          throw testError;
        }
        
        // Otherwise, wrap it in a Firebase HttpsError
        throw new TestHttpsError(
          'internal',
          error instanceof Error ? error.message : 'Internal error during test'
        );
      }
    };
  },
  
  // Enhanced firestore helpers
  firestore: {
    makeDocumentSnapshot: (data: any, path: string) => ({
      data: () => data,
      exists: !!data,
      id: path.split('/').pop(),
      ref: {
        id: path.split('/').pop(),
        path,
        collection: jest.fn().mockImplementation((collPath) => {
          return admin.firestore().collection(`${path}/${collPath}`);
        }),
        parent: {
          id: path.split('/').slice(-2, -1)[0] || '',
          path: path.split('/').slice(0, -1).join('/')
        }
      }
    }),
    makeChange: (before: any, after: any) => ({
      before: {
        data: () => before,
        exists: !!before,
        id: before?.id || 'test-id',
        ref: {
          id: before?.id || 'test-id',
          path: before?.id ? `collection/${before.id}` : 'collection/test-id'
        }
      },
      after: {
        data: () => after,
        exists: !!after,
        id: after?.id || 'test-id',
        ref: {
          id: after?.id || 'test-id',
          path: after?.id ? `collection/${after.id}` : 'collection/test-id'
        }
      }
    })
  },
  
  // Enhanced auth helpers
  auth: {
    makeUserRecord: (uid: string) => {
      // Create a user record that matches the structure expected by tests
      return {
        uid,
        email: `${uid}@example.com`,
        emailVerified: true,
        displayName: `Test User ${uid}`,
        disabled: false,
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString()
        },
        customClaims: {},
        toJSON: () => ({
          uid,
          email: `${uid}@example.com`,
          emailVerified: true,
          displayName: `Test User ${uid}`,
          disabled: false
        })
      };
    }
  }
};

// Export cleanup function to reset mock data between tests
export const cleanup = async () => {
  // Clear all mock collections
  Object.keys(mockCollections).forEach(key => {
    mockCollections[key] = {};
  });
  // Reset any mocks
  jest.clearAllMocks();
};

// Initialize mock Firestore
export const mockCollections: {[key: string]: any} = {};

// Export a reference to the db that uses our enhanced mock
export const db = admin.firestore();

/**
 * Create a test user document with required fields and auth record
 */
export const createTestUser = async (overrides = {}) => {
  const userId = uuid();
  
  // Base user data
  const userData = {
    id: userId,
    email: `test-${userId}@example.com`,
    displayName: `Test User ${userId.substring(0, 6)}`,
    walletAddress: `0x${userId.replace(/-/g, '')}`,
    role: 'user',
    totalZScore: 8.5,
    walletBalance: {
      STX: 100,
      VIZ: 100,
      LOG: 100,
      CRE: 100,
      ANA: 100,
      SYN: 100
    },
    activeProjects: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
  
  // Make sure 'users' collection exists
  if (!mockCollections['users']) {
    mockCollections['users'] = {};
  }
  
  // Save to mock Firestore
  mockCollections['users'][userId] = userData;
  
  // Create auth user record
  await admin.auth().createUser({
    uid: userId,
    email: userData.email,
    displayName: userData.displayName,
    emailVerified: true
  });
  
  if (userData.role === 'admin') {
    // Set admin claim if role is admin
    await admin.auth().setCustomUserClaims(userId, { admin: true });
  }
  
  return { id: userId, ...userData };
};

/**
 * Create a test contribution document
 */
export const createTestContribution = async (userId: string, overrides = {}) => {
  const contributionId = uuid();
  
  const contributionData = {
    id: contributionId,
    userId,
    text: 'This is a test contribution for the ObscuraNet platform. It demonstrates how the system processes and evaluates user-generated content to assign tokens and rewards. This text is over 100 characters to pass minimum content length validation.',
    gptResponse: 'Mock GPT response for testing',
    category: 'TECHNICAL',
    gptScore: 8.5,
    aiComment: 'Great technical contribution with clear explanations.',
    zScore: 8.5,
    tokenAmount: 85,
    rewards: {
      STX: 20,
      VIZ: 10,
      LOG: 25,
      CRE: 10,
      ANA: 15,
      SYN: 5,
      TECHNICAL: 30 // Additional reward for category
    },
    nftMinted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
  
  // Create the collections collection if it doesn't exist
  if (!mockCollections['contributions']) {
    mockCollections['contributions'] = {};
  }
  
  // Store in our mock db
  mockCollections['contributions'][contributionId] = contributionData;
  
  // Also store in a contributions_by_user collection to support lookups
  const userContributionsId = `${userId}_${contributionId}`;
  if (!mockCollections['contributions_by_user']) {
    mockCollections['contributions_by_user'] = {};
  }
  mockCollections['contributions_by_user'][userContributionsId] = {
    userId,
    contributionId,
    createdAt: contributionData.createdAt
  };
  
  // Also save a reference document in the user's subcollection
  const userContribPath = `users/${userId}/contributions`;
  if (!mockCollections[userContribPath]) {
    mockCollections[userContribPath] = {};
  }
  mockCollections[userContribPath][contributionId] = {
    id: contributionId,
    createdAt: contributionData.createdAt,
    category: contributionData.category,
    zScore: contributionData.zScore
  };
  
  return { id: contributionId, ...contributionData };
};

/**
 * Create a test project submission
 */
export const createTestProject = async (userId: string, overrides = {}) => {
  const projectId = uuid();
  
  const projectData = {
    id: projectId,
    userId,
    creatorAddress: `0x${userId.replace(/-/g, '')}`,
    name: 'Test Project',
    symbol: 'TEST',
    description: 'A test project for the ObscuraNet platform with enough text to pass validation requirements. This is a longer description that explains the goals and technical details of the project.',
    category: 'DEFI',
    goal: 'To test the Z-Origin module',
    tokenSupply: 1000000,
    status: 'PENDING',
    stakeAmount: 100,
    evaluation: {
      feasibilityScore: 8,
      originalityScore: 7,
      clarityScore: 9,
      overallScore: 8,
      feedback: 'This is a promising project with good potential.'
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
  
  // Create the projects collection if it doesn't exist
  if (!mockCollections['projects']) {
    mockCollections['projects'] = {};
  }
  
  // Store in our mock db
  mockCollections['projects'][projectId] = projectData;
  
  // Create a project_stakes entry if this is an approved project
  if (projectData.status === 'APPROVED' || projectData.status === 'DEPLOYED') {
    if (!mockCollections['project_stakes']) {
      mockCollections['project_stakes'] = {};
    }
    
    const stakeId = uuid();
    mockCollections['project_stakes'][stakeId] = {
      id: stakeId,
      userId,
      projectId,
      amount: projectData.stakeAmount,
      tokenType: 'STX',
      createdAt: new Date()
    };
  }
  
  // Also create a projects_by_user entry
  const userProjectsId = `${userId}_${projectId}`;
  if (!mockCollections['projects_by_user']) {
    mockCollections['projects_by_user'] = {};
  }
  mockCollections['projects_by_user'][userProjectsId] = {
    userId,
    projectId,
    createdAt: projectData.createdAt
  };
  
  return { id: projectId, ...projectData };
};

/**
 * Create an NFT record for a contribution
 */
export const createTestNFT = async (userId: string, contributionId: string, overrides = {}) => {
  const nftId = uuid();
  
  // Get the contribution data
  const contribution = mockCollections['contributions'][contributionId];
  if (!contribution) {
    throw new Error(`Contribution with ID ${contributionId} not found`);
  }
  
  const nftData = {
    id: nftId,
    userId,
    contributionId,
    tokenId: Math.floor(Math.random() * 1000),
    tokenURI: `ipfs://QmTest${nftId.substring(0, 8)}`,
    contractAddress: '0x1234567890123456789012345678901234567890',
    txHash: `0x${nftId.replace(/-/g, '')}`,
    createdAt: new Date(),
    ...overrides
  };
  
  // Create the NFTs collection if it doesn't exist
  if (!mockCollections['nfts']) {
    mockCollections['nfts'] = {};
  }
  
  // Store in our mock db
  mockCollections['nfts'][nftId] = nftData;
  
  // Update the contribution to mark it as minted
  if (mockCollections['contributions'][contributionId]) {
    mockCollections['contributions'][contributionId].nftMinted = true;
    mockCollections['contributions'][contributionId].nftId = nftId;
  }
  
  return { id: nftId, ...nftData };
};

/**
 * Mock contract for blockchain tests
 */
export const mockContract = () => {
  // Event listeners that have been registered
  const eventListeners = new Map();
  
  // Mock contract object
  const contractMock = {
    // NFT minting
    mint: jest.fn().mockImplementation(async (to, metadataURI) => {
      const txHash = `0x${uuid().replace(/-/g, '')}`;
      const tokenId = Math.floor(Math.random() * 10000);
      
      // Return a transaction response
      return {
        hash: txHash,
        wait: jest.fn().mockResolvedValue({
          status: 1,
          transactionHash: txHash,
          logs: [
            // Mock log that will be parsed as a Transfer event
            {
              topics: [
                '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', // Transfer event signature
                '0x0000000000000000000000000000000000000000000000000000000000000000', // From address (0x0 for minting)
                `0x000000000000000000000000${to.substring(2)}` // To address
              ],
              data: `0x${tokenId.toString(16).padStart(64, '0')}`, // Token ID in hex
              address: '0x1234567890123456789012345678901234567890'
            }
          ]
        })
      };
    }),
    
    // Contract queries
    isContributionMinted: jest.fn().mockResolvedValue(false),
    getTokenIdForContribution: jest.fn().mockResolvedValue(123),
    tokenURI: jest.fn().mockResolvedValue('ipfs://QmTestTokenURI'),
    
    // Connection method
    connect: jest.fn().mockReturnValue(contractMock),
    
    // Event handling
    on: jest.fn().mockImplementation((eventName, listener) => {
      if (!eventListeners.has(eventName)) {
        eventListeners.set(eventName, []);
      }
      
      eventListeners.get(eventName).push(listener);
      
      // Emit a test event after a short delay
      if (eventName === 'Transfer') {
        setTimeout(() => {
          listener(
            '0x0000000000000000000000000000000000000000', // from (0x0 for minting)
            '0x1234567890123456789012345678901234567890', // to
            { _hex: '0x7b', _isBigNumber: true, toNumber: () => 123 } // tokenId as BigNumber
          );
        }, 100);
      }
      
      return {
        removeAllListeners: jest.fn()
      };
    }),
    
    // Allow emitting events for testing
    emit: (eventName, ...args) => {
      if (eventListeners.has(eventName)) {
        for (const listener of eventListeners.get(eventName)) {
          listener(...args);
        }
      }
    },
    
    // Event filtering
    filters: {
      Transfer: jest.fn().mockReturnValue({
        address: '0x1234567890123456789012345678901234567890',
        topics: [
          '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
        ]
      })
    },
    
    // Interface for parsing logs
    interface: {
      parseLog: jest.fn().mockImplementation((log) => {
        // Parse Transfer event
        if (log.topics && log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef') {
          return {
            name: 'Transfer',
            signature: 'Transfer(address,address,uint256)',
            args: {
              from: log.topics[1]?.replace('0x000000000000000000000000', '0x') || '0x0000000000000000000000000000000000000000',
              to: log.topics[2]?.replace('0x000000000000000000000000', '0x') || '0x0000000000000000000000000000000000000000',
              tokenId: parseInt(log.data.replace('0x', ''), 16)
            }
          };
        }
        
        // Default unknown event
        return {
          name: 'Unknown',
          args: {}
        };
      })
    }
  };
  
  return contractMock;
};

/**
 * Mock ethers provider
 */
export const mockEthersProvider = () => {
  // Store for mock transaction data
  const mockTransactions = new Map();
  const mockLogs = [];
  const mockFilters = new Map();
  
  return {
    // Get transaction data
    getTransaction: jest.fn().mockImplementation(async (txHash) => {
      if (mockTransactions.has(txHash)) {
        return mockTransactions.get(txHash);
      }
      
      // Create mock transaction
      const tx = {
        hash: txHash,
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0987654321098765432109876543210987654321',
        data: '0x',
        value: { _hex: '0x0', _isBigNumber: true, toNumber: () => 0 }
      };
      
      mockTransactions.set(txHash, tx);
      return tx;
    }),
    
    // Get transaction receipt
    getTransactionReceipt: jest.fn().mockImplementation(async (txHash) => {
      return {
        status: 1,
        transactionHash: txHash,
        blockNumber: 12345678,
        logs: []
      };
    }),
    
    // Set up event filtering
    on: jest.fn().mockImplementation((eventName, listener) => {
      // Emit a block event after a short delay
      if (eventName === 'block') {
        setTimeout(() => {
          listener(12345678);
        }, 100);
      }
    }),
    
    // Create filter for logs
    getLogs: jest.fn().mockResolvedValue(mockLogs),
    
    // Filter management
    getFilterChanges: jest.fn().mockResolvedValue([]),
    
    // Create a filter
    getFilter: jest.fn().mockImplementation((filter) => {
      const filterId = `0x${Math.random().toString(16).substring(2)}`;
      mockFilters.set(filterId, filter);
      return filterId;
    })
  };
};