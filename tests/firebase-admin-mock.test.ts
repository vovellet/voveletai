import * as admin from 'firebase-admin';
import '../__mocks__/firebase-admin';

describe('Firebase Admin Mock Tests', () => {
  // Test that our enhanced mock is actually in use
  test('Firebase Admin mock is initialized with apps', () => {
    // Test that the module is mocked
    expect(admin.initializeApp).toBeDefined();
    expect(admin.firestore).toBeDefined();
    expect(admin.FieldValue).toBeDefined();
  });

  // Test Firestore basic operations using our mock
  test('Firestore basic operations work', async () => {
    // Get firestore instance
    const db = admin.firestore();
    expect(db.collection).toBeDefined();
    
    // Create collection ref
    const collectionRef = db.collection('test-collection');
    expect(collectionRef.doc).toBeDefined();
    
    // Get document ref
    const docRef = collectionRef.doc('test-doc');
    expect(docRef.get).toBeDefined();
    expect(docRef.set).toBeDefined();
    
    // The mock always returns the same test data
    const docSnapshot = await docRef.get();
    expect(docSnapshot).toBeDefined();
    expect(docSnapshot.exists).toBe(true);
    
    // Our mock returns a predefined object in jest.setup.ts
    const data = docSnapshot.data();
    expect(data).toBeDefined();
    // Accept either 'test-id' or 'test-doc' as valid IDs
    expect(['test-id', 'test-doc']).toContain(data.id);
  });
  
  // Test query operations using our mock
  test('Query operations work', async () => {
    const db = admin.firestore();
    const collection = db.collection('test-collection');
    
    // Test query methods
    const query = collection.where('field', '==', 'value')
                           .orderBy('date', 'desc')
                           .limit(10);
    expect(query.get).toBeDefined();
    
    // Get query results
    const querySnapshot = await query.get();
    expect(querySnapshot).toBeDefined();
    expect(querySnapshot.empty).toBe(false);
    expect(querySnapshot.docs).toBeDefined();
    expect(querySnapshot.docs.length).toBeGreaterThan(0);
    
    // The mock has been set up to return test data
    expect(querySnapshot.docs[0].id).toBe('test-id');
  });
  
  // Test batch operations
  test('Batch operations work', async () => {
    const db = admin.firestore();
    const batch = db.batch();
    
    expect(batch.set).toBeDefined();
    expect(batch.update).toBeDefined();
    expect(batch.delete).toBeDefined();
    expect(batch.commit).toBeDefined();
    
    // Use batch operations
    const docRef = db.collection('test-collection').doc('test-doc');
    batch.set(docRef, { field: 'value' });
    batch.update(docRef, { field: 'updated' });
    
    // Commit the batch
    const result = await batch.commit();
    expect(result).toBeDefined();
  });
  
  // Test FieldValue operations
  test('FieldValue operations work', () => {
    // Create field values
    const timestamp = admin.FieldValue.serverTimestamp();
    expect(timestamp).toBeInstanceOf(Date);
    
    const increment = admin.FieldValue.increment(5);
    expect(increment).toBe(5);
    
    const arrayUnion = admin.FieldValue.arrayUnion('a', 'b');
    expect(arrayUnion).toEqual(['a', 'b']);
    
    const arrayRemove = admin.FieldValue.arrayRemove('a', 'b');
    expect(arrayRemove).toEqual(['a', 'b']);
  });
});