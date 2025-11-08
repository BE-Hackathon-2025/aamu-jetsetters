// Authentication service with predefined users and 2FA codes for admin side
export interface User {
  id: string;
  email: string;
  username: string;
  password: string;
  phoneNumber: string;
  isVerified: boolean;
}

interface TwoFactorCode {
  email: string;
  code: string;
  expiresAt: number;
}

// Database of admin users
const users: User[] = [
  {
    id: '1',
    email: 'john@example.com',
    username: 'johndoe',
    password: 'password123',
    phoneNumber: '+1234567890',
    isVerified: true,
  },
  {
    id: '2',
    email: 'jane@example.com',
    username: 'janedoe',
    password: 'password123',
    phoneNumber: '+1987654321',
    isVerified: true,
  },
];

const twoFactorCodes: TwoFactorCode[] = [];

// Generates a random 6-digit code
const generateCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Authentication Service
export const authService = {
  userExists: (emailOrUsername: string): boolean => {
    return users.some(
      (user) =>
        user.email.toLowerCase() === emailOrUsername.toLowerCase() ||
        user.username.toLowerCase() === emailOrUsername.toLowerCase()
    );
  },

  signup: (
    email: string,
    username: string,
    password: string,
    phoneNumber: string
  ): { success: boolean; message: string; code?: string } => {
    if (authService.userExists(email) || authService.userExists(username)) {
      return {
        success: false,
        message: 'User with this email or username already exists',
      };
    }

    const code = generateCode();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    twoFactorCodes.push({ email, code, expiresAt });


    const pendingUser: User = {
      id: (users.length + 1).toString(),
      email,
      username,
      password,
      phoneNumber,
      isVerified: false,
    };

    sessionStorage.setItem('pendingUser', JSON.stringify(pendingUser));

    return {
      success: true,
      message: 'Verification code sent to your phone',
      code,
    };
  },

  verifySignupCode: (email: string, code: string): { success: boolean; message: string } => {
    const codeIndex = twoFactorCodes.findIndex(
      (tc) => tc.email === email && tc.code === code
    );

    if (codeIndex === -1) {
      return { success: false, message: 'Invalid verification code' };
    }

    const storedCode = twoFactorCodes[codeIndex];

    if (Date.now() > storedCode.expiresAt) {
      twoFactorCodes.splice(codeIndex, 1);
      return { success: false, message: 'Verification code expired' };
    }

    const pendingUserJson = sessionStorage.getItem('pendingUser');
    if (pendingUserJson) {
      const pendingUser = JSON.parse(pendingUserJson) as User;
      pendingUser.isVerified = true;
      users.push(pendingUser);
      sessionStorage.removeItem('pendingUser');

    }

    twoFactorCodes.splice(codeIndex, 1);

    return { success: true, message: 'Account verified successfully' };
  },

  login: (
    emailOrUsername: string,
    password: string
  ): { success: boolean; message: string; code?: string; user?: User } => {
    const user = users.find(
      (u) =>
        (u.email.toLowerCase() === emailOrUsername.toLowerCase() ||
          u.username.toLowerCase() === emailOrUsername.toLowerCase()) &&
        u.password === password
    );

    if (!user) {
      return { success: false, message: 'Invalid credentials' };
    }

    if (!user.isVerified) {
      return { success: false, message: 'Account not verified' };
    }

    const code = generateCode();
    const expiresAt = Date.now() + 5 * 60 * 1000; 

    twoFactorCodes.push({ email: user.email, code, expiresAt });


    return {
      success: true,
      message: 'Verification code sent to your phone',
      code, 
      user,
    };
  },

  verifyLoginCode: (email: string, code: string): { success: boolean; message: string } => {
    const codeIndex = twoFactorCodes.findIndex(
      (tc) => tc.email === email && tc.code === code
    );

    if (codeIndex === -1) {
      return { success: false, message: 'Invalid verification code' };
    }

    const storedCode = twoFactorCodes[codeIndex];

    if (Date.now() > storedCode.expiresAt) {
      twoFactorCodes.splice(codeIndex, 1);
      return { success: false, message: 'Verification code expired' };
    }

    twoFactorCodes.splice(codeIndex, 1);


    return { success: true, message: 'Login successful' };
  },

  resendCode: (email: string): { success: boolean; message: string; code?: string } => {
    const oldCodeIndex = twoFactorCodes.findIndex((tc) => tc.email === email);
    if (oldCodeIndex !== -1) {
      twoFactorCodes.splice(oldCodeIndex, 1);
    }

    const code = generateCode();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    twoFactorCodes.push({ email, code, expiresAt });


    return {
      success: true,
      message: 'New verification code sent',
      code, 
    };
  },

  getAllUsers: (): User[] => {
    return users;
  },
};

