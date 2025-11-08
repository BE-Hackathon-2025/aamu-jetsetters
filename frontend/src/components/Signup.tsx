import { useState, useEffect } from 'react';
import { adminFirebaseAuth } from '../services/adminFirebaseAuth';
import sentraLogo from '../assets/sentra_logo.png';
import './Signup.css';

interface SignupProps {
  onSignupSuccess?: (email: string, verificationId?: string, userId?: string) => void;
  onNavigateToLogin?: () => void;
}

function Signup({ onSignupSuccess, onNavigateToLogin }: SignupProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize invisible reCAPTCHA
    adminFirebaseAuth.initRecaptcha('recaptcha-container-signup', true);
    
    return () => {
      adminFirebaseAuth.clearRecaptcha();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!phoneNumber.match(/^\+[1-9]\d{1,14}$/)) {
      setError('Please enter a valid phone number (e.g., +1234567890)');
      return;
    }

    setLoading(true);

    // Step 1: Create user account
    const signupResult = await adminFirebaseAuth.signupWithEmail(email, password);

    if (!signupResult.success || !signupResult.user) {
      setLoading(false);
      setError(signupResult.error || 'Signup failed. Please try again.');
      return;
    }

    // Step 2: Enroll MFA with phone number
    const enrollResult = await adminFirebaseAuth.enrollMFA(
      signupResult.user,
      phoneNumber,
      'recaptcha-container-signup'
    );

    setLoading(false);

    if (!enrollResult.success) {
      setError(enrollResult.error || 'Failed to send verification code. Please try again.');
      return;
    }

    
    if (onSignupSuccess && enrollResult.verificationId) {
      onSignupSuccess(email, enrollResult.verificationId, signupResult.user.uid);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="logo-section">
          <img src={sentraLogo} alt="Sentra" className="auth-logo" />
        </div>
        
        <h1 className="signup-title">Create Account</h1>
        <p className="signup-subtitle">Secure your account with SMS verification</p>
        
        {/* Hidden reCAPTCHA container */}
        <div id="recaptcha-container-signup"></div>

        <form onSubmit={handleSubmit} className="signup-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="form-input"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phoneNumber" className="form-label">
              Phone Number (for SMS verification)
            </label>
            <input
              type="tel"
              id="phoneNumber"
              className="form-input"
              placeholder="+1234567890"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              disabled={loading}
            />
            <small className="input-hint">Include country code (e.g., +1 for US)</small>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="form-input"
              placeholder="Create a password (min. 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              className="form-input"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="signup-button" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>

          <div className="navigation-links">
            <span className="nav-text">Already have an account?</span>
            <button 
              type="button" 
              className="nav-link"
              onClick={onNavigateToLogin}
              disabled={loading}
            >
              Log In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Signup;

