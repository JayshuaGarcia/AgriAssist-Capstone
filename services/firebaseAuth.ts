import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
  verifyPasswordResetCode
} from 'firebase/auth';
import { auth, FIREBASE_API_KEY } from '../lib/firebase';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName?: string;
}

export class FirebaseAuthService {
  private static readonly REST_BASE_URL = 'https://identitytoolkit.googleapis.com/v1';
  private static readonly FALLBACK_SESSION_KEY = '@agriassist/firebase-auth-session';

  private static fallbackSession:
    | {
        uid: string;
        email: string;
        displayName?: string;
        idToken: string;
        refreshToken: string;
        expiresAt: number;
      }
    | null = null;

  private static fallbackListeners = new Set<(user: any) => void>();
  private static fallbackLoaded = false;
  private static fallbackLoadPromise: Promise<void> | null = null;

  // --- Shared helpers ----------------------------------------------------

  private static ensureFallbackLoaded(): Promise<void> {
    if (this.fallbackLoaded) {
      return Promise.resolve();
    }
    if (!this.fallbackLoadPromise) {
      this.fallbackLoadPromise = this.loadFallbackSession().finally(() => {
        this.fallbackLoaded = true;
        this.fallbackLoadPromise = null;
      });
    }
    return this.fallbackLoadPromise;
  }

  private static async loadFallbackSession() {
    try {
      const raw = await AsyncStorage.getItem(this.FALLBACK_SESSION_KEY);
      if (!raw) {
        this.fallbackSession = null;
        return;
      }

      const session = JSON.parse(raw);
      if (session?.expiresAt && session.expiresAt > Date.now()) {
        this.fallbackSession = session;
      } else {
        await AsyncStorage.removeItem(this.FALLBACK_SESSION_KEY);
        this.fallbackSession = null;
      }
    } catch (error) {
      console.warn('Failed to load fallback auth session:', error);
      this.fallbackSession = null;
    }
  }

  private static async persistFallbackSession(session: typeof FirebaseAuthService.fallbackSession) {
    this.fallbackSession = session;
    if (!session) {
      await AsyncStorage.removeItem(this.FALLBACK_SESSION_KEY);
      this.notifyFallbackListeners(null);
      return;
    }
    await AsyncStorage.setItem(this.FALLBACK_SESSION_KEY, JSON.stringify(session));
    this.notifyFallbackListeners(this.buildFallbackUser(session));
  }

  private static notifyFallbackListeners(user: any | null) {
    for (const listener of this.fallbackListeners) {
      try {
        listener(user);
      } catch (listenerError) {
        console.warn('Auth listener threw an error:', listenerError);
      }
    }
  }

  private static buildFallbackUser(session: NonNullable<typeof FirebaseAuthService.fallbackSession>) {
    return {
      uid: session.uid,
      email: session.email,
      displayName: session.displayName ?? null,
      refreshToken: session.refreshToken,
      getIdToken: async () => session.idToken,
      toJSON: () => ({
        uid: session.uid,
        email: session.email,
        displayName: session.displayName ?? null
      })
    };
  }

