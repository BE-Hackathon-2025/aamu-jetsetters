import { useState } from 'react';
import './Sidebar.css';

interface SidebarProps {
  activeItem: string;
  onNavigate: (item: string) => void;
}

function Sidebar({ activeItem, onNavigate }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'anomaly-overview', label: 'Anomaly Overview', icon: '' },
    { id: 'diagnostics', label: 'Diagnostics & Forensics', icon: '' },
    { id: 'ai-chat', label: 'AI Analyst & Chat', icon: '' },
    { id: 'community-reports', label: 'Community Reports', icon: '' },
  ];

  return (
    <aside className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''}`} data-tour="sidebar">
      <button 
        className="sidebar-toggle"
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label="Toggle sidebar"
      >
        {isCollapsed ? '→' : '←'}
      </button>
      
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`sidebar-nav-item ${activeItem === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            {!isCollapsed && <span className="nav-item-label">{item.label}</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;

