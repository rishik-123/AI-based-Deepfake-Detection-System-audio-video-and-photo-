import React from 'react';
import { ShieldCheck, Activity, Wifi, WifiOff, Cpu } from 'lucide-react';

const Header = ({ backendOnline, checkingHealth, onRetryHealth }) => {
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="header-brand">
          <div className="brand-logo-wrapper">
            <ShieldCheck className="brand-icon" size={32} />
            <span className="logo-pulse"></span>
          </div>
          <div className="brand-text">
            <h1 className="project-title">Deepfake & Media Authenticity</h1>
            <p className="project-subtitle">
              <Cpu size={14} className="inline-icon" /> AI-Powered Media Authenticity Detection System
            </p>
          </div>
        </div>

        <div className="header-actions">
          <div
            className={`status-badge ${backendOnline ? 'status-online' : 'status-offline'}`}
            title={backendOnline ? 'FastAPI Backend Online (http://127.0.0.1:8000)' : 'FastAPI Backend Offline'}
            onClick={onRetryHealth}
          >
            {checkingHealth ? (
              <Activity size={14} className="spin-icon" />
            ) : backendOnline ? (
              <Wifi size={14} />
            ) : (
              <WifiOff size={14} />
            )}
            <span>
              {checkingHealth
                ? 'Connecting...'
                : backendOnline
                ? 'Backend Connected'
                : 'Backend Offline (Click to Retry)'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
