import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import DashboardView from './components/Dashboard/DashboardView';
import ImageUploader from './components/ImageDetection/ImageUploader';
import AnalysisResult from './components/ImageDetection/AnalysisResult';
import AuthenticityDetails from './components/ImageDetection/AuthenticityDetails';
import VideoUploader from './components/VideoDetection/VideoUploader';
import DeepAnalysis from './components/AuthenticityAnalysis/DeepAnalysis';
import HistoryTable from './components/History/HistoryTable';
import ErrorMessage from './components/Common/ErrorMessage';

import { predictImage, predictVideo, checkBackendHealth } from './services/api';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [backendOnline, setBackendOnline] = useState(false);
  const [checkingHealth, setCheckingHealth] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  
  const [analysisResult, setAnalysisResult] = useState(null);
  const [currentFileMeta, setCurrentFileMeta] = useState(null);
  const [videoAnalysisResult, setVideoAnalysisResult] = useState(null);
  const [currentVideoMeta, setCurrentVideoMeta] = useState(null);
  const [error, setError] = useState(null);
  const [isNetworkError, setIsNetworkError] = useState(false);

  // Persistent scan history in LocalStorage
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('deepfake_scan_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Check Backend Connection Health
  const runHealthCheck = useCallback(async () => {
    setCheckingHealth(true);
    const health = await checkBackendHealth();
    setBackendOnline(health.online);
    setCheckingHealth(false);
    return health.online;
  }, []);

  useEffect(() => {
    let isMounted = true;
    checkBackendHealth().then((health) => {
      if (isMounted) {
        setBackendOnline(health.online);
        setCheckingHealth(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Save history updates to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('deepfake_scan_history', JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save scan history to localStorage', e);
    }
  }, [history]);

  const handleAnalyze = async (file, fileMeta) => {
    setError(null);
    setIsNetworkError(false);
    setIsLoading(true);
    setCurrentFileMeta(fileMeta);

    const response = await predictImage(file);

    setIsLoading(false);

    if (response.success) {
      setAnalysisResult(response.data);

      // Create new history log entry
      const newHistoryItem = {
        id: Date.now().toString(),
        filename: response.data.filename || file.name,
        mediaType: 'Image',
        prediction: response.data.prediction,
        confidence: response.data.confidence,
        timestamp: new Date().toISOString(),
        formattedSize: fileMeta?.formattedSize || 'N/A',
        dimensions: fileMeta?.width && fileMeta?.height ? `${fileMeta.width} × ${fileMeta.height}` : 'N/A',
      };

      setHistory((prev) => [newHistoryItem, ...prev]);
    } else {
      setError(response.error);
      setIsNetworkError(response.isNetworkError);
      if (response.isNetworkError) {
        setBackendOnline(false);
      }
    }
  };

  const handleVideoAnalyze = async (file, fileMeta) => {
    setError(null);
    setIsNetworkError(false);
    setIsVideoLoading(true);
    setCurrentVideoMeta(fileMeta);

    const response = await predictVideo(file);

    setIsVideoLoading(false);

    if (response.success) {
      setVideoAnalysisResult(response.data);

      // Create new history log entry for video
      const newHistoryItem = {
        id: Date.now().toString(),
        filename: response.data.filename || file.name,
        mediaType: 'Video',
        prediction: response.data.prediction,
        confidence: response.data.confidence,
        timestamp: new Date().toISOString(),
        formattedSize: fileMeta?.formattedSize || 'N/A',
        dimensions: fileMeta?.resolution || 'N/A',
        details: `${response.data.fake_frames_count || 0}/${response.data.total_frames_sampled || 0} fake frames (${response.data.fake_ratio_percent || 0}%)`
      };

      setHistory((prev) => [newHistoryItem, ...prev]);
    } else {
      setError(response.error);
      setIsNetworkError(response.isNetworkError);
      if (response.isNetworkError) {
        setBackendOnline(false);
      }
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all detection history logs?')) {
      setHistory([]);
      localStorage.removeItem('deepfake_scan_history');
    }
  };

  return (
    <div className="app-layout">
      {/* Top Navigation Header */}
      <Header
        backendOnline={backendOnline}
        checkingHealth={checkingHealth}
        onRetryHealth={runHealthCheck}
      />

      {/* Main Dashboard Workspace */}
      <main className="main-content">
        <div className="content-container">
          {/* Navigation Bar (5 distinct tabs) */}
          <Navigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            historyCount={history.length}
          />

          {/* Error Banner */}
          <ErrorMessage
            error={error}
            isNetworkError={isNetworkError}
            onDismiss={() => setError(null)}
            onRetry={isNetworkError ? runHealthCheck : null}
          />

          {/* SECTION 1: Dashboard */}
          {activeTab === 'dashboard' && (
            <DashboardView
              history={history}
              backendOnline={backendOnline}
              onNavigateTab={setActiveTab}
            />
          )}

          {/* SECTION 2: Image Deepfake Detection */}
          {activeTab === 'image' && (
            <div className="tab-pane fade-in">
              <ImageUploader
                onAnalyze={handleAnalyze}
                isLoading={isLoading}
                onError={(msg) => {
                  setError(msg);
                  setIsNetworkError(false);
                }}
              />

              {analysisResult && (
                <div className="results-section fade-in">
                  <AnalysisResult result={analysisResult} />
                  <AuthenticityDetails fileMeta={currentFileMeta} result={analysisResult} />
                </div>
              )}
            </div>
          )}

          {/* SECTION 3: Video Deepfake Detection UI */}
          {activeTab === 'video' && (
            <div className="tab-pane fade-in">
              <VideoUploader
                onAnalyze={handleVideoAnalyze}
                isLoading={isVideoLoading}
                result={videoAnalysisResult}
                onClearResult={() => setVideoAnalysisResult(null)}
                onError={(msg) => {
                  setError(msg);
                  setIsNetworkError(false);
                }}
              />
            </div>
          )}

          {/* SECTION 4: Media Authenticity Analysis */}
          {activeTab === 'authenticity' && (
            <div className="tab-pane fade-in">
              <DeepAnalysis lastResult={analysisResult} lastFileMeta={currentFileMeta} />
            </div>
          )}

          {/* SECTION 5: Analysis History */}
          {activeTab === 'history' && (
            <div className="tab-pane fade-in">
              <HistoryTable history={history} onClearHistory={handleClearHistory} />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-container">
          <p>Deepfake Detection & Media Authenticity System • AI Mini Project</p>
          <p className="footer-sub">
            Powered by PyTorch <code>DeepfakeCNN</code> model API: <code>http://127.0.0.1:8000/predict</code>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
