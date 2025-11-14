import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../firebase/config';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // Check if email is verified
  const checkEmailVerification = async (user) => {
    try {
      await user.reload();
      return user.emailVerified;
    } catch (error) {
      console.error('Error checking email verification:', error);
      return false;
    }
  };

  // Send email verification
  const sendVerificationEmail = async (user) => {
    try {
      await sendEmailVerification(user);
      return { success: true };
    } catch (error) {
      console.error('Error sending verification email:', error);
      return { success: false, error: error.message };
    }
  };

  // Fetch user data from Firestore
  const fetchUserData = async (userId) => {
    try {
      console.log('📊 Fetching user data from Firestore for UID:', userId);
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('✅ User data loaded:', userData);
        return userData;
      } else {
        console.log('⚠️ User authenticated but no data in Firestore');
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching user data:', error);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔄 Auth state changed:', firebaseUser ? firebaseUser.uid : 'No user');
      
      setLoading(true);

      if (firebaseUser) {
        // Check if email is verified
        const isVerified = await checkEmailVerification(firebaseUser);
        console.log('📧 Email verification status:', isVerified);
        
        if (isVerified) {
          // User is signed in and verified
          console.log('✅ User is verified, setting user state');
          setUser(firebaseUser);
          
          // Fetch user data
          const userData = await fetchUserData(firebaseUser.uid);
          if (userData) {
            setUserData(userData);
          } else {
            // Create default user data if not exists
            const defaultUserData = {
              email: firebaseUser.email,
              role: 'student',
              name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
              createdAt: new Date(),
              profileCompleted: false,
              emailVerified: true
            };
            
            await setDoc(doc(db, 'users', firebaseUser.uid), defaultUserData);
            setUserData(defaultUserData);
          }
        } else {
          // Email not verified
          console.log('❌ Email not verified for user:', firebaseUser.uid);
          setUser(null);
          setUserData(null);
        }
      } else {
        // No user signed in
        console.log('🚫 No user signed in');
        setUser(null);
        setUserData(null);
      }
      
      setLoading(false);
      setAuthChecked(true);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      console.log('🔐 Attempting login with:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('✅ Firebase login successful, checking email verification...');
      
      // Check if email is verified
      const isVerified = await checkEmailVerification(user);
      
      if (!isVerified) {
        console.log('❌ Email not verified, logging out...');
        await signOut(auth);
        return { 
          success: false, 
          error: 'Please verify your email address before logging in. Check your inbox for the verification link.' 
        };
      }
      
      console.log('🎉 Login successful, user is verified');
      
      // IMPORTANT: Fetch user data immediately and wait for it
      const userData = await fetchUserData(user.uid);
      
      if (!userData) {
        console.log('❌ No user data found after login');
        await signOut(auth);
        return { 
          success: false, 
          error: 'User data not found. Please contact support.' 
        };
      }

      // Update state immediately
      setUser(user);
      setUserData(userData);
      
      console.log('✅ Login complete with user role:', userData.role);
      
      return { 
        success: true, 
        user: user,
        userData: userData // Return userData so Login component can use it immediately
      };
    } catch (error) {
      console.error('❌ Login error:', error);
      let errorMessage = error.message;
      
      // More user-friendly error messages
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password.';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const signup = async (email, password, role, name) => {
    try {
      console.log('👤 Creating new account for:', email, 'with role:', role);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update profile with display name
      await updateProfile(user, {
        displayName: name
      });
      
      // Create user data object
      const userData = {
        uid: user.uid,
        email: email,
        role: role,
        name: name,
        createdAt: new Date(),
        profileCompleted: false,
        emailVerified: false,
        status: 'active'
      };
      
      // Save to Firestore
      await setDoc(doc(db, 'users', user.uid), userData);
      
      // Send email verification
      await sendVerificationEmail(user);
      
      console.log('✅ Account created successfully, verification email sent');
      
      return { 
        success: true, 
        user,
        userData: userData,
        message: 'Account created successfully! Please check your email for verification link.' 
      };
    } catch (error) {
      console.error('❌ Signup error:', error);
      let errorMessage = error.message;
      
      // More user-friendly error messages
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use at least 6 characters.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format.';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      console.log('👋 User logged out successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Logout error:', error);
      return { success: false, error: error.message };
    }
  };

  const resendVerificationEmail = async () => {
    if (!auth.currentUser) {
      return { success: false, error: 'No user logged in' };
    }
    
    try {
      await sendEmailVerification(auth.currentUser);
      return { success: true, message: 'Verification email sent successfully!' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const updateUserData = async (updates) => {
    if (!user) {
      return { success: false, error: 'No user logged in' };
    }
    
    try {
      await setDoc(doc(db, 'users', user.uid), updates, { merge: true });
      setUserData(prev => ({ ...prev, ...updates }));
      return { success: true };
    } catch (error) {
      console.error('Error updating user data:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    // User state
    currentUser: user,
    user: user,
    userData: userData,
    userRole: userData?.role,
    
    // Auth methods
    login,
    signup,
    logout,
    resendVerificationEmail,
    updateUserData,
    
    // Status
    loading,
    authChecked,
    isAuthenticated: !!user && user.emailVerified === true,
    
    // Utilities
    checkEmailVerification: () => user ? checkEmailVerification(user) : false
  };

  console.log('🔍 AuthContext value:', { 
    user: user?.uid, 
    userRole: userData?.role, 
    userData: userData,
    loading,
    authChecked,
    isAuthenticated: !!user && user.emailVerified === true
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};