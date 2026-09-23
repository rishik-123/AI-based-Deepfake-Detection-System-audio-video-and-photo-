import { useState, useRef } from 'react';
import { 
  Video, 
  Film, 
  Layers, 
  Cpu, 
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Play,
  Loader2,
  Clock,
  Activity,
  BarChart3,
  TrendingUp,
  Image as ImageIcon,
  RotateCcw
} from 'lucide-react';
import { formatBytes } from '../../utils/fileUtils';

const VideoUploader = ({ onAnalyze, isLoading, result, onClearResult, onError }) => {
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoMeta, setVideoMeta] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [frameFilter, setFrameFilter] = useState('all'); // 'all', 'fake', 'real'
  const fileInputRef = useRef(null);

  const handleVideoSelect = (file) => {
    if (!file || !file.type.startsWith('video/')) {
      if (onError) onError('Please select a valid video file (.mp4, .avi, .mov, .mkv)');
      return;
    }

    const url = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoUrl(url);
    if (onClearResult) onClearResult();

    // Initial metadata
    setVideoMeta({
      name: file.name,
      size: file.size,
      formattedSize: formatBytes(file.size),
      type: file.type || 'video/mp4',
    });
  };

  const handleLoadedMetadata = (e) => {
    const video = e.target;
    setVideoMeta((prev) => ({
      ...prev,
      duration: video.duration ? `${video.duration.toFixed(1)} seconds` : 'N/A',
      width: video.videoWidth,
      height: video.videoHeight,
      resolution: video.videoWidth && video.videoHeight ? `${video.videoWidth} × ${video.videoHeight} px` : 'N/A',
    }));
  };

  const handleClear = () => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoFile(null);
    setVideoUrl(null);
    setVideoMeta(null);
    if (onClearResult) onClearResult();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRunAnalysis = () => {
    if (!videoFile) return;
    if (onAnalyze) {
      onAnalyze(videoFile, videoMeta);
    }
  };

  const isFake = result?.prediction?.toLowerCase() === 'fake';
  const confidence = result?.confidence || 0;

  const filteredFrames = result?.frames ? result.frames.filter(f => {
    if (frameFilter === 'fake') return f.prediction === 'fake';
    if (frameFilter === 'real') return f.prediction === 'real';
    return true;
  }) : [];

  return (
    <div className="card video-uploader-card fade-in">
      <div className="card-header">
        <h2>
          <Video size={22} className="card-header-icon text-accent" /> Video Deepfake Detection
        </h2>
        <span className="card-subtitle">
          Temporal frame-by-frame deepfake detection workflow powered by PyTorch DeepfakeCNN.
        </span>
      </div>

      {/* Pipeline Status Notice */}
      <div className="video-info-banner">
        <Cpu size={22} className="banner-icon" />
        <div className="banner-text">
          <strong>OpenCV Keyframe Sampling & PyTorch CNN Aggregation</strong>
          <p>
            The video pipeline extracts keyframes across the timeline, normalizes each frame with ImageNet parameters, performs inference through the 4-block Conv2d network, and performs temporal aggregation.
          </p>
        </div>
      </div>

      {!videoFile ? (
        <div
          className={`dropzone ${isDragOver ? 'drag-over' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            if (e.dataTransfer.files?.[0]) handleVideoSelect(e.dataTransfer.files[0]);
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleVideoSelect(e.target.files[0])}
            accept="video/mp4,video/avi,video/quicktime,video/x-matroska,.mp4,.mov,.avi,.mkv"
            className="file-input-hidden"
          />
          <div className="dropzone-content">
            <div className="dropzone-icon-circle accent-bg">
              <Film size={38} className="upload-icon text-accent" />
            </div>
            <h3>Drag & Drop video file for analysis</h3>
            <p className="dropzone-hint">
              or <span className="browse-link">browse video from device</span>
            </p>
            <div className="supported-formats">
              <span>Supports MP4, AVI, MOV, MKV (dataset/raw/deepfake or dataset/raw/video)</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="video-preview-grid">
          <div className="video-player-box">
            <video
              src={videoUrl}
              controls
              onLoadedMetadata={handleLoadedMetadata}
              className="video-player"
            />
          </div>

          <div className="video-meta-box">
            <h4>
              <Layers size={18} /> Video Technical Properties
            </h4>

            <div className="meta-list">
              <div className="meta-item">
                <span className="meta-label">File Name</span>
                <span className="meta-value filename-truncate" title={videoMeta?.name}>{videoMeta?.name}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">File Size</span>
                <span className="meta-value">{videoMeta?.formattedSize}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Duration</span>
                <span className="meta-value">{videoMeta?.duration || 'Calculating...'}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Resolution</span>
                <span className="meta-value">{videoMeta?.resolution || 'Calculating...'}</span>
              </div>
            </div>

            <div className="video-pipeline-steps">
              <h5>Pipeline Execution Stages:</h5>
              <div className="step-item">
                <CheckCircle2 size={14} className="text-success" />
                <span>1. Video Container Decoding & Metadata</span>
              </div>
              <div className="step-item">
                <CheckCircle2 size={14} className={isLoading ? "text-accent animate-pulse" : "text-success"} />
                <span>2. OpenCV Keyframe Sampler (Uniform Timeline)</span>
              </div>
              <div className="step-item">
                <CheckCircle2 size={14} className={isLoading ? "text-accent animate-pulse" : (result ? "text-success" : "text-muted")} />
                <span>3. Frame-Level CNN Inference (`DeepfakeCNN`)</span>
              </div>
              <div className="step-item">
                <CheckCircle2 size={14} className={result ? "text-success" : "text-muted"} />
                <span>4. Temporal Prediction Aggregator</span>
              </div>
            </div>

            <div className="preview-actions">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleClear}
                disabled={isLoading}
              >
                <RotateCcw size={15} /> Remove Video
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleRunAnalysis}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Processing Video Frames...
                  </>
                ) : (
                  <>
                    <Play size={16} /> Run Frame-by-Frame CNN Analysis
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Feedback State */}
      {isLoading && (
        <div className="analysis-progress-card card fade-in" style={{ marginTop: '1.5rem' }}>
          <div className="progress-header">
            <Loader2 className="animate-spin text-accent" size={24} />
            <div>
              <h4>Extracting & Analyzing Video Frames</h4>
              <p className="progress-sub">Running PyTorch CNN inference on sampled video frames...</p>
            </div>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-indeterminate"></div>
          </div>
        </div>
      )}

      {/* ANALYSIS RESULTS SECTION */}
      {result && !isLoading && (
        <div className="results-section fade-in" style={{ marginTop: '2rem' }}>
          {/* Main Verdict Card */}
          <div className={`card result-card ${isFake ? 'result-fake' : 'result-real'}`}>
            <div className="result-header">
              <span className="result-chip">
                <Activity size={14} /> Video Authenticity Verdict
              </span>
              <span className="result-timestamp">
                {result.total_frames_sampled} Frames Analyzed
              </span>
            </div>

            <div className="verdict-banner">
              <div className={`verdict-icon ${isFake ? 'fake' : 'real'}`}>
                {isFake ? <ShieldAlert size={48} /> : <ShieldCheck size={48} />}
              </div>
              <div className="verdict-content">
                <div className="verdict-title-row">
                  <h2 className={`verdict-text ${isFake ? 'text-fake' : 'text-real'}`}>
                    {isFake ? 'DEEPFAKE DETECTED' : 'AUTHENTIC MEDIA'}
                  </h2>
                </div>
                <p className="verdict-description">
                  {isFake
                    ? `Temporal CNN sequence analysis identified face-swap/manipulation artifacts across ${result.fake_frames_count} of ${result.total_frames_sampled} extracted keyframes (${result.fake_ratio_percent}% manipulation ratio).`
                    : `Temporal frame analysis verified natural biometric consistency across all ${result.total_frames_sampled} keyframes with no significant synthetic manipulation artifacts detected.`}
                </p>
              </div>
            </div>

            {/* Confidence Meter */}
            <div className="confidence-meter-box">
              <div className="confidence-label-row">
                <span className="meter-title">Aggregate Detection Confidence</span>
                <span className={`meter-score ${isFake ? 'score-fake' : 'score-real'}`}>
                  {confidence.toFixed(2)}%
                </span>
              </div>
              <div className="confidence-bar-wrapper">
                <div
                  className={`confidence-bar-fill ${isFake ? 'fill-fake' : 'fill-real'}`}
                  style={{ width: `${Math.min(100, Math.max(0, confidence))}%` }}
                ></div>
              </div>
              <div className="confidence-scale">
                <span>0% (Uncertain)</span>
                <span>50% Threshold</span>
                <span>100% (Definitive)</span>
              </div>
            </div>

            {/* Metric Strips */}
            <div className="result-file-strip">
              <div className="strip-item">
                <span className="strip-label">Video File:</span>
                <span className="strip-value">{result.filename || videoMeta?.name}</span>
              </div>
              <div className="strip-item">
                <span className="strip-label">Duration:</span>
                <span className="strip-value">{result.duration_seconds}s ({result.video_total_frames} total frames @ {result.fps} fps)</span>
              </div>
              <div className="strip-item">
                <span className="strip-label">Fake Frame Ratio:</span>
                <span className={`strip-badge-status ${isFake ? 'text-fake' : 'text-real'}`}>
                  {result.fake_ratio_percent}% ({result.fake_frames_count}/{result.total_frames_sampled} frames)
                </span>
              </div>
            </div>
          </div>

          {/* Statistical Breakdown Grid */}
          <div className="details-grid">
            <div className="detail-box">
              <div className="detail-header">
                <Film size={16} className="detail-icon" />
                <span className="detail-title">Sampled Keyframes</span>
              </div>
              <div className="detail-value">{result.total_frames_sampled}</div>
              <div className="detail-subtext">Uniform temporal intervals</div>
            </div>

            <div className="detail-box">
              <div className="detail-header">
                <AlertTriangle size={16} className="detail-icon text-danger" />
                <span className="detail-title">Fake Keyframes</span>
              </div>
              <div className="detail-value text-danger">{result.fake_frames_count}</div>
              <div className="detail-subtext">Avg Fake Prob: {result.average_fake_probability}%</div>
            </div>

            <div className="detail-box">
              <div className="detail-header">
                <ShieldCheck size={16} className="detail-icon text-success" />
                <span className="detail-title">Real Keyframes</span>
              </div>
              <div className="detail-value text-success">{result.real_frames_count}</div>
              <div className="detail-subtext">Avg Real Prob: {result.average_real_probability}%</div>
            </div>

            <div className="detail-box">
              <div className="detail-header">
                <TrendingUp size={16} className="detail-icon" />
                <span className="detail-title">Decision Threshold</span>
              </div>
              <div className="detail-value">40.0% Fake Ratio</div>
              <div className="detail-subtext">Standard Deepfake Baseline</div>
            </div>
          </div>

          {/* Sampled Keyframes Visual Gallery */}
          {result.thumbnails && result.thumbnails.length > 0 && (
            <div className="card" style={{ marginTop: '1rem' }}>
              <div className="card-header" style={{ marginBottom: '1rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                  <ImageIcon size={18} className="text-accent" /> Sampled Keyframe Previews
                </h3>
                <span className="card-subtitle">
                  Representative video frames extracted and analyzed by the PyTorch CNN model.
                </span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: '1rem'
              }}>
                {result.thumbnails.map((thumb, idx) => {
                  const frameIsFake = thumb.verdict?.toLowerCase() === 'fake';
                  return (
                    <div 
                      key={idx} 
                      style={{
                        background: 'rgba(0, 0, 0, 0.35)',
                        border: `1px solid ${frameIsFake ? 'rgba(244, 63, 94, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                        borderRadius: '8px',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <img 
                        src={thumb.thumbnail} 
                        alt={`Frame ${thumb.frame_index}`}
                        style={{ width: '100%', height: '110px', objectFit: 'cover' }}
                      />
                      <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.775rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>
                          <span>Frame #{thumb.frame_index}</span>
                          <span>{thumb.timestamp_str}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: '600',
                            fontSize: '0.7rem',
                            textTransform: 'uppercase',
                            background: frameIsFake ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                            color: frameIsFake ? 'var(--color-danger)' : 'var(--color-success)'
                          }}>
                            {thumb.verdict}
                          </span>
                          <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                            {thumb.confidence?.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Detailed Keyframe Inspection Table */}
          {result.frames && result.frames.length > 0 && (
            <div className="card" style={{ marginTop: '1rem' }}>
              <div className="flex-between" style={{ marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                    <BarChart3 size={18} className="text-primary" /> Keyframe-by-Keyframe Analysis Log
                  </h3>
                  <span className="card-subtitle">
                    Complete chronological inference timeline across all {result.frames.length} sampled frames.
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    type="button" 
                    className={`btn ${frameFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFrameFilter('all')}
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                  >
                    All ({result.frames.length})
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${frameFilter === 'fake' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFrameFilter('fake')}
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                  >
                    Fake Only ({result.fake_frames_count})
                  </button>
                  <button 
                    type="button" 
                    className={`btn ${frameFilter === 'real' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFrameFilter('real')}
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                  >
                    Real Only ({result.real_frames_count})
                  </button>
                </div>
              </div>

              <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead style={{ background: 'rgba(255, 255, 255, 0.05)', position: 'sticky', top: 0 }}>
                    <tr>
                      <th style={{ padding: '0.6rem 0.8rem' }}>Frame #</th>
                      <th style={{ padding: '0.6rem 0.8rem' }}>Timestamp</th>
                      <th style={{ padding: '0.6rem 0.8rem' }}>Verdict</th>
                      <th style={{ padding: '0.6rem 0.8rem' }}>Confidence</th>
                      <th style={{ padding: '0.6rem 0.8rem' }}>Fake Prob</th>
                      <th style={{ padding: '0.6rem 0.8rem' }}>Real Prob</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFrames.map((f, i) => {
                      const fIsFake = f.prediction === 'fake';
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <td style={{ padding: '0.5rem 0.8rem', fontWeight: '600' }}>#{f.frame_index}</td>
                          <td style={{ padding: '0.5rem 0.8rem', color: 'var(--text-muted)' }}>{f.timestamp_str} ({f.timestamp_sec}s)</td>
                          <td style={{ padding: '0.5rem 0.8rem' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontWeight: '700',
                              fontSize: '0.75rem',
                              textTransform: 'uppercase',
                              background: fIsFake ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                              color: fIsFake ? 'var(--color-danger)' : 'var(--color-success)'
                            }}>
                              {f.prediction}
                            </span>
                          </td>
                          <td style={{ padding: '0.5rem 0.8rem', fontWeight: '600' }}>{f.confidence.toFixed(2)}%</td>
                          <td style={{ padding: '0.5rem 0.8rem', color: fIsFake ? 'var(--color-danger)' : 'var(--text-muted)' }}>{f.fake_probability.toFixed(2)}%</td>
                          <td style={{ padding: '0.5rem 0.8rem', color: !fIsFake ? 'var(--color-success)' : 'var(--text-muted)' }}>{f.real_probability.toFixed(2)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoUploader;
