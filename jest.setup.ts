// jest.setup.ts
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

// Create a mock app array for firebase-admin
const mockApps = [];
mockApps.push({
  name: '[DEFAULT]',
  options: {},
  firestore: jest.fn(),
  auth: jest.fn()
});

// Mock firebase-admin
jest.mock('firebase-admin', () => {
  // Enhanced query builder with proper chaining
  const createQueryBuilder = () => {
    // Store query constraints to allow for multiple where clauses
    const constraints = [];
    
    const queryBuilder = {
      where: jest.fn().mockImplementation((field, op, value) => {
        constraints.push({ field, op, value });
        return queryBuilder;
      }),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      startAfter: jest.fn().mockReturnThis(),
      startAt: jest.fn().mockReturnThis(),
      endBefore: jest.fn().mockReturnThis(),
      endAt: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({
        empty: false,
        size: 1,
        docs: [{
          data: jest.fn().mockReturnValue({
            id: 'test-id',
            name: 'Test Name',
            category: 'TECHNICAL',
            zScore: 8.5,
            userId: 'test-user-id',
            createdAt: new Date(),
            updatedAt: new Date()
          }),
          id: 'test-id',
          exists: true,
          ref: {
            collection: jest.fn().mockImplementation(createCollectionRef),
            update: jest.fn().mockResolvedValue({}),
            set: jest.fn().mockResolvedValue({})
          }
        }],
        forEach: jest.fn().mockImplementation(callback => {
          callback({
            data: jest.fn().mockReturnValue({
              id: 'test-id',
              name: 'Test Name',
              category: 'TECHNICAL',
              zScore: 8.5,
              userId: 'test-user-id'
            }),
            id: 'test-id',
            exists: true,
            ref: {
              collection: jest.fn().mockImplementation(createCollectionRef),
              update: jest.fn().mockResolvedValue({}),
              set: jest.fn().mockResolvedValue({})
            }
          });
        })
      })
    };
    return queryBuilder;
  };

  // Create document reference with all methods
  const createDocRef = (id = 'test-id') => {
    return {
      id,
      collection: jest.fn().mockImplementation(createCollectionRef),
      get: jest.fn().mockResolvedValue({
        exists: true,
        data: jest.fn().mockReturnValue({
          id,
          name: 'Test Name',
          category: 'TECHNICAL',
          zScore: 8.5,
          userId: 'test-user-id',
          createdAt: new Date(),
          updatedAt: new Date()
        }),
        id,
        ref: {
          collection: jest.fn().mockImplementation(createCollectionRef),
          update: jest.fn().mockResolvedValue({}),
          set: jest.fn().mockResolvedValue({})
        }
      }),
      update: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({})
    };
  };

  // Create collection reference with all methods
  const createCollectionRef = () => {
    return {
      doc: jest.fn().mockImplementation(createDocRef),
      ...createQueryBuilder(),
      add: jest.fn().mockResolvedValue({
        id: 'new-doc-id',
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: jest.fn().mockReturnValue({
            id: 'new-doc-id',
            name: 'New Test Name',
            createdAt: new Date()
          })
        })
      })
    };
  };

  return {
    initializeApp: jest.fn().mockReturnValue(mockApps[0]),
    apps: mockApps,
    firestore: jest.fn().mockReturnValue({
      collection: jest.fn().mockImplementation(createCollectionRef),
      doc: jest.fn().mockImplementation(createDocRef),
      batch: jest.fn().mockReturnValue({
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        commit: jest.fn().mockResolvedValue({})
      }),
      runTransaction: jest.fn().mockImplementation(async (callback) => {
        const transaction = {
          get: jest.fn().mockResolvedValue({
            exists: true,
            data: jest.fn().mockReturnValue({}),
            id: 'test-id',
            ref: createDocRef()
          }),
          set: jest.fn(),
          update: jest.fn(),
          delete: jest.fn()
        };
        return await callback(transaction);
      })
    }),
    FieldValue: {
      serverTimestamp: jest.fn().mockReturnValue(new Date()),
      increment: jest.fn().mockImplementation((num) => num),
      arrayUnion: jest.fn().mockImplementation((...elements) => elements),
      arrayRemove: jest.fn().mockImplementation((...elements) => elements)
    },
    auth: jest.fn().mockReturnValue({
      verifyIdToken: jest.fn().mockResolvedValue({
        uid: 'test-user-id',
        email: 'test@example.com'
      }),
      getUser: jest.fn().mockResolvedValue({
        uid: 'test-user-id',
        email: 'test@example.com',
        emailVerified: true,
        displayName: 'Test User'
      }),
      createCustomToken: jest.fn().mockResolvedValue('mock-custom-token')
    }),
    storage: jest.fn().mockReturnValue({
      bucket: jest.fn().mockReturnValue({
        file: jest.fn().mockReturnValue({
          getSignedUrl: jest.fn().mockResolvedValue(['https://storage.googleapis.com/mock-url'])
        }),
        upload: jest.fn().mockResolvedValue([{ name: 'mock-file' }])
      })
    })
  };
});