  private static async restRequest(endpoint: string, body: Record<string, any>): Promise<any> {
    const url = `${this.REST_BASE_URL}/${endpoint}?key=${FIREBASE_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    let data: any = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const apiMessage: string | undefined = data?.error?.message;
      const error: any = new Error(apiMessage || 'Firebase REST request failed');
      const mappedCode = this.mapRestErrorCode(apiMessage);
      if (mappedCode) error.code = mappedCode;
      throw error;
    }

    return data;
  }

  private static mapRestErrorCode(apiMessage?: string): string | undefined {
    switch (apiMessage) {
      case 'EMAIL_NOT_FOUND':
        return 'auth/user-not-found';
      case 'INVALID_PASSWORD':
        return 'auth/wrong-password';
      case 'INVALID_LOGIN_CREDENTIALS':
        return 'auth/invalid-login-credentials';
      case 'USER_DISABLED':
        return 'auth/user-disabled';
      case 'EMAIL_EXISTS':
        return 'auth/email-already-in-use';
      case 'INVALID_EMAIL':
        return 'auth/invalid-email';
      case 'OPERATION_NOT_ALLOWED':
        return 'auth/operation-not-allowed';
      case 'WEAK_PASSWORD : Password should be at least 6 characters':
      case 'WEAK_PASSWORD':
        return 'auth/weak-password';
      case 'TOO_MANY_ATTEMPTS_TRY_LATER':
        return 'auth/too-many-requests';
      case 'INVALID_OOB_CODE':
        return 'auth/invalid-action-code';
      case 'EXPIRED_OOB_CODE':
        return 'auth/expired-action-code';
      default:
        return undefined;
    }
  }

  private static async restSignIn(email: string, password: string) {
    const data = await this.restRequest('accounts:signInWithPassword', {
      email,
      password,
      returnSecureToken: true
    });

    const expiresInSeconds = Number.parseInt(data?.expiresIn ?? '0', 10);
    const session = {
      uid: data.localId,
      email: data.email,
      displayName: data.displayName,
      idToken: data.idToken,
      refreshToken: data.refreshToken,
      expiresAt: Date.now() + expiresInSeconds * 1000
    };
    await this.persistFallbackSession(session);
    return {
      user: this.buildFallbackUser(session)
    };
  }

  private static async restSignUp(email: string, password: string, displayName?: string) {
    const data = await this.restRequest('accounts:signUp', {
      email,
      password,
      returnSecureToken: true
    });

    const expiresInSeconds = Number.parseInt(data?.expiresIn ?? '0', 10);
    const session = {
      uid: data.localId,
      email: data.email,
      displayName: data.displayName ?? displayName,
      idToken: data.idToken,
      refreshToken: data.refreshToken,
      expiresAt: Date.now() + expiresInSeconds * 1000
    };

    if (displayName) {
      try {
        await this.restRequest('accounts:update', {
          idToken: session.idToken,
          displayName,
          returnSecureToken: true
        });
        session.displayName = displayName;
      } catch (profileError) {
        console.warn('Failed to set display name via REST:', profileError);
      }
    }

    await this.persistFallbackSession(session);
    return {
      user: this.buildFallbackUser(session)
    };
  }

  private static async restChangePassword(currentPassword: string, newPassword: string) {
    await this.ensureFallbackLoaded();
    if (!this.fallbackSession) {
      throw new Error('Not authenticated');
    }

    // Verify current password first
    if (currentPassword) {
      await this.restSignIn(this.fallbackSession.email, currentPassword);
    }

    const data = await this.restRequest('accounts:update', {
      idToken: this.fallbackSession.idToken,
      password: newPassword,
      returnSecureToken: true
    });

    const expiresInSeconds = Number.parseInt(data?.expiresIn ?? '0', 10);
    const updatedSession = {
      uid: data.localId ?? this.fallbackSession.uid,
      email: data.email ?? this.fallbackSession.email,
      displayName: data.displayName ?? this.fallbackSession.displayName,
      idToken: data.idToken ?? this.fallbackSession.idToken,
      refreshToken: data.refreshToken ?? this.fallbackSession.refreshToken,
      expiresAt: Date.now() + expiresInSeconds * 1000
    };

    await this.persistFallbackSession(updatedSession);
  }

  // Sign up with email and password
  static async signUp(email: string, password: string): Promise<any> {
    try {
      console.log('FirebaseAuthService.signUp called with:', email);
      console.log('Auth object:', auth);
      
      if (auth) {
        const anyAuth: any = auth as any;
        if (typeof anyAuth._getRecaptchaConfig === 'undefined') {
          anyAuth._getRecaptchaConfig = () => null;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('Sign up successful via SDK:', userCredential);
        return userCredential;
      }

      console.log('⚠️ Firebase Auth SDK unavailable, falling back to REST sign up');
      const restCredential = await this.restSignUp(email, password);
      console.log('Sign up successful via REST fallback:', restCredential);
      return restCredential;
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(this.getErrorMessage(error.code) || error.message || 'Signup failed');
    }
  }

  // Verify password reset code (oobCode) and return email
  static async verifyResetCode(oobCode: string): Promise<string> {
    try {
      if (auth) {
        const email = await verifyPasswordResetCode(auth, oobCode);
        return email;
      }

      const data = await this.restRequest('accounts:resetPassword', {
        oobCode
      });
      return data?.email;
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error.code) || 'Invalid or expired reset link');
    }
  }

  // Confirm password reset with code and new password
  static async confirmResetPassword(oobCode: string, newPassword: string): Promise<void> {
    try {
      if (auth) {
        await confirmPasswordReset(auth, oobCode, newPassword);
        return;
      }

      await this.restRequest('accounts:resetPassword', {
        oobCode,
        newPassword
      });
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error.code) || 'Failed to reset password');
    }
  }

  // Sign in with email and password
  static async signIn(email: string, password: string): Promise<any> {
    try {
      console.log('FirebaseAuthService.signIn called with:', email);
      console.log('Auth object:', auth);
      
      if (auth) {
        const anyAuth: any = auth as any;
        if (typeof anyAuth._getRecaptchaConfig === 'undefined') {
          anyAuth._getRecaptchaConfig = () => null;
        }
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Sign in successful via SDK:', userCredential);
        return userCredential;
      }

      console.log('⚠️ Firebase Auth SDK unavailable, falling back to REST sign in');
      const restCredential = await this.restSignIn(email, password);
      console.log('Sign in successful via REST fallback:', restCredential);
      return restCredential;
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      // Handle specific reCAPTCHA errors
      if (error.message && error.message.includes('_getRecaptchaConfig')) {
        throw new Error('Authentication service temporarily unavailable. Please try again.');
      }
      
      // Handle specific Firebase Auth errors
      if (error.message && error.message.includes('Cannot read property \'create\' of undefined')) {
        throw new Error('Firebase Auth configuration error. Please contact support.');
      }
      
      throw new Error(this.getErrorMessage(error.code) || error.message || 'Login failed');
    }
  }

  // Sign out
  static async signOut(): Promise<void> {
    try {
      if (auth) {
        await signOut(auth);
        return;
      }

      await this.persistFallbackSession(null);
    } catch (error: any) {
      throw new Error('Failed to sign out');
    }
  }

  // Send password reset email
  static async resetPassword(email: string): Promise<void> {
    try {
      console.log('Sending password reset email to:', email);

      // Handle optional SDK path first (if auth is available)
      if (auth) {
        const anyAuth: any = auth as any;
        if (typeof anyAuth._getRecaptchaConfig === 'undefined') {
          anyAuth._getRecaptchaConfig = () => null;
        }
        try {
          await sendPasswordResetEmail(auth, email, {
            url: 'https://database-agriassist.firebaseapp.com/reset-password.html',
            handleCodeInApp: false,
          } as any);
          console.log('Password reset email sent successfully');
          return;
        } catch (sdkError: any) {
          console.warn('sendPasswordResetEmail failed, falling back to REST:', sdkError?.message || sdkError);
        }
      } else {
        console.warn('Firebase Auth SDK unavailable, using REST password reset flow');
      }

      // REST fallback via Firebase Identity Toolkit
      const resp = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${FIREBASE_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: 'PASSWORD_RESET',
          email,
          continueUrl: 'https://database-agriassist.firebaseapp.com/reset-password.html',
          canHandleCodeInApp: false
        })
      });
      if (!resp.ok) {
        let errorCode = '';
        let errorMessage = `REST password reset failed: ${resp.status}`;
        try {
          const data = await resp.json();
          const apiMessage: string | undefined = data?.error?.message;
          errorMessage = apiMessage || errorMessage;
          switch (apiMessage) {
            case 'EMAIL_NOT_FOUND':
              errorCode = 'auth/user-not-found';
              break;
            case 'INVALID_EMAIL':
              errorCode = 'auth/invalid-email';
              break;
            case 'USER_DISABLED':
              errorCode = 'auth/user-disabled';
              break;
            case 'RESET_PASSWORD_EXCEED_LIMIT':
              errorCode = 'auth/too-many-requests';
              break;
            default:
              errorCode = '';
          }
        } catch {
          // response is not JSON
        }
        const err: any = new Error(errorMessage);
        if (errorCode) err.code = errorCode;
        throw err;
      }
      console.log('Password reset email sent successfully via REST fallback');
    } catch (error: any) {
      console.error('Reset password error:', error);
      throw new Error(this.getErrorMessage(error.code) || error.message || 'Failed to send password reset email');
    }
  }

  // Change current user's password (requires recent login)
  static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (auth) {
      if (!auth.currentUser || !auth.currentUser.email) {
        throw new Error('Not authenticated');
      }
      try {
        const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
        await updatePassword(auth.currentUser, newPassword);
        return;
      } catch (error: any) {
        if (
          error?.code === 'auth/wrong-password' ||
          error?.code === 'auth/invalid-credential' ||
          error?.code === 'auth/invalid-login-credentials'
        ) {
          throw new Error('Current password is incorrect');
        }
        throw new Error(this.getErrorMessage(error.code) || 'Failed to change password');
      }
    }

    try {
      await this.restChangePassword(currentPassword, newPassword);
    } catch (error: any) {
      if (
        error?.code === 'auth/wrong-password' ||
        error?.code === 'auth/invalid-credential' ||
        error?.code === 'auth/invalid-login-credentials'
      ) {
        throw new Error('Current password is incorrect');
      }
      throw new Error(this.getErrorMessage(error.code) || error.message || 'Failed to change password');
    }
  }

  // Update profile display name
  static async updateDisplayName(displayName: string): Promise<void> {
    if (auth) {
      if (!auth.currentUser) throw new Error('Not authenticated');
      try {
        await updateProfile(auth.currentUser, { displayName });
        return;
      } catch (error: any) {
        throw new Error('Failed to update profile');
      }
    }

    await this.ensureFallbackLoaded();
    if (!this.fallbackSession) {
      throw new Error('Not authenticated');
    }

    try {
      const data = await this.restRequest('accounts:update', {
        idToken: this.fallbackSession.idToken,
        displayName,
        returnSecureToken: true
      });

      const expiresInSeconds = Number.parseInt(data?.expiresIn ?? '0', 10);
      const updatedSession = {
        uid: data.localId ?? this.fallbackSession.uid,
        email: data.email ?? this.fallbackSession.email,
        displayName: displayName ?? this.fallbackSession.displayName,
        idToken: data.idToken ?? this.fallbackSession.idToken,
        refreshToken: data.refreshToken ?? this.fallbackSession.refreshToken,
        expiresAt: Date.now() + expiresInSeconds * 1000
      };
      await this.persistFallbackSession(updatedSession);
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error.code) || error.message || 'Failed to update profile');
    }
  }

  // Get current user
  static getCurrentUser(): any {
    if (auth?.currentUser) return auth.currentUser;
    if (this.fallbackSession) {
      return this.buildFallbackUser(this.fallbackSession);
    }
    return null;
  }

  // Listen to auth state changes
  static onAuthStateChanged(callback: (user: any) => void): () => void {
    if (!auth) {
      console.warn('Firebase Auth SDK unavailable; using fallback auth state listener');
      let active = true;
      const listener = (user: any) => {
        if (active) callback(user);
      };

      this.ensureFallbackLoaded().then(() => {
        if (!active) return;
        if (this.fallbackSession) {
          callback(this.buildFallbackUser(this.fallbackSession));
        } else {
          callback(null);
        }
      });

      this.fallbackListeners.add(listener);
      return () => {
        active = false;
        this.fallbackListeners.delete(listener);
      };
    }
    return onAuthStateChanged(auth, callback);
  }

  // Convert Firebase user to our AuthUser interface
  static convertToAuthUser(user: any): AuthUser {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || undefined
    };
  }

  // Get user-friendly error messages
  private static getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists';
      case 'auth/invalid-email':
        return 'Please enter a valid email address';
      case 'auth/operation-not-allowed':
        return 'Email/password accounts are not enabled';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters';
      case 'auth/user-disabled':
        return 'This account has been disabled';
      case 'auth/user-not-found':
        return 'No account found with this email';
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
      case 'auth/invalid-login-credentials':
        return 'Incorrect email or password';
      case 'auth/too-many-requests':
        return 'Too many password reset attempts. Please wait a minute and try again.';
      default:
        return 'An error occurred. Please try again';
    }
  }
} 