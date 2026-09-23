import React from 'react';
import { AlertTriangle, XCircle, RefreshCw, X, ServerOff } from 'lucide-react';

const ErrorMessage = ({ error, isNetworkError, onDismiss, onRetry }) => {
  if (!error) return null;

  return (
    <div className={`error-banner ${isNetworkError ? 'network-error' : ''}`}>
      <div className="error-icon-wrapper">
        {isNetworkError ? <ServerOff size={22} /> : <AlertTriangle size={22} />}
      </div>

      <div className="error-content">
        <h4 className="error-title">
          {isNetworkError ? 'Backend Server Connection Failed' : 'Action Failed'}
        </h4>
        <p className="error-message">{error}</p>
      </div>

      <div className="error-actions">
        {onRetry && (
          <button type="button" className="btn btn-sm btn-retry" onClick={onRetry}>
            <RefreshCw size={14} /> Retry
          </button>
        )}
        <button type="button" className="btn-close-error" onClick={onDismiss} aria-label="Dismiss error">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default ErrorMessage;
