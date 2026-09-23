/**
 * Utility functions for file handling, validation, and metadata extraction.
 */

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/tiff'
];

export const MAX_FILE_SIZE_MB = 15;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * Format bytes into readable string (KB, MB, GB)
 */
export const formatBytes = (bytes, decimals = 2) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Extract image dimensions (width, height) using HTML Image object
 */
export const getImageDimensions = (file) => {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/')) {
      resolve({ width: null, height: null });
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };

    img.onerror = () => {
      resolve({ width: null, height: null });
      URL.revokeObjectURL(url);
    };

    img.src = url;
  });
};

/**
 * Validate file before uploading
 */
export const validateFile = (file) => {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    const ext = file.name.split('.').pop()?.toUpperCase() || 'unknown';
    return {
      valid: false,
      error: `Invalid file format (.${ext}). Supported formats: JPG, PNG, WEBP, GIF, BMP, TIFF.`
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size (${formatBytes(file.size)}) exceeds maximum limit of ${MAX_FILE_SIZE_MB}MB.`
    };
  }

  return { valid: true };
};
