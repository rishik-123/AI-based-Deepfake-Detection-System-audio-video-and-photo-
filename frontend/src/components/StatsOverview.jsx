import React from 'react';
import { ShieldAlert, ShieldCheck, BarChart2, Layers } from 'lucide-react';

const StatsOverview = ({ history = [] }) => {
  const totalScans = history.length;
  const realCount = history.filter((item) => item.prediction?.toLowerCase() === 'real').length;
  const fakeCount = history.filter((item) => item.prediction?.toLowerCase() === 'fake').length;
  
  const avgConfidence = totalScans > 0
    ? (history.reduce((acc, curr) => acc + (Number(curr.confidence) || 0), 0) / totalScans).toFixed(1)
    : 0;

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon-bg primary">
          <Layers size={22} />
        </div>
        <div className="stat-info">
          <span className="stat-label">Total Media Scanned</span>
          <span className="stat-value">{totalScans}</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon-bg success">
          <ShieldCheck size={22} />
        </div>
        <div className="stat-info">
          <span className="stat-label">Authentic (Real)</span>
          <span className="stat-value text-success">{realCount}</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon-bg danger">
          <ShieldAlert size={22} />
        </div>
        <div className="stat-info">
          <span className="stat-label">Deepfake (Fake)</span>
          <span className="stat-value text-danger">{fakeCount}</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon-bg accent">
          <BarChart2 size={22} />
        </div>
        <div className="stat-info">
          <span className="stat-label">Avg AI Confidence</span>
          <span className="stat-value">{avgConfidence > 0 ? `${avgConfidence}%` : 'N/A'}</span>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;
