import { useState, useEffect } from 'react';
import { adminFirebaseAuth } from '../services/adminFirebaseAuth';
import type { MultiFactorResolver } from 'firebase/auth';
import sentraLogo from '../assets/sentra_logo.png';
import './Login.css';

interface LoginProps {
  onLoginSuccess?: (email: string, resolver?: MultiFactorResolver) => void;
  onNavigateToSignup?: () => void;
}

function Login({ onLoginSuccess, onNavigateToSignup }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize invisible reCAPTCHA
    adminFirebaseAuth.initRecaptcha('recaptcha-container-login', true);
    
    return () => {
      adminFirebaseAuth.clearRecaptcha();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await adminFirebaseAuth.loginWithEmail(email, password);

    setLoading(false);

    if (!result.success) {
      if (result.requiresMFA && result.resolver) {
        // MFA is required, proceed to 2FA screen
        if (onLoginSuccess) {
          onLoginSuccess(email, result.resolver);
        }
      } else {
        setError(result.error || 'Login failed. Please try again.');
      }
      return;
    }

    // No MFA enrolled, login successful
    if (onLoginSuccess && result.user) {
      onLoginSuccess(result.user.email || email);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo-section">
          <img src={sentraLogo} alt="Sentra" className="auth-logo" />
        </div>
        
        <h1 className="login-title">Welcome</h1>
        <p className="login-subtitle">Log in to your account</p>
        
        {/* Hidden reCAPTCHA container */}
        <div id="recaptcha-container-login"></div>

        <form onSubmit={handleSubmit} className="login-form">
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
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Signing in...' : 'Log In'}
          </button>

          <a href="#" className="forgot-password-link">
            Forgot password?
          </a>

          <div className="navigation-links">
            <span className="nav-text">Don't have an account?</span>
            <button 
              type="button" 
              className="nav-link"
              onClick={onNavigateToSignup}
              disabled={loading}
            >
              Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;

