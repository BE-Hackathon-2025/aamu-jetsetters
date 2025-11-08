import { useState, useRef, useEffect } from 'react';
import Joyride, { type CallBackProps, STATUS } from 'react-joyride';
import StatusCard from '../../components/community/StatusCard';
import HealthAdvisory from '../../components/community/HealthAdvisory';
import CommunityActions from '../../components/community/CommunityActions';
import BottomNav from '../../components/community/BottomNav';
import ReportIssueForm from '../../components/community/ReportIssueForm';
import FAQModal from '../../components/community/FAQModal';
import HistoricalTrends from '../../components/common/HistoricalTrends';
import MetricsPage from './MetricsPage';
import ProfilePage from './ProfilePage';
import NotificationsPage from './NotificationsPage';
import { firebaseAuthService } from '../../services/firebaseAuth';
import { notificationsApi } from '../../services/notificationsApi';
import { useWaterData } from '../../hooks/useWaterData';
import { useHistoricalData } from '../../hooks/useHistoricalData';
import { useBrowserNotifications } from '../../hooks/useBrowserNotifications';
import { useTour } from '../../hooks/useTour';
import { tourSteps } from '../../config/tourSteps';
import { mapRiskLevelToFrontend, formatDate } from '../../utils/dataMapper';
import sentraIcon from '../../assets/sentra_icon.png';
import '../../components/community/TourStyles.css';
import './WaterSafetyOverview.css';

interface WaterSafetyOverviewProps {
  onLogout?: () => void;
}

