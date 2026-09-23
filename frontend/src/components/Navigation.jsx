import { LayoutDashboard, Image, Video, FileSearch, History } from 'lucide-react';

const Navigation = ({ activeTab, setActiveTab, historyCount = 0 }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'image', label: 'Image Detection', icon: Image, badge: 'Live CNN' },
    { id: 'video', label: 'Video Detection', icon: Video, badge: 'Live CNN' },
    { id: 'authenticity', label: 'Media Authenticity', icon: FileSearch, badge: null },
    { id: 'history', label: 'Analysis History', icon: History, badge: historyCount > 0 ? historyCount : null },
  ];

  return (
    <nav className="nav-container">
      <div className="nav-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`nav-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={18} className="tab-icon" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`tab-badge ${typeof tab.badge === 'string' ? 'info' : 'count'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;
