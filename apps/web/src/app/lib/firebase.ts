import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut as firebaseSignOut, createUserWithEmailAndPassword, UserCredential, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { User, UserRole } from '@obscuranet/shared';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

// Authentication helpers
export const signIn = (email: string, password: string): Promise<UserCredential> => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signUp = (email: string, password: string): Promise<UserCredential> => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const signOut = (): Promise<void> => {
  return firebaseSignOut(auth);
};

// Create a new user document in Firestore
export const createUserProfile = async (userId: string, email: string, role: UserRole = 'user'): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  
  const userData: Omit<User, 'id'> = {
    email,
    role,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  await setDoc(userRef, userData);
};

// Get current user's profile from Firestore
export const getUserProfile = async (userId: string): Promise<User | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() } as User;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

// Update user's role
export const updateUserRole = async (userId: string, role: UserRole): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { 
    role,
    updatedAt: new Date()
  });
};

// Function to convert Firebase user to our User type
export const firebaseUserToUser = async (firebaseUser: FirebaseUser): Promise<User | null> => {
  if (!firebaseUser) return null;
  
  // Get the user profile from Firestore
  const userProfile = await getUserProfile(firebaseUser.uid);
  
  if (!userProfile) {
    // If no profile exists, create one with default user role
    await createUserProfile(firebaseUser.uid, firebaseUser.email || '');
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || undefined,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
  
  return userProfile;
};

// Export Firebase instances
export { app, auth, db, functions };

// Export Firebase functions
export const submitContribution = httpsCallable(functions, 'submitContribution');
export const getWalletBalance = httpsCallable(functions, 'getWalletBalance');
export const mintTokens = httpsCallable(functions, 'mintTokens');
export const getOnChainBalance = httpsCallable(functions, 'getOnChainBalance');
export const spendTokens = httpsCallable(functions, 'spendTokens');
export const getSpendingHistory = httpsCallable(functions, 'getSpendingHistory');
export const createNFT = httpsCallable(functions, 'createNFT');
export const getUserNFTs = httpsCallable(functions, 'getUserNFTs');
export const submitProject = httpsCallable(functions, 'submitProject');
export const getUserProjects = httpsCallable(functions, 'getUserProjects');
export const approveProject = httpsCallable(functions, 'approveProject');
export const rejectProject = httpsCallable(functions, 'rejectProject');

// Z-Borsa functions
export const swapTokens = httpsCallable(functions, 'swapTokens');
export const getSwapHistory = httpsCallable(functions, 'getSwapHistory');
export const stakeTokens = httpsCallable(functions, 'stakeTokens');
export const getActiveStakes = httpsCallable(functions, 'getActiveStakes');
export const withdrawStake = httpsCallable(functions, 'withdrawStake');
export const processYields = httpsCallable(functions, 'processYields');