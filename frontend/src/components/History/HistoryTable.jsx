import React, { useState } from 'react';
import { History, Search, Trash2, Download, ShieldCheck, ShieldAlert, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { formatBytes } from '../../utils/fileUtils';

const HistoryTable = ({ history = [], onClearHistory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'real' | 'fake'

  const filteredHistory = history.filter((item) => {
    const matchesSearch = item.filename?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterType === 'all' ||
      (filterType === 'real' && item.prediction?.toLowerCase() === 'real') ||
      (filterType === 'fake' && item.prediction?.toLowerCase() === 'fake');
    return matchesSearch && matchesFilter;
  });

  const handleExportCSV = () => {
    if (history.length === 0) return;

    const headers = ['Filename', 'Prediction', 'Confidence (%)', 'Timestamp', 'File Size'];
    const rows = history.map((item) => [
      `"${item.filename}"`,
      item.prediction?.toUpperCase(),
      item.confidence?.toFixed(2),
      `"${new Date(item.timestamp).toLocaleString()}"`,
      `"${item.formattedSize || 'N/A'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `deepfake_detection_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="card history-card">
      <div className="card-header flex-between">
        <div>
          <h2>
            <History size={22} className="card-header-icon" /> Previous Detection History
          </h2>
          <span className="card-subtitle">
            Log of all media processed by the system during this session.
          </span>
        </div>

        <div className="history-header-actions">
          {history.length > 0 && (
            <>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
                <Download size={14} /> Export CSV
              </button>
              <button type="button" className="btn btn-danger-outline btn-sm" onClick={onClearHistory}>
                <Trash2 size={14} /> Clear History
              </button>
            </>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <div className="history-toolbar">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by filename..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-buttons">
            <button
              className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              All ({history.length})
            </button>
            <button
              className={`filter-btn success ${filterType === 'real' ? 'active' : ''}`}
              onClick={() => setFilterType('real')}
            >
              Real ({history.filter((h) => h.prediction?.toLowerCase() === 'real').length})
            </button>
            <button
              className={`filter-btn danger ${filterType === 'fake' ? 'active' : ''}`}
              onClick={() => setFilterType('fake')}
            >
              Fake ({history.filter((h) => h.prediction?.toLowerCase() === 'fake').length})
            </button>
          </div>
        </div>
      )}

      {filteredHistory.length === 0 ? (
        <div className="history-empty">
          <History size={40} className="empty-icon" />
          <p>
            {history.length === 0
              ? 'No analysis history recorded yet. Upload an image to analyze!'
              : 'No history matching your search filters.'}
          </p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="history-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Filename</th>
                <th>Verdict</th>
                <th>Confidence</th>
                <th>Timestamp</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((item, index) => {
                const isReal = item.prediction?.toLowerCase() === 'real';
                return (
                  <tr key={item.id || index}>
                    <td>{index + 1}</td>
                    <td className="font-medium filename-cell" title={item.filename}>
                      <FileText size={16} className="table-file-icon" />
                      <span>{item.filename}</span>
                    </td>
                    <td>
                      <span className={`badge-verdict ${isReal ? 'verdict-real' : 'verdict-fake'}`}>
                        {isReal ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                        {item.prediction?.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className="table-confidence-cell">
                        <span className="confidence-num">{Number(item.confidence)?.toFixed(2)}%</span>
                        <div className="mini-progress-track">
                          <div
                            className={`mini-progress-fill ${isReal ? 'bg-success' : 'bg-danger'}`}
                            style={{ width: `${Math.min(100, Math.max(0, item.confidence))}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="text-subtle">
                      <Calendar size={12} className="inline-icon" />{' '}
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </td>
                    <td>
                      <span className="text-subtle small-text">
                        {item.formattedSize || 'Processed'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HistoryTable;
