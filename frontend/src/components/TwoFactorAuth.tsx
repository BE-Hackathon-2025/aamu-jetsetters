import { useState, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { adminFirebaseAuth } from '../services/adminFirebaseAuth';
import { auth } from '../config/firebase';
import type { MultiFactorResolver } from 'firebase/auth';
import './TwoFactorAuth.css';

interface TwoFactorAuthProps {
  email: string;
  flowType: 'signup' | 'login';
  verificationId?: string;
  resolver?: MultiFactorResolver;
  userId?: string;
  onVerifySuccess?: () => void;
  onResendCode?: () => void;
}

function TwoFactorAuth({ 
  email: _email, // Required prop but not used in component
  flowType, 
  verificationId: initialVerificationId, 
  resolver, 
  userId: _userId, // Required prop but not used in component
  onVerifySuccess, 
  onResendCode 
}: TwoFactorAuthProps) {
  const [code, setCode] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationId, setVerificationId] = useState(initialVerificationId || '');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {

    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {

    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    
    if (!/^\d+$/.test(pastedData)) return;

    const newCode = [...code];
    pastedData.split('').forEach((digit, index) => {
      if (index < 6) {
        newCode[index] = digit;
      }
    });
    setCode(newCode);

    // Focus the next empty input or the last one
    const nextEmptyIndex = newCode.findIndex(val => !val);
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const fullCode = code.join('');
    
    if (fullCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    if (!verificationId) {
      setError('Verification ID is missing. Please try again.');
      return;
    }

    setLoading(true);

    let result;
    
    if (flowType === 'signup') {
      // Complete MFA enrollment
      const user = auth.currentUser;
      if (!user) {
        setError('User session expired. Please sign up again.');
        setLoading(false);
        return;
      }
      
      result = await adminFirebaseAuth.completeMFAEnrollment(
        user,
        verificationId,
        fullCode,
        'Phone number'
      );
    } else {
      // Complete MFA sign-in
      if (!resolver) {
        setError('Authentication session expired. Please try again.');
        setLoading(false);
        return;
      }
      
      result = await adminFirebaseAuth.completeMFASignIn(
        resolver,
        verificationId,
        fullCode
      );
    }

    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Verification failed. Please check your code.');
      setCode(Array(6).fill(''));
      inputRefs.current[0]?.focus();
      return;
    }

    setSuccess(flowType === 'signup' ? 'Account verified successfully!' : 'Login successful!');
    
    // Delay to show success message
    setTimeout(() => {
      if (onVerifySuccess) {
        onVerifySuccess();
      }
    }, 1000);
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');
    setCode(Array(6).fill(''));
    setLoading(true);

    if (flowType === 'login' && resolver) {
      // Resend MFA verification for login
      const result = await adminFirebaseAuth.sendMFAVerification(
        resolver,
        'recaptcha-container-2fa',
        0
      );
      
      setLoading(false);
      
      if (result.success && result.verificationId) {
        setVerificationId(result.verificationId);
        setSuccess('New code sent to your phone!');
      } else {
        setError(result.error || 'Failed to resend code.');
      }
    } else {
      // For signup flow, user needs to restart
      setLoading(false);
      setError('Please restart the signup process to receive a new code.');
    }
    
    inputRefs.current[0]?.focus();
    
    if (onResendCode) {
      onResendCode();
    }
  };

  return (
    <div className="twofa-container">
      <div className="twofa-card">
        <h1 className="twofa-title">Two-Factor Authentication</h1>
        <p className="twofa-subtitle">
          Enter the 6-digit code sent to your phone number via SMS.
        </p>
        
        {/* Hidden reCAPTCHA container for resend */}
        <div id="recaptcha-container-2fa" style={{ display: 'none' }}></div>
        
        <form onSubmit={handleSubmit} className="twofa-form">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          <div className="code-inputs" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className="code-input"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                autoFocus={index === 0}
              />
            ))}
          </div>

          <button 
            type="submit" 
            className="submit-button"
            disabled={code.join('').length !== 6 || loading}
          >
            {loading ? 'Verifying...' : 'Submit Code'}
          </button>

          <button 
            type="button" 
            className="resend-button"
            onClick={handleResend}
            disabled={loading}
          >
            Resend Code
          </button>
        </form>
      </div>
    </div>
  );
}

export default TwoFactorAuth;

