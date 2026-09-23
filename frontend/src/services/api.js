import axios from 'axios';

// Default to 127.0.0.1:8000 with localhost fallback
let activeBaseUrl = 'http://127.0.0.1:8000';

const apiClient = axios.create({
  baseURL: activeBaseUrl,
  timeout: 30000,
});

/**
 * Check if the backend API is reachable at either 127.0.0.1 or localhost
 */
export const checkBackendHealth = async () => {
  const candidateUrls = ['http://127.0.0.1:8000', 'http://localhost:8000'];

  for (const url of candidateUrls) {
    try {
      const response = await axios.get(`${url}/health`, { timeout: 3000 });
      if (response.status === 200) {
        activeBaseUrl = url;
        apiClient.defaults.baseURL = url;
        return { online: true, data: response.data, url };
      }
    } catch {
      // Try next candidate
    }
  }

  return { online: false, error: 'Could not connect to FastAPI backend on port 8000.' };
};

/**
 * Send image file to backend /predict endpoint
 * Backend expects multipart/form-data with field name 'file'
 * Returns: { filename: string, prediction: 'real' | 'fake', confidence: number }
 */
export const predictImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await apiClient.post('/predict', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return { success: true, data: response.data };
  } catch (error) {
    // If request failed with network error, attempt one fallback retry on alternative host
    if (error.request && !error.response) {
      const altUrl = activeBaseUrl.includes('127.0.0.1')
        ? 'http://localhost:8000'
        : 'http://127.0.0.1:8000';
      try {
        const altResponse = await axios.post(`${altUrl}/predict`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 30000,
        });
        activeBaseUrl = altUrl;
        apiClient.defaults.baseURL = altUrl;
        return { success: true, data: altResponse.data };
      } catch {
        // Fallthrough to standard error reporting
      }
    }

    let errorMessage = 'Failed to process request. Please try again.';
    let isNetworkError = false;

    if (error.response) {
      errorMessage = error.response.data?.detail || `Server error (${error.response.status}).`;
    } else if (error.request) {
      errorMessage = 'Backend API unavailable. Please verify that FastAPI server is running on http://127.0.0.1:8000';
      isNetworkError = true;
    } else {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
      isNetworkError,
    };
  }
};

/**
 * Send video file to backend /predict/video endpoint
 * Backend extracts keyframes, runs CNN per frame, and aggregates predictions
 */
export const predictVideo = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await apiClient.post('/predict/video', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // Allow up to 2 minutes for multi-frame video extraction & inference
    });
    return { success: true, data: response.data };
  } catch (error) {
    if (error.request && !error.response) {
      const altUrl = activeBaseUrl.includes('127.0.0.1')
        ? 'http://localhost:8000'
        : 'http://127.0.0.1:8000';
      try {
        const altResponse = await axios.post(`${altUrl}/predict/video`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 120000,
        });
        activeBaseUrl = altUrl;
        apiClient.defaults.baseURL = altUrl;
        return { success: true, data: altResponse.data };
      } catch {
        // Fallthrough
      }
    }

    let errorMessage = 'Failed to process video analysis. Please try again.';
    let isNetworkError = false;

    if (error.response) {
      errorMessage = error.response.data?.detail || `Server error (${error.response.status}).`;
    } else if (error.request) {
      errorMessage = 'Backend API unavailable. Please verify that FastAPI server is running on http://127.0.0.1:8000';
      isNetworkError = true;
    } else {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
      isNetworkError,
    };
  }
};

export default apiClient;