// Mock firebase-functions
jest.mock('firebase-functions', () => {
  // Create complete pubsub mock with all necessary methods
  const mockPubSub = {
    schedule: jest.fn().mockReturnValue({
      onRun: jest.fn().mockImplementation((handler) => {
        return { handler };
      }),
      timeZone: jest.fn().mockReturnThis()
    }),
    topic: jest.fn().mockReturnValue({
      onPublish: jest.fn().mockImplementation((handler) => {
        return { handler };
      })
    })
  };

  // Create firestore mock with all trigger types
  const mockFirestore = {
    document: jest.fn().mockReturnValue({
      onWrite: jest.fn().mockImplementation((handler) => {
        return { handler };
      }),
      onCreate: jest.fn().mockImplementation((handler) => {
        return { handler };
      }),
      onUpdate: jest.fn().mockImplementation((handler) => {
        return { handler };
      }),
      onDelete: jest.fn().mockImplementation((handler) => {
        return { handler };
      })
    }),
    onWrite: jest.fn().mockImplementation((path, handler) => {
      return { handler };
    }),
    onCreate: jest.fn().mockImplementation((path, handler) => {
      return { handler };
    }),
    onUpdate: jest.fn().mockImplementation((path, handler) => {
      return { handler };
    }),
    onDelete: jest.fn().mockImplementation((path, handler) => {
      return { handler };
    })
  };

  // Advanced runWith implementation with resource configuration
  const mockRunWith = {
    https: {
      onCall: jest.fn().mockImplementation((handler) => {
        return { handler };
      }),
      onRequest: jest.fn().mockImplementation((handler) => {
        return { handler };
      })
    },
    pubsub: mockPubSub,
    firestore: mockFirestore,
    storage: {
      object: jest.fn().mockReturnValue({
        onFinalize: jest.fn().mockImplementation((handler) => {
          return { handler };
        }),
        onDelete: jest.fn().mockImplementation((handler) => {
          return { handler };
        }),
        onArchive: jest.fn().mockImplementation((handler) => {
          return { handler };
        }),
        onMetadataUpdate: jest.fn().mockImplementation((handler) => {
          return { handler };
        })
      })
    }
  };

  // Root-level mocks for the entire firebase-functions module
  return {
    https: {
      onCall: jest.fn().mockImplementation((handler) => {
        return { handler };
      }),
      onRequest: jest.fn().mockImplementation((handler) => {
        return { handler };
      }),
      HttpsError: jest.fn().mockImplementation((code, message) => ({
        code,
        message
      }))
    },
    config: jest.fn().mockReturnValue({}),
    runWith: jest.fn().mockReturnValue(mockRunWith),
    firestore: mockFirestore,
    pubsub: mockPubSub,
    logger: {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    },
    // Add handler.name workaround for Cloud Function naming
    // This makes it possible to use handler.name in trigger definitions
    handler: {
      name: 'mock-function-name'
    }
  };
});

