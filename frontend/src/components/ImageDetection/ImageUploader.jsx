import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, FileText, CheckCircle2, RefreshCw, Sparkles, AlertCircle, Maximize2 } from 'lucide-react';
import { formatBytes, getImageDimensions, validateFile, MAX_FILE_SIZE_MB } from '../../utils/fileUtils';

const ImageUploader = ({ onAnalyze, isLoading, onError }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imageMeta, setImageMeta] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (file) => {
    if (!file) return;

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      onError(validation.error);
      return;
    }

    // Extract dimensions
    const dimensions = await getImageDimensions(file);
    const objectUrl = URL.createObjectURL(file);

    setSelectedFile(file);
    setPreviewUrl(objectUrl);
    setImageMeta({
      name: file.name,
      size: file.size,
      formattedSize: formatBytes(file.size),
      type: file.type,
      width: dimensions.width,
      height: dimensions.height,
      lastModified: new Date(file.lastModified).toLocaleString(),
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setImageMeta(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile || isLoading) return;
    onAnalyze(selectedFile, imageMeta);
  };

  return (
    <div className="card uploader-card">
      <div className="card-header">
        <h2>
          <ImageIcon size={20} className="card-header-icon" /> Image Deepfake Detection
        </h2>
        <span className="card-subtitle">
          Upload an image to inspect for facial manipulations, synthetic neural artifacts, and authenticity verification.
        </span>
      </div>

      {!selectedFile ? (
        <div
          className={`dropzone ${isDragOver ? 'drag-over' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleInputChange}
            accept="image/jpeg,image/png,image/webp,image/gif,image/bmp,image/tiff"
            className="file-input-hidden"
          />
          <div className="dropzone-content">
            <div className="dropzone-icon-circle">
              <UploadCloud size={38} className="upload-icon" />
            </div>
            <h3>Drag & Drop your image here</h3>
            <p className="dropzone-hint">
              or <span className="browse-link">browse from your computer</span>
            </p>
            <div className="supported-formats">
              <span>Supports JPG, PNG, WEBP, GIF, BMP, TIFF (Max {MAX_FILE_SIZE_MB}MB)</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="preview-container">
          <div className="preview-grid">
            <div className="preview-image-wrapper">
              <img src={previewUrl} alt="Upload Preview" className="preview-image" />
              <div className="preview-overlay">
                <span className="preview-badge">
                  <CheckCircle2 size={14} /> Ready for Neural Analysis
                </span>
              </div>
            </div>

            <div className="preview-meta-details">
              <h4 className="preview-title">
                <FileText size={16} /> Image File Overview
              </h4>

              <div className="meta-list">
                <div className="meta-item">
                  <span className="meta-label">File Name</span>
                  <span className="meta-value filename-truncate" title={imageMeta.name}>
                    {imageMeta.name}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">File Size</span>
                  <span className="meta-value">{imageMeta.formattedSize}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">MIME Format</span>
                  <span className="meta-value">{imageMeta.type || 'image/jpeg'}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Dimensions</span>
                  <span className="meta-value">
                    {imageMeta.width && imageMeta.height
                      ? `${imageMeta.width} × ${imageMeta.height} px`
                      : 'Calculating...'}
                  </span>
                </div>
              </div>

              <div className="preview-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleClear}
                  disabled={isLoading}
                >
                  <RefreshCw size={16} /> Choose Different Image
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-glow"
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner"></span> Analyzing Image...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} /> Analyze Authenticity
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="analysis-progress-overlay">
              <div className="progress-card">
                <div className="progress-spinner-ring"></div>
                <h4>Neural Network Inference in Progress...</h4>
                <p>Posting payload to PyTorch backend API at <code>http://127.0.0.1:8000/predict</code></p>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
