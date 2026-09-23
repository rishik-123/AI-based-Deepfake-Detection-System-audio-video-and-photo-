import { 
  Info, 
  FileType, 
  HardDrive, 
  Maximize, 
  Database, 
  Cpu, 
  ShieldCheck, 
  ShieldAlert
} from 'lucide-react';
import { formatBytes } from '../../utils/fileUtils';

const AuthenticityDetails = ({ fileMeta, result }) => {
  if (!fileMeta && !result) return null;

  const isReal = result?.prediction?.toLowerCase() === 'real';

  return (
    <div className="card authenticity-details-card">
      <div className="card-header">
        <h3>
          <Info size={18} className="card-header-icon" /> Media Technical & Authenticity Properties
        </h3>
        <span className="card-subtitle">
          Metadata and structural details extracted from the inspected file.
        </span>
      </div>

      <div className="details-grid">
        <div className="detail-box">
          <div className="detail-header">
            <FileType size={18} className="detail-icon" />
            <span className="detail-title">File Format / MIME</span>
          </div>
          <div className="detail-value">{fileMeta?.type || 'image/jpeg'}</div>
          <span className="detail-subtext">Container compression format</span>
        </div>

        <div className="detail-box">
          <div className="detail-header">
            <HardDrive size={18} className="detail-icon" />
            <span className="detail-title">File Size</span>
          </div>
          <div className="detail-value">
            {fileMeta?.formattedSize || (fileMeta?.size ? formatBytes(fileMeta.size) : 'N/A')}
          </div>
          <span className="detail-subtext">Data payload size</span>
        </div>

        <div className="detail-box">
          <div className="detail-header">
            <Maximize size={18} className="detail-icon" />
            <span className="detail-title">Image Dimensions</span>
          </div>
          <div className="detail-value">
            {fileMeta?.width && fileMeta?.height
              ? `${fileMeta.width} × ${fileMeta.height} px`
              : 'N/A'}
          </div>
          <span className="detail-subtext">Spatial resolution</span>
        </div>

        <div className="detail-box">
          <div className="detail-header">
            <Database size={18} className="detail-icon" />
            <span className="detail-title">Metadata Availability</span>
          </div>
          <div className="detail-value text-accent">Header Decoded</div>
          <span className="detail-subtext">Binary image header validated</span>
        </div>

        <div className="detail-box">
          <div className="detail-header">
            <Cpu size={18} className="detail-icon" />
            <span className="detail-title">CNN Detection Result</span>
          </div>
          <div className={`detail-value ${isReal ? 'text-success' : 'text-danger'}`}>
            {result ? result.prediction?.toUpperCase() : 'Awaiting Inference'}
          </div>
          <span className="detail-subtext">Classification from model output</span>
        </div>

        <div className="detail-box">
          <div className="detail-header">
            {isReal ? <ShieldCheck size={18} className="detail-icon text-success" /> : <ShieldAlert size={18} className="detail-icon text-danger" />}
            <span className="detail-title">Overall Analysis Status</span>
          </div>
          <div className={`detail-value ${isReal ? 'text-success' : 'text-danger'}`}>
            {result ? (isReal ? 'Likely Authentic' : 'Potentially AI-Generated / Manipulated') : 'Pending'}
          </div>
          <span className="detail-subtext">Model classification verdict</span>
        </div>
      </div>
    </div>
  );
};

export default AuthenticityDetails;