// Mock firebase-functions-test with expanded functionality
jest.mock('firebase-functions-test', () => {
  // Create a function that just returns the original function
  // This approach will make the 'functionsTest.wrap()' in tests work properly
  function mockWrap(fn) {
    // If the function is a Cloud Functions handler with 'handler' property
    if (fn && typeof fn === 'object' && fn.handler && typeof fn.handler === 'function') {
      return fn.handler;
    }
    // Otherwise, return the function itself
    return fn;
  }
  
  const testInstance = {
    // Use a simple function that directly returns the input function
    wrap: mockWrap,
    
    firestore: {
      makeDocumentSnapshot: jest.fn((data, path) => ({
        data: () => data,
        exists: !!data,
        id: path.split('/').pop(),
        ref: {
          path,
          id: path.split('/').pop(),
          parent: {
            path: path.split('/').slice(0, -1).join('/')
          }
        }
      })),
      
      makeChange: jest.fn((before, after) => ({
        before,
        after,
        data: () => after.data()
      })),
    },
    
    auth: {
      makeUserRecord: jest.fn((uid) => ({
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
        customClaims: {}
      })),
    },
    
    pubsub: {
      makeMessage: jest.fn((data) => ({
        data: Buffer.from(JSON.stringify(data)).toString('base64'),
        json: () => data,
        attributes: {}
      })),
    },
    
    storage: {
      makeObjectMetadata: jest.fn((data) => ({
        ...data,
        bucket: data.bucket || 'test-bucket',
        name: data.name || 'test-file.txt'
      })),
    },
    
    https: {
      makeRequest: jest.fn((options) => ({
        method: options.method || 'GET',
        headers: options.headers || {},
        body: options.body || {},
        query: options.query || {},
        params: options.params || {},
        rawRequest: {},
        user: options.user || null
      })),
      
      makeResponse: jest.fn(() => {
        const res = {
          status: jest.fn().mockReturnThis(),
          send: jest.fn().mockReturnThis(),
          json: jest.fn().mockReturnThis(),
          set: jest.fn().mockReturnThis(),
          end: jest.fn()
        };
        return res;
      }),
    }
  };
  
  // Create the mock implementation that will properly expose our functions
  const mockFunctionsTest = jest.fn().mockReturnValue(testInstance);
  
  // Add the wrap function directly to the mock function so it can be imported
  // This makes sure both forms work:
  // 1. const functionsTest = require('firebase-functions-test')();
  // 2. import * as functionsTest from 'firebase-functions-test';
  mockFunctionsTest.wrap = mockWrap;
  
  return mockFunctionsTest;
});

