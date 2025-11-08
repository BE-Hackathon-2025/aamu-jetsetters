import { useState } from 'react';
import { firebaseAuthService } from '../../services/firebaseAuth';
import sentraLogo from '../../assets/sentra_logo.png';
import './CommunitySignup.css';

interface CommunitySignupProps {
  onSignupSuccess?: () => void;
  onNavigateToLogin?: () => void;
}

function CommunitySignup({ onSignupSuccess, onNavigateToLogin }: CommunitySignupProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const result = await firebaseAuthService.signupWithEmail(email, password);

    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Signup failed. Please try again.');
      return;
    }

    if (onSignupSuccess) {
      onSignupSuccess();
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    setLoading(true);

    const result = await firebaseAuthService.signInWithGoogle();

    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Google sign-in failed. Please try again.');
      return;
    }

    if (onSignupSuccess) {
      onSignupSuccess();
    }
  };


  return (
    <div className="community-signup-container">
      <div className="community-signup-card">
        <div className="logo-section">
          <img src={sentraLogo} alt="Sentra" className="auth-logo" />
        </div>

        <h1 className="signup-title">Create Account</h1>
        <p className="signup-subtitle">Join to monitor your community's water quality</p>

        {error && <div className="error-message">{error}</div>}

        {/* Social Auth Buttons */}
        <div className="social-auth-buttons">
          <button
            type="button"
            className="social-btn google-btn"
            onClick={handleGoogleSignup}
            disabled={loading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        <div className="divider">
          <span>or sign up with email</span>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailSignup} className="signup-form">
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
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <div className="navigation-links">
            <span className="nav-text">Already have an account?</span>
            <button
              type="button"
              className="nav-link"
              onClick={onNavigateToLogin}
              disabled={loading}
            >
              Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CommunitySignup;

