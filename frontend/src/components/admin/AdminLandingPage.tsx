import sentraLogo from '../../assets/sentra_logo.png';
import './AdminLandingPage.css';

interface AdminLandingPageProps {
  onEnterAdmin: () => void;
}

function AdminLandingPage({ onEnterAdmin }: AdminLandingPageProps) {
  return (
    <div className="admin-landing-page">
      <div className="landing-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <div className="landing-content">
        <header className="landing-header">
          <img src={sentraLogo} alt="Sentra" className="landing-logo" />
        </header>

        <main className="landing-main">
          <div className="hero-section">
            <h1 className="hero-title">
              Intelligent Water Quality
              <span className="gradient-text"> Monitoring</span>
            </h1>
            <p className="hero-subtitle">
              AI-powered anomaly detection and predictive analytics for municipal water infrastructure
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <h3>Real-Time Monitoring</h3>
              <p>24/7 surveillance of water quality parameters across your entire distribution network</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <h3>Predictive Analytics</h3>
              <p>ML algorithms detect anomalies before they become critical infrastructure failures</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3>Cybersecurity</h3>
              <p>Protect critical OT/IT infrastructure from cyber threats with advanced threat detection</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <h3>Smart Diagnostics</h3>
              <p>AI-powered forensic analysis and root cause identification for rapid incident response</p>
            </div>
          </div>

          <div className="stats-section">
            <div className="stat-item">
              <div className="stat-number">99.1%</div>
              <div className="stat-label">Detection Accuracy</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">145+</div>
              <div className="stat-label">Monitored Parameters</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">24/7</div>
              <div className="stat-label">System Uptime</div>
            </div>
          </div>

          <button className="enter-admin-btn" onClick={onEnterAdmin}>
            <span>Enter Operator Dashboard</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>

          <p className="security-notice">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Secure authentication required
          </p>
        </main>

        <footer className="landing-footer">
          <p>© 2025 Sentra. Protecting municipal water infrastructure with AI.</p>
        </footer>
      </div>
    </div>
  );
}

export default AdminLandingPage;

