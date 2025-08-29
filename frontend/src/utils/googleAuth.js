import { signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase.js';
import api from '../lib/api.js';

export const signInWithGoogle = async () => {
  try {
    console.log('Starting Google sign-in process...');
    
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    console.log('Google sign-in successful, user:', user.email);
    
    // Get the Google OAuth access token
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential.accessToken;
    
    console.log('Got access token, sending to backend...');
    
    // Send the token to our backend for verification and user creation/login
    const response = await api.post('/auth/google', {
      accessToken,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      }
    });
    
    console.log('Backend response received:', response.data);
    
    return {
      success: true,
      token: response.data.token,
      user: response.data.user
    };
  } catch (error) {
    console.error('Google sign-in error details:', {
      code: error.code,
      message: error.message,
      email: error.email,
      credential: error.credential
    });
    
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in was cancelled');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Pop-up was blocked. Please allow pop-ups for this site.');
    } else if (error.code === 'auth/unauthorized-domain') {
      throw new Error('This domain is not authorized for Google sign-in. Please contact support.');
    } else if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Google sign-in is not enabled. Please contact support.');
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your internet connection.');
    } else {
      throw new Error(`Google sign-in failed: ${error.message}`);
    }
  }
};

export const signOutFromGoogle = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Google sign-out error:', error);
    throw new Error('Sign-out failed');
  }
};
