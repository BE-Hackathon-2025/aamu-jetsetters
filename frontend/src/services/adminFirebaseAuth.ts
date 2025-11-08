import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  RecaptchaVerifier,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  multiFactor,
  getMultiFactorResolver,
  signOut,
} from 'firebase/auth';
import type { 
  User, 
  UserCredential, 
  MultiFactorError, 
  MultiFactorResolver,
  MultiFactorSession 
} from 'firebase/auth';
import { auth } from '../config/firebase';

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
  requiresMFA?: boolean;
  resolver?: MultiFactorResolver;
}

export interface MFAEnrollResult {
  success: boolean;
  error?: string;
  verificationId?: string;
}

// reCAPTCHA verifier instance
let recaptchaVerifier: RecaptchaVerifier | null = null;

export const adminFirebaseAuth = {
  // Initialize reCAPTCHA (call this before MFA operations)
  initRecaptcha: (containerId: string, invisible: boolean = false): RecaptchaVerifier => {
    if (recaptchaVerifier) {
      recaptchaVerifier.clear();
    }

    recaptchaVerifier = new RecaptchaVerifier(
      auth,
      containerId,
      {
        size: invisible ? 'invisible' : 'normal',
        callback: () => {
        },
        'expired-callback': () => {
        },
      }
    );

    return recaptchaVerifier;
  },

  // Email/Password signup
  signupWithEmail: async (
    email: string,
    password: string
  ): Promise<AuthResult> => {
    try {
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      return { success: true, user: userCredential.user };
    } catch (error: any) {
      console.error('Admin signup error:', error);
      return { success: false, error: error.message };
    }
  },

  // Email/Password login (first factor)
  loginWithEmail: async (
    email: string,
    password: string
  ): Promise<AuthResult> => {
    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      
      // Check if user has MFA enrolled
      const mfaUser = multiFactor(userCredential.user);
      if (mfaUser.enrolledFactors.length > 0) {
      }
      
      return { success: true, user: userCredential.user };
    } catch (error: any) {
      console.error('Admin login error:', error);
      
      // Check if MFA is required
      if (error.code === 'auth/multi-factor-auth-required') {
        const resolver = getMultiFactorResolver(auth, error as MultiFactorError);
        return { 
          success: false, 
          requiresMFA: true, 
          resolver,
          error: 'Multi-factor authentication required' 
        };
      }
      
      return { success: false, error: error.message };
    }
  },

  // Enroll phone number as second factor
  enrollMFA: async (
    user: User,
    phoneNumber: string,
    recaptchaContainerId: string
  ): Promise<MFAEnrollResult> => {
    try {
      // Initialize reCAPTCHA if not already done
      if (!recaptchaVerifier) {
        recaptchaVerifier = adminFirebaseAuth.initRecaptcha(recaptchaContainerId, true);
      }

      // Get multi-factor session
      const multiFactorSession: MultiFactorSession = await multiFactor(user).getSession();

      // Send verification code
      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const phoneInfoOptions = {
        phoneNumber,
        session: multiFactorSession,
      };

      const verificationId = await phoneAuthProvider.verifyPhoneNumber(
        phoneInfoOptions,
        recaptchaVerifier
      );

      return { success: true, verificationId };
    } catch (error: any) {
      console.error('MFA enrollment error:', error);
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
      }
      return { success: false, error: error.message };
    }
  },

  // Complete MFA enrollment with verification code
  completeMFAEnrollment: async (
    user: User,
    verificationId: string,
    verificationCode: string,
    displayName: string = 'Phone number'
  ): Promise<AuthResult> => {
    try {
      const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);

      await multiFactor(user).enroll(multiFactorAssertion, displayName);
      
      return { success: true, user };
    } catch (error: any) {
      console.error('MFA enrollment completion error:', error);
      return { success: false, error: error.message };
    }
  },

  // Send MFA verification code during sign-in
  sendMFAVerification: async (
    resolver: MultiFactorResolver,
    recaptchaContainerId: string,
    hintIndex: number = 0
  ): Promise<MFAEnrollResult> => {
    try {
      // Initialize reCAPTCHA if not already done
      if (!recaptchaVerifier) {
        recaptchaVerifier = adminFirebaseAuth.initRecaptcha(recaptchaContainerId, true);
      }

      const phoneInfoOptions = {
        multiFactorHint: resolver.hints[hintIndex],
        session: resolver.session,
      };

      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneAuthProvider.verifyPhoneNumber(
        phoneInfoOptions,
        recaptchaVerifier
      );

      return { success: true, verificationId };
    } catch (error: any) {
      console.error('MFA verification send error:', error);
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
      }
      return { success: false, error: error.message };
    }
  },

  // Complete MFA sign-in with verification code
  completeMFASignIn: async (
    resolver: MultiFactorResolver,
    verificationId: string,
    verificationCode: string
  ): Promise<AuthResult> => {
    try {
      const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);

      const userCredential = await resolver.resolveSignIn(multiFactorAssertion);
      
      return { success: true, user: userCredential.user };
    } catch (error: any) {
      console.error('MFA sign-in completion error:', error);
      return { success: false, error: error.message };
    }
  },

  // Sign out
  logout: async (): Promise<AuthResult> => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error: any) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get current user
  getCurrentUser: (): User | null => {
    return auth.currentUser;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return auth.currentUser !== null;
  },

  // Check if user has MFA enrolled
  hasMFAEnrolled: (user: User): boolean => {
    return multiFactor(user).enrolledFactors.length > 0;
  },

  // Get enrolled MFA factors
  getEnrolledFactors: (user: User) => {
    return multiFactor(user).enrolledFactors;
  },

  // Clear reCAPTCHA
  clearRecaptcha: () => {
    if (recaptchaVerifier) {
      recaptchaVerifier.clear();
      recaptchaVerifier = null;
    }
  },
};