// Create a comprehensive mock for ethers.js
jest.mock('ethers', () => {
  // Create BigNumber mock for ethers
  class MockBigNumber {
    _hex: string;
    _isBigNumber: boolean;
    
    constructor(value) {
      this._hex = `0x${Number(value).toString(16)}`;
      this._isBigNumber = true;
    }
    
    toString() {
      return this._hex;
    }
    
    toNumber() {
      return parseInt(this._hex, 16);
    }
    
    add(other) {
      return new MockBigNumber(this.toNumber() + (other.toNumber ? other.toNumber() : Number(other)));
    }
    
    sub(other) {
      return new MockBigNumber(this.toNumber() - (other.toNumber ? other.toNumber() : Number(other)));
    }
    
    mul(other) {
      return new MockBigNumber(this.toNumber() * (other.toNumber ? other.toNumber() : Number(other)));
    }
    
    div(other) {
      return new MockBigNumber(this.toNumber() / (other.toNumber ? other.toNumber() : Number(other)));
    }
  }
  
  // Receipt for transactions
  const mockReceipt = {
    to: '0x1234567890123456789012345678901234567890',
    from: '0x0987654321098765432109876543210987654321',
    contractAddress: null,
    transactionIndex: 0,
    gasUsed: new MockBigNumber(100000),
    logsBloom: '0x00',
    blockHash: '0xMockBlockHash',
    transactionHash: '0xMockTransactionHash',
    logs: [],
    blockNumber: 12345678,
    confirmations: 10,
    cumulativeGasUsed: new MockBigNumber(100000),
    effectiveGasPrice: new MockBigNumber(20000000000),
    status: 1,
    type: 0,
    byzantium: true,
    hash: '0xMockTransactionHash'
  };
  
  // Transaction response
  const mockTxResponse = {
    hash: '0xMockTransactionHash',
    wait: jest.fn().mockResolvedValue(mockReceipt)
  };
  
  // Contract instance methods
  const mockContractInstance = {
    mint: jest.fn().mockResolvedValue(mockTxResponse),
    transfer: jest.fn().mockResolvedValue(mockTxResponse),
    approve: jest.fn().mockResolvedValue(mockTxResponse),
    balanceOf: jest.fn().mockResolvedValue(new MockBigNumber(1000000000000000000)),
    decimals: jest.fn().mockResolvedValue(18),
    symbol: jest.fn().mockResolvedValue("VLET"),
    name: jest.fn().mockResolvedValue("VoveletToken"),
    totalSupply: jest.fn().mockResolvedValue(new MockBigNumber(1000000000000000000000000)),
    allowance: jest.fn().mockResolvedValue(new MockBigNumber(0)),
    
    // NFT specific methods
    isContributionMinted: jest.fn().mockResolvedValue(false),
    getTokenIdForContribution: jest.fn().mockResolvedValue(new MockBigNumber(123)),
    tokenURI: jest.fn().mockResolvedValue('ipfs://QmMockIpfsHash'),
    ownerOf: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
    
    // Event handling
    on: jest.fn().mockImplementation((event, callback) => {
      setTimeout(() => {
        if (event === 'Transfer') {
          callback(
            '0x0000000000000000000000000000000000000000', 
            '0x1234567890123456789012345678901234567890', 
            new MockBigNumber(123)
          );
        }
      }, 100);
      return { removeAllListeners: jest.fn() };
    }),
    
    // Helper for chaining
    connect: jest.fn().mockReturnThis(),
    
    // Interface for parsing logs
    interface: {
      parseLog: jest.fn().mockImplementation((log) => {
        return { 
          name: 'Transfer', 
          args: { 
            from: '0x0000000000000000000000000000000000000000',
            to: '0x1234567890123456789012345678901234567890',
            tokenId: 123
          } 
        };
      }),
      getEvent: jest.fn().mockReturnValue({
        name: 'Transfer',
        signature: 'Transfer(address,address,uint256)'
      })
    },
    
    // Filters for events
    filters: {
      Transfer: jest.fn().mockReturnValue({})
    }
  };
  
  // Provider instance methods
  const mockProvider = {
    getNetwork: jest.fn().mockResolvedValue({ chainId: 11155111, name: 'sepolia' }),
    getBlockNumber: jest.fn().mockResolvedValue(12345678),
    getTransactionReceipt: jest.fn().mockResolvedValue(mockReceipt),
    getTransaction: jest.fn().mockResolvedValue(mockTxResponse),
    getBlock: jest.fn().mockResolvedValue({ hash: '0xMockBlockHash', number: 12345678, timestamp: Date.now() }),
    getSigner: jest.fn().mockReturnValue({
      getAddress: jest.fn().mockResolvedValue('0x0987654321098765432109876543210987654321'),
      signMessage: jest.fn().mockResolvedValue('0xMockSignature'),
      sendTransaction: jest.fn().mockResolvedValue(mockTxResponse),
      connect: jest.fn().mockReturnThis()
    }),
    on: jest.fn().mockImplementation((event, callback) => {
      if (event === 'block') {
        setTimeout(() => callback(12345678), 100);
      }
      return { off: jest.fn() };
    }),
    getLogs: jest.fn().mockResolvedValue([]),
    getGasPrice: jest.fn().mockResolvedValue(new MockBigNumber(20000000000)),
    getFeeData: jest.fn().mockResolvedValue({
      gasPrice: new MockBigNumber(20000000000),
      maxFeePerGas: new MockBigNumber(30000000000),
      maxPriorityFeePerGas: new MockBigNumber(1500000000)
    }),
    resolveName: jest.fn().mockImplementation(async (name) => {
      if (name === 'test.eth') return '0x1234567890123456789012345678901234567890';
      return null;
    }),
    getFilterChanges: jest.fn().mockResolvedValue([]),
    getFilterLogs: jest.fn().mockResolvedValue([]),
    createFilter: jest.fn().mockResolvedValue('0xMockFilterId'),
    uninstallFilter: jest.fn().mockResolvedValue(true),
    listenerCount: jest.fn().mockReturnValue(0),
    removeAllListeners: jest.fn().mockReturnThis()
  };
  
  // Return full ethers mock implementation
  return {
    // Providers
    JsonRpcProvider: jest.fn().mockImplementation(() => mockProvider),
    WebSocketProvider: jest.fn().mockImplementation(() => mockProvider),
    getDefaultProvider: jest.fn().mockReturnValue(mockProvider),
    
    // Contracts
    Contract: jest.fn().mockImplementation(() => mockContractInstance),
    
    // Wallets
    Wallet: jest.fn().mockImplementation(() => ({
      address: '0x0987654321098765432109876543210987654321',
      privateKey: '0xMockPrivateKey',
      publicKey: '0xMockPublicKey',
      connect: jest.fn().mockReturnValue({
        getAddress: jest.fn().mockResolvedValue('0x0987654321098765432109876543210987654321'),
        signMessage: jest.fn().mockResolvedValue('0xMockSignature'),
        sendTransaction: jest.fn().mockResolvedValue(mockTxResponse)
      })
    })),
    
    // Utils and constants
    utils: {
      formatUnits: jest.fn().mockImplementation((value, decimals = 18) => {
        if (typeof value === 'object' && value._isBigNumber) {
          value = value.toNumber();
        }
        return (Number(value) / 10 ** decimals).toString();
      }),
      parseUnits: jest.fn().mockImplementation((value, decimals = 18) => {
        return new MockBigNumber(Number(value) * 10 ** decimals);
      }),
      formatEther: jest.fn().mockImplementation((value) => {
        if (typeof value === 'object' && value._isBigNumber) {
          value = value.toNumber();
        }
        return (Number(value) / 10 ** 18).toString();
      }),
      parseEther: jest.fn().mockImplementation((value) => {
        return new MockBigNumber(Number(value) * 10 ** 18);
      }),
      keccak256: jest.fn().mockImplementation((value) => {
        return `0x${Buffer.from(value).toString('hex')}`;
      }),
      id: jest.fn().mockImplementation((text) => {
        return `0x${Buffer.from(text).toString('hex').substring(0, 64)}`;
      }),
      getAddress: jest.fn().mockImplementation((address) => address)
    },
    
    // Address validation
    isAddress: jest.fn().mockImplementation((address) => {
      return typeof address === 'string' && address.startsWith('0x') && address.length === 42;
    }),
    
    // BigNumber implementation
    BigNumber: MockBigNumber,
    
    // Direct utilities at root level (ethers v6 compatibility)
    formatUnits: jest.fn().mockImplementation((value, decimals = 18) => {
      if (typeof value === 'object' && value._isBigNumber) {
        value = value.toNumber();
      }
      return (Number(value) / 10 ** decimals).toString();
    }),
    parseUnits: jest.fn().mockImplementation((value, decimals = 18) => {
      return new MockBigNumber(Number(value) * 10 ** decimals);
    }),
    formatEther: jest.fn().mockImplementation((value) => {
      if (typeof value === 'object' && value._isBigNumber) {
        value = value.toNumber();
      }
      return (Number(value) / 10 ** 18).toString();
    }),
    parseEther: jest.fn().mockImplementation((value) => {
      return new MockBigNumber(Number(value) * 10 ** 18);
    }),
    
    // Constants
    constants: {
      AddressZero: '0x0000000000000000000000000000000000000000',
      HashZero: '0x0000000000000000000000000000000000000000000000000000000000000000',
      MaxUint256: new MockBigNumber('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
    },
    
    // Address constants (ethers v6)
    ZeroAddress: '0x0000000000000000000000000000000000000000',
    MaxUint256: new MockBigNumber('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
  };
});