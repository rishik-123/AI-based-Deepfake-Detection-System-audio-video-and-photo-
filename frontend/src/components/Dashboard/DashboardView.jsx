import { 
  ShieldCheck, 
  ShieldAlert, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  FileSearch, 
  Cpu, 
  Activity, 
  Layers, 
  ArrowRight,
  Clock,
  Sparkles
} from 'lucide-react';
import StatsOverview from '../StatsOverview';

const DashboardView = ({ 
  history = [], 
  backendOnline = false, 
  onNavigateTab
}) => {
  const recentHistory = history.slice(0, 4);

  return (
    <div className="dashboard-view fade-in">
      {/* System KPI Stat Cards */}
      <StatsOverview history={history} />

      {/* Hero Welcome & Quick Action Banner */}
      <div className="card dashboard-hero-card">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={14} className="text-accent" />
            <span>AI Neural Forensic System</span>
          </div>
          <h2>Media Authenticity & Deepfake Analysis Platform</h2>
          <p>
            Powered by a custom 4-block Convolutional Neural Network (PyTorch) trained for binary facial manipulation detection and digital media integrity assessment.
          </p>
          <div className="hero-actions">
            <button 
              type="button" 
              className="btn btn-primary btn-glow"
              onClick={() => onNavigateTab('image')}
            >
              <ImageIcon size={18} /> Launch Image Detection
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => onNavigateTab('authenticity')}
            >
              <FileSearch size={18} /> Authenticity Breakdown
            </button>
          </div>
        </div>

        <div className="hero-system-status">
          <div className="system-pill">
            <Cpu size={16} className="text-accent" />
            <div>
              <span className="pill-title">CNN Architecture</span>
              <span className="pill-value">DeepfakeCNN (4-Block Conv2d)</span>
            </div>
          </div>
          <div className="system-pill">
            <Layers size={16} className="text-success" />
            <div>
              <span className="pill-title">Input Dimensions</span>
              <span className="pill-value">128 × 128 px (RGB Normalized)</span>
            </div>
          </div>
          <div className="system-pill">
            <Activity size={16} className={backendOnline ? 'text-success' : 'text-danger'} />
            <div>
              <span className="pill-title">FastAPI Backend</span>
              <span className="pill-value">{backendOnline ? 'Connected (Port 8000)' : 'Offline'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Modules Quick Launch Grid */}
      <div className="modules-quick-grid">
        <div className="card module-jump-card" onClick={() => onNavigateTab('image')}>
          <div className="module-icon-circle primary">
            <ImageIcon size={24} />
          </div>
          <div className="module-info">
            <div className="module-header-row">
              <h3>Image Deepfake Detection</h3>
              <span className="badge-active">Active</span>
            </div>
            <p>Upload single images to detect generative AI artifacts, facial synthesis, and deepfake alterations.</p>
            <span className="jump-link">
              Run image scan <ArrowRight size={14} />
            </span>
          </div>
        </div>

        <div className="card module-jump-card" onClick={() => onNavigateTab('video')}>
          <div className="module-icon-circle accent">
            <VideoIcon size={24} />
          </div>
          <div className="module-info">
            <div className="module-header-row">
              <h3>Video Detection Pipeline</h3>
              <span className="badge-active">Active</span>
            </div>
            <p>Temporal keyframe extraction and frame-by-frame PyTorch CNN deepfake evaluation.</p>
            <span className="jump-link">
              Run video scan <ArrowRight size={14} />
            </span>
          </div>
        </div>

        <div className="card module-jump-card" onClick={() => onNavigateTab('authenticity')}>
          <div className="module-icon-circle success">
            <FileSearch size={24} />
          </div>
          <div className="module-info">
            <div className="module-header-row">
              <h3>Authenticity Inspection</h3>
              <span className="badge-active">Active</span>
            </div>
            <p>Inspect structural headers, MIME types, spatial resolutions, and AI forensic classifications.</p>
            <span className="jump-link">
              Inspect metadata <ArrowRight size={14} />
            </span>
          </div>
        </div>
      </div>

      {/* Recent Scans Strip */}
      <div className="card recent-scans-card">
        <div className="card-header flex-between">
          <h3>
            <Clock size={18} className="card-header-icon" /> Recent Detection Activity
          </h3>
          {history.length > 0 && (
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigateTab('history')}
            >
              View All History ({history.length})
            </button>
          )}
        </div>

        {recentHistory.length === 0 ? (
          <div className="empty-recent">
            <p>No scans performed in this session yet. Launch image detection to start testing media!</p>
          </div>
        ) : (
          <div className="recent-scans-list">
            {recentHistory.map((item, idx) => {
              const isReal = item.prediction?.toLowerCase() === 'real';
              return (
                <div key={item.id || idx} className="recent-scan-item">
                  <div className="recent-scan-file">
                    <span className="file-name" title={item.filename}>{item.filename}</span>
                    <span className="file-time">{new Date(item.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="recent-scan-result">
                    <span className={`badge-verdict ${isReal ? 'verdict-real' : 'verdict-fake'}`}>
                      {isReal ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                      {item.prediction?.toUpperCase()}
                    </span>
                    <span className="confidence-label">{Number(item.confidence)?.toFixed(2)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardView;
