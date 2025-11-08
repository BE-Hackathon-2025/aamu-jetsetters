import { useState, useRef, useEffect } from 'react';
import Logo from '../common/Logo';
import './AdminHeader.css';

interface AdminHeaderProps {
  pageTitle: string;
  onLogout: () => void;
  onStartTour?: () => void;
}

function AdminHeader({ pageTitle, onLogout, onStartTour }: AdminHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsDropdownOpen(false);
    onLogout();
  };

  return (
    <header className="admin-header">
      <div className="admin-header-content">
        <div className="admin-header-left">
          <Logo size="medium" showText={false} />
        </div>
        <h1 className="admin-page-title">{pageTitle}</h1>
        <div className="admin-header-right" ref={dropdownRef}>
          <button
            className="user-profile-button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-label="User profile menu"
          >
            <div className="user-profile-icon">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="white"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
          </button>
          
          {isDropdownOpen && (
            <div className="profile-dropdown">
              {onStartTour && (
                <button className="dropdown-item" onClick={() => { setIsDropdownOpen(false); onStartTour(); }}>
                  Take Dashboard Tour
                </button>
              )}
              <button className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                Settings
              </button>
              <button className="dropdown-item logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;

