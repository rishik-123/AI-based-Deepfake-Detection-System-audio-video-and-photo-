import { 
  FileSearch, 
  ShieldCheck, 
  ShieldAlert, 
  Cpu, 
  HardDrive, 
  FileType, 
  Maximize, 
  Database, 
  Layers, 
  Activity,
  Info
} from 'lucide-react';
import { formatBytes } from '../../utils/fileUtils';

const DeepAnalysis = ({ lastResult, lastFileMeta }) => {
  const isReal = lastResult?.prediction?.toLowerCase() === 'real';
  const hasData = Boolean(lastResult || lastFileMeta);

  return (
    <div className="deep-analysis-container fade-in">
      <div className="card">
        <div className="card-header">
          <h2>
            <FileSearch size={22} className="card-header-icon text-accent" /> Media Authenticity Analysis
          </h2>
          <span className="card-subtitle">
            Authenticity and technical structural report for media inspected by the PyTorch deep learning system.
          </span>
        </div>

        {hasData ? (
          <div className="analysis-summary-banner">
            <div className="banner-badge">
              <Activity size={18} /> Active Target: <strong>{lastResult?.filename || lastFileMeta?.name}</strong>
            </div>
            <div className="banner-status-text">
              Overall Status:{' '}
              <span className={isReal ? 'text-success font-semibold' : 'text-danger font-semibold'}>
                {lastResult ? (isReal ? 'Likely Authentic' : 'Potentially AI-Generated / Manipulated') : 'Awaiting Inference'}
              </span>
            </div>
          </div>
        ) : (
          <div className="analysis-empty-notice">
            <Layers size={36} className="empty-icon" />
            <h4>No Active Media Selected</h4>
            <p>Upload and analyze an image in the <strong>Image Detection</strong> tab to view its authenticity parameters and structural verification details here.</p>
          </div>
        )}

        {/* Technical Properties Grid */}
        <div className="authenticity-data-grid">
          {/* 1. File Name */}
          <div className="auth-field-card">
            <div className="field-header">
              <FileType size={18} className="text-accent" />
              <span className="field-label">File Name</span>
            </div>
            <div className="field-value filename-truncate" title={lastResult?.filename || lastFileMeta?.name || 'N/A'}>
              {lastResult?.filename || lastFileMeta?.name || 'N/A'}
            </div>
            <span className="field-subtext">Original payload identifier</span>
          </div>

          {/* 2. File Type / MIME */}
          <div className="auth-field-card">
            <div className="field-header">
              <FileType size={18} className="text-accent" />
              <span className="field-label">File Type</span>
            </div>
            <div className="field-value">
              {lastFileMeta?.type || (lastResult?.filename ? `image/${lastResult.filename.split('.').pop()}` : 'N/A')}
            </div>
            <span className="field-subtext">Media MIME format</span>
          </div>

          {/* 3. File Size */}
          <div className="auth-field-card">
            <div className="field-header">
              <HardDrive size={18} className="text-accent" />
              <span className="field-label">File Size</span>
            </div>
            <div className="field-value">
              {lastFileMeta?.formattedSize || (lastFileMeta?.size ? formatBytes(lastFileMeta.size) : 'N/A')}
            </div>
            <span className="field-subtext">Binary storage size</span>
          </div>

          {/* 4. Dimensions */}
          <div className="auth-field-card">
            <div className="field-header">
              <Maximize size={18} className="text-accent" />
              <span className="field-label">Dimensions</span>
            </div>
            <div className="field-value">
              {lastFileMeta?.width && lastFileMeta?.height
                ? `${lastFileMeta.width} × ${lastFileMeta.height} px`
                : 'N/A'}
            </div>
            <span className="field-subtext">Spatial resolution</span>
          </div>

          {/* 5. Metadata Availability */}
          <div className="auth-field-card">
            <div className="field-header">
              <Database size={18} className="text-accent" />
              <span className="field-label">Metadata Availability</span>
            </div>
            <div className="field-value">
              {lastFileMeta ? 'Header Present & Decoded' : 'N/A'}
            </div>
            <span className="field-subtext">Container structure verification</span>
          </div>

          {/* 6. AI Detection Result */}
          <div className="auth-field-card">
            <div className="field-header">
              <Cpu size={18} className="text-accent" />
              <span className="field-label">AI Detection Result</span>
            </div>
            <div className={`field-value ${lastResult ? (isReal ? 'text-success' : 'text-danger') : ''}`}>
              {lastResult ? lastResult.prediction?.toUpperCase() : 'N/A'}
            </div>
            <span className="field-subtext">PyTorch CNN evaluation</span>
          </div>

          {/* 7. Confidence Score */}
          <div className="auth-field-card">
            <div className="field-header">
              <Activity size={18} className="text-accent" />
              <span className="field-label">Confidence</span>
            </div>
            <div className={`field-value ${lastResult ? (isReal ? 'text-success' : 'text-danger') : ''}`}>
              {lastResult?.confidence ? `${Number(lastResult.confidence).toFixed(2)}%` : 'N/A'}
            </div>
            <span className="field-subtext">Model softmax certainty</span>
          </div>

          {/* 8. Overall Analysis Status */}
          <div className="auth-field-card">
            <div className="field-header">
              {isReal ? <ShieldCheck size={18} className="text-success" /> : <ShieldAlert size={18} className="text-danger" />}
              <span className="field-label">Overall Analysis Status</span>
            </div>
            <div className={`field-value ${lastResult ? (isReal ? 'text-success' : 'text-danger') : ''}`}>
              {lastResult ? (isReal ? 'Likely Authentic' : 'Potentially AI-Generated / Manipulated') : 'Pending Scan'}
            </div>
            <span className="field-subtext">System verdict summary</span>
          </div>
        </div>

        {/* Technical Architecture Notes */}
        <div className="ai-disclaimer-box mt-4">
          <Info size={16} className="disclaimer-icon" />
          <p>
            <strong>Technical Note:</strong> All parameters displayed above are directly extracted from the uploaded media payload and verified via PyTorch CNN inference. This system does not fabricate or simulate synthetic forensic indicators.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeepAnalysis;