function WaterSafetyOverview({ onLogout }: WaterSafetyOverviewProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'metrics' | 'profile' | 'notifications'>('home');
  const [showReportForm, setShowReportForm] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(7);
  const scrollPositionRef = useRef<number>(0);
  const isChangingRangeRef = useRef<boolean>(false);
  const [hasNotification, setHasNotification] = useState(false);

  const { data: waterData, loading, error } = useWaterData();
  const { chemicalTrends, loading: historyLoading } = useHistoricalData(timeRange);
  const { run, stopTour, startTour } = useTour();

  useBrowserNotifications(true);

  useEffect(() => {
    const user = firebaseAuthService.getCurrentUser();
    if (user && user.email && user.uid) {
      notificationsApi.registerEmail(user.email, user.uid).catch(() => {
      });
    }
  }, []);

  useEffect(() => {
    const handleNavigateToNotifications = () => {
      setActiveTab('notifications');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('navigateToNotifications', handleNavigateToNotifications);

    return () => {
      window.removeEventListener('navigateToNotifications', handleNavigateToNotifications);
    };
  }, []);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const count = await notificationsApi.getUnreadCount();
        setHasNotification(count > 0);
      } catch {
        // Silently handle errors
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, []);

  const pHTrendData = chemicalTrends.pH?.map((point) => ({
    date: point.date,
    value: point.value,
  })) || [];

  useEffect(() => {
    if (isChangingRangeRef.current && !historyLoading) {
      const restoreScroll = () => {
        const targetScroll = scrollPositionRef.current;
        window.scrollTo(0, targetScroll);
        
        setTimeout(() => {
          if (Math.abs(window.scrollY - targetScroll) > 5) {
            window.scrollTo(0, targetScroll);
          }
          isChangingRangeRef.current = false;
        }, 50);
      };

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(restoreScroll);
        });
      });
    }
  }, [historyLoading, pHTrendData]);

  const handleViewDetails = () => {
    setActiveTab('metrics');
  };

  const handleReportIssue = () => {
    setShowReportForm(true);
  };

  const handleCloseReportForm = () => {
    setShowReportForm(false);
  };

  const handleSubmitIssue = () => {
    setShowReportForm(false);
  };

  const handleViewFAQ = () => {
    setShowFAQ(true);
  };

  const handleCloseFAQ = () => {
    setShowFAQ(false);
  };

  const handleNavigate = (tab: 'home' | 'metrics' | 'profile' | 'notifications') => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTimeRangeChange = (range: '7days' | '30days' | '90days') => {
    // Save current scroll position
    scrollPositionRef.current = window.pageYOffset || document.documentElement.scrollTop;
    isChangingRangeRef.current = true;
    
    const rangeMap = {
      '7days': 7,
      '30days': 30,
      '90days': 90,
    };
    
    setTimeRange(rangeMap[range] as 7 | 30 | 90);
  };

  const handleLogoutClick = async () => {
    await firebaseAuthService.logout();
    if (onLogout) {
      onLogout();
    }
  };

  const handleNotificationClick = () => {
    setActiveTab('notifications');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMarkAllRead = () => {
    setHasNotification(false);
  };

  const handleTourCallback = (data: CallBackProps) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      stopTour();
    }
  };

  const handleStartTour = () => {
    if (activeTab !== 'home') {
      setActiveTab('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        startTour();
      }, 300);
    } else {
      startTour();
    }
  };

  return (
    <div className="water-safety-page">
      <Joyride
        steps={tourSteps}
        run={run}
        continuous={true}
        showProgress={true}
        showSkipButton={true}
        callback={handleTourCallback}
        styles={{
          options: {
            primaryColor: '#00d4ff',
            zIndex: 10000,
          },
        }}
        locale={{
          back: 'Back',
          close: 'Close',
          last: 'Finish',
          next: 'Next',
          skip: 'Skip Tour',
        }}
      />
      <header className="mobile-header">
        <div className="header-left">
          <div className="header-icon">
            <img src={sentraIcon} alt="Sentra" className="header-logo" />
          </div>
          
          <nav className="header-nav" data-tour="nav-tabs">
            <button
              className={`header-nav-item ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => handleNavigate('home')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span>Home</span>
            </button>
            <button
              className={`header-nav-item ${activeTab === 'metrics' ? 'active' : ''}`}
              onClick={() => handleNavigate('metrics')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              <span>Metrics</span>
            </button>
            <button
              className={`header-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => handleNavigate('profile')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Profile</span>
            </button>
          </nav>
        </div>

        <button className="notification-bell" onClick={handleNotificationClick} data-tour="notifications">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {hasNotification && <span className="notification-badge"></span>}
        </button>
      </header>


      <main className="page-content">
        {activeTab === 'home' && (
          <>
            {loading ? (
              <div className="content-section">
                <div style={{ textAlign: 'center', padding: '2rem', color: '#a0a0a0' }}>
                  Loading water status...
                </div>
              </div>
            ) : error ? (
              <div className="content-section">
                <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}>
                  Error: {error}
                </div>
              </div>
            ) : waterData ? (
          <>
            <StatusCard
                  riskLevel={mapRiskLevelToFrontend(waterData.overallRisk.level)}
                  description={waterData.overallRisk.description}
            />

            <div className="content-section">
              <HealthAdvisory
                    advisory={waterData.healthAdvisory.message}
                    updatedAt={formatDate(waterData.healthAdvisory.updatedAt)}
                onViewDetails={handleViewDetails}
              />
            </div>

            <div className="content-section">
              <HistoricalTrends
                title="Water Quality Trend (pH Level)"
                    data={pHTrendData}
                    timeRange={`${timeRange}days` as '7days' | '30days' | '90days'}
                unit="pH"
                variant="community"
                    onTimeRangeChange={handleTimeRangeChange}
              />
            </div>
              </>
            ) : null}

            <div className="content-section">
              <CommunityActions
                onReportIssue={handleReportIssue}
                onViewFAQ={handleViewFAQ}
              />
            </div>
          </>
        )}

        {showReportForm && (
          <ReportIssueForm onClose={handleCloseReportForm} onSubmit={handleSubmitIssue} />
        )}

        {showFAQ && <FAQModal onClose={handleCloseFAQ} />}

        {activeTab === 'metrics' && <MetricsPage />}

        {activeTab === 'notifications' && <NotificationsPage onMarkAllRead={handleMarkAllRead} />}

        {activeTab === 'profile' && <ProfilePage onLogout={handleLogoutClick} onStartTour={handleStartTour} />}
      </main>

      <BottomNav activeTab={activeTab} onNavigate={handleNavigate} />
    </div>
  );
}

export default WaterSafetyOverview;

