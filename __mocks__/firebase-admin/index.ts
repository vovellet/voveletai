/**
 * Advanced mock for firebase-admin
 */

// Create apps array with length property that won't cause issues
const appsMock = [];
// Add a fake app as first element so apps.length check won't fail
appsMock.push({
  name: '[DEFAULT]',
  options: {},
  firestore: jest.fn(),
  auth: jest.fn()
});

// Create a sophisticated mock for firebase-admin
const firebaseAdminMock = {
  // Mock for initializeApp - returns the app object
  initializeApp: jest.fn().mockImplementation((options) => {
    // If already initialized, return the existing app
    if (appsMock.length > 0) {
      return appsMock[0];
    }
    
    // Create a new app object
    const newApp = {
      name: options?.name || '[DEFAULT]',
      options: options || {},
      firestore: jest.fn().mockReturnValue(firebaseAdminMock.firestore()),
      auth: jest.fn().mockReturnValue(firebaseAdminMock.auth())
    };
    
    // Add to the apps array
    appsMock.push(newApp);
    return newApp;
  }),
  
  // Apps array - needs to have length property and elements
  apps: appsMock,
  // Advanced Firestore mock with in-memory storage
  firestore: jest.fn().mockImplementation(() => {
    // In-memory storage for mock Firestore data
    const mockFirestoreData = {
      collections: {}
    };
    
    // Create a query builder that maintains chainability
    const createQueryBuilder = (collectionPath, constraints = []) => {
      return {
        where: (field, operator, value) => {
          return createQueryBuilder(collectionPath, [...constraints, { field, operator, value }]);
        },
        orderBy: (field, direction = 'asc') => {
          return createQueryBuilder(collectionPath, [...constraints, { orderBy: { field, direction } }]);
        },
        limit: (value) => {
          return createQueryBuilder(collectionPath, [...constraints, { limit: value }]);
        },
        get: jest.fn().mockImplementation(async () => {
          if (!mockFirestoreData.collections[collectionPath]) {
            return {
              empty: true,
              docs: [],
              size: 0,
              forEach: jest.fn()
            };
          }
          
          // Apply all constraints (very simplified)
          let docs = Object.entries(mockFirestoreData.collections[collectionPath] || {})
            .map(([id, data]) => {
              return {
                id,
                data: () => ({ ...data }),
                exists: true,
                ref: {
                  id,
                  path: `${collectionPath}/${id}`,
                  parent: { path: collectionPath },
                  collection: jest.fn().mockImplementation((subCollectionPath) => 
                    createCollection(`${collectionPath}/${id}/${subCollectionPath}`)
                  ),
                  update: jest.fn().mockImplementation(async (updateData) => {
                    mockFirestoreData.collections[collectionPath][id] = {
                      ...mockFirestoreData.collections[collectionPath][id],
                      ...updateData
                    };
                    return Promise.resolve();
                  }),
                  set: jest.fn().mockImplementation(async (newData, options) => {
                    if (options?.merge) {
                      mockFirestoreData.collections[collectionPath][id] = {
                        ...mockFirestoreData.collections[collectionPath][id],
                        ...newData
                      };
                    } else {
                      mockFirestoreData.collections[collectionPath][id] = { ...newData };
                    }
                    return Promise.resolve();
                  }),
                  delete: jest.fn().mockImplementation(async () => {
                    delete mockFirestoreData.collections[collectionPath][id];
                    return Promise.resolve();
                  })
                }
              };
            });
          
          // Apply where clauses (simplified)
          constraints.forEach(constraint => {
            if (constraint.field && constraint.operator) {
              docs = docs.filter(doc => {
                const docData = doc.data();
                if (constraint.operator === '==') {
                  return docData[constraint.field] === constraint.value;
                }
                return true; // Ignore other operators for simplicity
              });
            }
          });
          
          return {
            empty: docs.length === 0,
            docs,
            size: docs.length,
            forEach: jest.fn().mockImplementation((callback) => {
              docs.forEach(callback);
            })
          };
        })
      };
    };
    
    // Create a collection reference
    const createCollection = (collectionPath) => {
      // Ensure the collection exists in our mock
      if (!mockFirestoreData.collections[collectionPath]) {
        mockFirestoreData.collections[collectionPath] = {};
      }
      
      return {
        id: collectionPath.split('/').pop(),
        path: collectionPath,
        
        // Document reference
        doc: jest.fn().mockImplementation((docId) => {
          const docPath = `${collectionPath}/${docId}`;
          
          return {
            id: docId,
            path: docPath,
            parent: { path: collectionPath },
            
            // Get document
            get: jest.fn().mockImplementation(async () => {
              const docData = mockFirestoreData.collections[collectionPath]?.[docId];
              const exists = !!docData;
              
              return {
                id: docId,
                exists,
                data: () => exists ? { ...docData } : undefined,
                ref: {
                  id: docId,
                  path: docPath,
                  parent: { path: collectionPath },
                  update: jest.fn().mockImplementation(async (updateData) => {
                    if (!mockFirestoreData.collections[collectionPath]) {
                      mockFirestoreData.collections[collectionPath] = {};
                    }
                    mockFirestoreData.collections[collectionPath][docId] = {
                      ...(mockFirestoreData.collections[collectionPath][docId] || {}),
                      ...updateData
                    };
                    return Promise.resolve();
                  }),
                  set: jest.fn().mockImplementation(async (newData, options) => {
                    if (!mockFirestoreData.collections[collectionPath]) {
                      mockFirestoreData.collections[collectionPath] = {};
                    }
                    if (options?.merge) {
                      mockFirestoreData.collections[collectionPath][docId] = {
                        ...(mockFirestoreData.collections[collectionPath][docId] || {}),
                        ...newData
                      };
                    } else {
                      mockFirestoreData.collections[collectionPath][docId] = { ...newData };
                    }
                    return Promise.resolve();
                  })
                }
              };
            }),
            
            // Update document
            update: jest.fn().mockImplementation(async (updateData) => {
              if (!mockFirestoreData.collections[collectionPath]) {
                mockFirestoreData.collections[collectionPath] = {};
              }
              mockFirestoreData.collections[collectionPath][docId] = {
                ...(mockFirestoreData.collections[collectionPath][docId] || {}),
                ...updateData
              };
              return Promise.resolve();
            }),
            
            // Set document
            set: jest.fn().mockImplementation(async (newData, options) => {
              if (!mockFirestoreData.collections[collectionPath]) {
                mockFirestoreData.collections[collectionPath] = {};
              }
              if (options?.merge) {
                mockFirestoreData.collections[collectionPath][docId] = {
                  ...(mockFirestoreData.collections[collectionPath][docId] || {}),
                  ...newData
                };
              } else {
                mockFirestoreData.collections[collectionPath][docId] = { ...newData };
              }
              return Promise.resolve();
            }),
            
            // Delete document
            delete: jest.fn().mockImplementation(async () => {
              if (mockFirestoreData.collections[collectionPath]?.[docId]) {
                delete mockFirestoreData.collections[collectionPath][docId];
              }
              return Promise.resolve();
            }),
            
            // Sub-collections
            collection: jest.fn().mockImplementation((subCollectionPath) => 
              createCollection(`${docPath}/${subCollectionPath}`)
            )
          };
        }),
        
        // Add a new document with auto-generated ID
        add: jest.fn().mockImplementation(async (data) => {
          const docId = `auto_${Math.random().toString(36).substring(2, 15)}`;
          
          if (!mockFirestoreData.collections[collectionPath]) {
            mockFirestoreData.collections[collectionPath] = {};
          }
          
          mockFirestoreData.collections[collectionPath][docId] = { ...data };
          
          return {
            id: docId,
            path: `${collectionPath}/${docId}`,
            parent: { path: collectionPath },
            get: jest.fn().mockImplementation(async () => ({
              id: docId,
              exists: true,
              data: () => ({ ...data }),
              ref: {
                id: docId,
                path: `${collectionPath}/${docId}`,
                update: jest.fn(),
                set: jest.fn(),
                delete: jest.fn()
              }
            }))
          };
        }),
        
        // Query methods
        where: (field, operator, value) => createQueryBuilder(collectionPath, [{ field, operator, value }]),
        orderBy: (field, direction) => createQueryBuilder(collectionPath, [{ orderBy: { field, direction } }]),
        limit: (value) => createQueryBuilder(collectionPath, [{ limit: value }]),
        
        // Get all documents
        get: jest.fn().mockImplementation(async () => {
          const docs = Object.entries(mockFirestoreData.collections[collectionPath] || {})
            .map(([id, data]) => ({
              id,
              data: () => ({ ...data }),
              exists: true,
              ref: {
                id,
                path: `${collectionPath}/${id}`,
                update: jest.fn(),
                set: jest.fn(),
                delete: jest.fn()
              }
            }));
          
          return {
            empty: docs.length === 0,
            docs,
            size: docs.length,
            forEach: jest.fn().mockImplementation((callback) => {
              docs.forEach(callback);
            })
          };
        })
      };
    };
    
    // Return the Firestore mock
    return {
      // Collection reference creation
      collection: jest.fn().mockImplementation((collectionPath) => createCollection(collectionPath)),
      
      // Batch writes
      batch: jest.fn().mockImplementation(() => {
        const batch = {
          _operations: [],
          
          set: jest.fn().mockImplementation((docRef, data, options) => {
            batch._operations.push({ type: 'set', docRef, data, options });
            return batch;
          }),
          
          update: jest.fn().mockImplementation((docRef, data) => {
            batch._operations.push({ type: 'update', docRef, data });
            return batch;
          }),
          
          delete: jest.fn().mockImplementation((docRef) => {
            batch._operations.push({ type: 'delete', docRef });
            return batch;
          }),
          
          commit: jest.fn().mockImplementation(async () => {
            // Execute all the operations in the batch
            for (const op of batch._operations) {
              if (op.type === 'set') {
                await op.docRef.set(op.data, op.options);
              } else if (op.type === 'update') {
                await op.docRef.update(op.data);
              } else if (op.type === 'delete') {
                await op.docRef.delete();
              }
            }
            return Promise.resolve();
          })
        };
        
        return batch;
      }),
      
      // Transactions
      runTransaction: jest.fn().mockImplementation(async (transactionHandler) => {
        const transactionObj = {
          get: jest.fn().mockImplementation(async (docRef) => {
            return docRef.get();
          }),
          set: jest.fn().mockImplementation((docRef, data, options) => {
            docRef.set(data, options);
            return transactionObj;
          }),
          update: jest.fn().mockImplementation((docRef, data) => {
            docRef.update(data);
            return transactionObj;
          }),
          delete: jest.fn().mockImplementation((docRef) => {
            docRef.delete();
            return transactionObj;
          })
        };
        
        return transactionHandler(transactionObj);
      }),
      
      // Utility to access and reset the mock data - useful for tests
      _reset: () => {
        mockFirestoreData.collections = {};
      },
      
      // A way to inspect the current state of the mock data
      _getData: () => {
        return { ...mockFirestoreData };
      },
      
      // Reference to the raw data for direct manipulation (use with caution!)
      _rawData: mockFirestoreData
    };
  }),
  
  // Enhanced FieldValue implementation
  FieldValue: {
    // Server timestamp that returns a real Date object
    serverTimestamp: jest.fn().mockImplementation(() => {
      // Special value that we can identify later
      const timestamp = new Date();
      timestamp._isServerTimestamp = true;
      return timestamp;
    }),
    
    // Increment handler with full functionality
    increment: jest.fn().mockImplementation((value) => {
      // Return a special object we can identify later during update operations
      return {
        _isIncrement: true,
        _incrementBy: value,
        // This allows us to actually implement the increment operation
        _applyIncrement: (current) => {
          return (typeof current === 'number' ? current : 0) + value;
        }
      };
    }),
    
    // Array union handler with full functionality
    arrayUnion: jest.fn().mockImplementation((...elements) => {
      // Return a special object we can identify during updates
      return {
        _isArrayUnion: true,
        _elements: elements,
        // Implement the actual array union
        _applyUnion: (current) => {
          const currentArray = Array.isArray(current) ? current : [];
          const uniqueElements = elements.filter(el => !currentArray.includes(el));
          return [...currentArray, ...uniqueElements];
        }
      };
    }),
    
    // Array remove handler with full functionality
    arrayRemove: jest.fn().mockImplementation((...elements) => {
      // Return a special object we can identify during updates
      return {
        _isArrayRemove: true,
        _elements: elements,
        // Implement the actual array removal
        _applyRemove: (current) => {
          const currentArray = Array.isArray(current) ? current : [];
          return currentArray.filter(el => !elements.includes(el));
        }
      };
    })
  },
  // Enhanced Auth implementation
  auth: jest.fn().mockImplementation(() => {
    // In-memory storage for users
    const mockUsers = new Map();
    const mockCustomClaims = new Map();
    
    return {
      // Verify ID token
      verifyIdToken: jest.fn().mockImplementation(async (token) => {
        // For testing, we'll treat the token as the UID
        const uid = token === 'invalid-token' ? null : (token || 'test-user-id');
        
        if (!uid) {
          throw new Error('Invalid token');
        }
        
        // Create or get user
        if (!mockUsers.has(uid)) {
          mockUsers.set(uid, {
            uid,
            email: `${uid}@example.com`,
            emailVerified: true,
            displayName: `Test User ${uid}`,
            disabled: false,
            metadata: {
              creationTime: new Date().toISOString(),
              lastSignInTime: new Date().toISOString()
            },
            providerData: [],
            customClaims: mockCustomClaims.get(uid) || {}
          });
        }
        
        return {
          uid,
          email: mockUsers.get(uid).email,
          email_verified: mockUsers.get(uid).emailVerified,
          name: mockUsers.get(uid).displayName,
          ...mockCustomClaims.get(uid) || {}
        };
      }),
      
      // Get user by UID or email
      getUser: jest.fn().mockImplementation(async (identifier) => {
        let user;
        
        if (identifier.includes('@')) {
          // Find by email
          for (const [_, userData] of mockUsers.entries()) {
            if (userData.email === identifier) {
              user = userData;
              break;
            }
          }
        } else {
          // Find by UID
          user = mockUsers.get(identifier);
        }
        
        if (!user) {
          throw new Error('User not found');
        }
        
        return { ...user };
      }),
      
      // List users
      listUsers: jest.fn().mockImplementation(async (maxResults = 1000, pageToken) => {
        const users = Array.from(mockUsers.values());
        
        return {
          users,
          pageToken: null // No pagination in our mock
        };
      }),
      
      // Set custom user claims
      setCustomUserClaims: jest.fn().mockImplementation(async (uid, claims) => {
        if (!mockUsers.has(uid)) {
          throw new Error('User not found');
        }
        
        mockCustomClaims.set(uid, claims || {});
        
        // Update user
        const user = mockUsers.get(uid);
        user.customClaims = claims || {};
        mockUsers.set(uid, user);
        
        return Promise.resolve();
      }),
      
      // Create user
      createUser: jest.fn().mockImplementation(async (properties) => {
        const uid = properties.uid || `user-${Math.random().toString(36).substring(2, 15)}`;
        
        if (mockUsers.has(uid)) {
          throw new Error('User already exists');
        }
        
        const user = {
          uid,
          email: properties.email || `${uid}@example.com`,
          emailVerified: properties.emailVerified || false,
          displayName: properties.displayName || `Test User ${uid}`,
          photoURL: properties.photoURL || null,
          phoneNumber: properties.phoneNumber || null,
          disabled: properties.disabled || false,
          password: properties.password || 'password123',
          metadata: {
            creationTime: new Date().toISOString(),
            lastSignInTime: new Date().toISOString()
          },
          providerData: [],
          customClaims: properties.customClaims || {}
        };
        
        mockUsers.set(uid, user);
        if (properties.customClaims) {
          mockCustomClaims.set(uid, properties.customClaims);
        }
        
        return { ...user };
      }),
      
      // Update user
      updateUser: jest.fn().mockImplementation(async (uid, properties) => {
        if (!mockUsers.has(uid)) {
          throw new Error('User not found');
        }
        
        const user = mockUsers.get(uid);
        const updatedUser = {
          ...user,
          ...properties,
          uid // Preserve the original UID
        };
        
        mockUsers.set(uid, updatedUser);
        
        return { ...updatedUser };
      }),
      
      // Delete user
      deleteUser: jest.fn().mockImplementation(async (uid) => {
        if (!mockUsers.has(uid)) {
          throw new Error('User not found');
        }
        
        mockUsers.delete(uid);
        mockCustomClaims.delete(uid);
        
        return Promise.resolve();
      }),
      
      // Get user by email
      getUserByEmail: jest.fn().mockImplementation(async (email) => {
        for (const [_, userData] of mockUsers.entries()) {
          if (userData.email === email) {
            return { ...userData };
          }
        }
        
        throw new Error('User not found');
      }),
      
      // Create custom token
      createCustomToken: jest.fn().mockImplementation(async (uid, developerClaims) => {
        // In a real scenario, this would create a JWT
        return `custom-token-${uid}-${new Date().getTime()}`;
      }),
      
      // Revoke refresh tokens
      revokeRefreshTokens: jest.fn().mockImplementation(async (uid) => {
        if (!mockUsers.has(uid)) {
          throw new Error('User not found');
        }
        
        return Promise.resolve();
      }),
      
      // Helper methods for testing
      _reset: () => {
        mockUsers.clear();
        mockCustomClaims.clear();
      },
      
      _getUsers: () => {
        return Array.from(mockUsers.values());
      },
      
      _getClaims: () => {
        return Array.from(mockCustomClaims.entries()).reduce((acc, [uid, claims]) => {
          acc[uid] = claims;
          return acc;
        }, {});
      }
    };
  }),
  
  // Storage for file operations
  storage: jest.fn().mockImplementation(() => {
    // In-memory storage for files
    const mockFiles = new Map();
    
    return {
      bucket: jest.fn().mockImplementation((bucketName = 'default-bucket') => {
        if (!mockFiles.has(bucketName)) {
          mockFiles.set(bucketName, new Map());
        }
        
        return {
          // File operations
          file: jest.fn().mockImplementation((filePath) => {
            const bucketFiles = mockFiles.get(bucketName);
            
            return {
              // Get signed URL
              getSignedUrl: jest.fn().mockImplementation(async (config) => {
                const url = `https://storage.googleapis.com/${bucketName}/${filePath}?token=mock-token`;
                return [url];
              }),
              
              // Save data
              save: jest.fn().mockImplementation(async (data, options) => {
                bucketFiles.set(filePath, {
                  data,
                  contentType: options?.contentType || 'application/octet-stream',
                  metadata: options?.metadata || {}
                });
                
                return [{ name: filePath }];
              }),
              
              // Check if file exists
              exists: jest.fn().mockImplementation(async () => {
                return [bucketFiles.has(filePath)];
              }),
              
              // Download file
              download: jest.fn().mockImplementation(async (options) => {
                if (!bucketFiles.has(filePath)) {
                  throw new Error('File not found');
                }
                
                return [bucketFiles.get(filePath).data];
              }),
              
              // Delete file
              delete: jest.fn().mockImplementation(async () => {
                if (bucketFiles.has(filePath)) {
                  bucketFiles.delete(filePath);
                }
                
                return [true];
              }),
              
              // Get metadata
              getMetadata: jest.fn().mockImplementation(async () => {
                if (!bucketFiles.has(filePath)) {
                  throw new Error('File not found');
                }
                
                return [{
                  name: filePath,
                  contentType: bucketFiles.get(filePath).contentType,
                  metadata: bucketFiles.get(filePath).metadata,
                  size: bucketFiles.get(filePath).data?.length || 0,
                  timeCreated: new Date().toISOString(),
                  updated: new Date().toISOString()
                }];
              }),
              
              // Set metadata
              setMetadata: jest.fn().mockImplementation(async (metadata) => {
                if (!bucketFiles.has(filePath)) {
                  throw new Error('File not found');
                }
                
                const fileData = bucketFiles.get(filePath);
                fileData.metadata = { ...fileData.metadata, ...metadata };
                bucketFiles.set(filePath, fileData);
                
                return [{
                  name: filePath,
                  contentType: fileData.contentType,
                  metadata: fileData.metadata,
                  size: fileData.data?.length || 0,
                  timeCreated: new Date().toISOString(),
                  updated: new Date().toISOString()
                }];
              }),
              
              // Create write stream
              createWriteStream: jest.fn().mockImplementation((options) => {
                const stream = new require('stream').Writable({
                  write(chunk, encoding, callback) {
                    // Store the data in memory
                    if (!bucketFiles.has(filePath)) {
                      bucketFiles.set(filePath, {
                        data: Buffer.from(chunk),
                        contentType: options?.contentType || 'application/octet-stream',
                        metadata: options?.metadata || {}
                      });
                    } else {
                      const fileData = bucketFiles.get(filePath);
                      const newData = Buffer.concat([
                        Buffer.isBuffer(fileData.data) ? fileData.data : Buffer.from(fileData.data || ''),
                        Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
                      ]);
                      fileData.data = newData;
                      bucketFiles.set(filePath, fileData);
                    }
                    
                    callback();
                  }
                });
                
                stream.on('finish', () => {
                  // Emit the expected events
                  process.nextTick(() => {
                    stream.emit('complete');
                  });
                });
                
                return stream;
              }),
              
              // Create read stream
              createReadStream: jest.fn().mockImplementation(() => {
                if (!bucketFiles.has(filePath)) {
                  throw new Error('File not found');
                }
                
                const fileData = bucketFiles.get(filePath);
                const stream = new require('stream').Readable({
                  read() {
                    this.push(fileData.data);
                    this.push(null); // End of stream
                  }
                });
                
                return stream;
              })
            };
          }),
          
          // Create bucket methods for testing
          _reset: () => {
            mockFiles.get(bucketName).clear();
          },
          
          _getFiles: () => {
            return Array.from(mockFiles.get(bucketName).entries()).reduce((acc, [path, data]) => {
              acc[path] = data;
              return acc;
            }, {});
          }
        };
      }),
      
      // Storage helper methods for testing
      _reset: () => {
        mockFiles.clear();
      },
      
      _getBuckets: () => {
        return Array.from(mockFiles.keys());
      }
    };
  })
};

module.exports = firebaseAdminMock;