import { CATEGORIES } from './categories';
import { getTodayISO } from './formatDate';

export const ALLOWED_MIME_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];
export const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg'];
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_DESCRIPTION_LENGTH = 1000;

const VALID_CATEGORY_IDS = new Set(CATEGORIES.map((c) => c.id));

export function validateFile(file) {
  if (!file) return { valid: false, error: 'No file selected.' };

  const lowerName = (file.name || '').toLowerCase();
  const hasAllowedExtension = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  const hasAllowedMime = ALLOWED_MIME_TYPES.includes(file.type);

  if (!hasAllowedMime && !hasAllowedExtension) {
    return {
      valid: false,
      error: 'Unsupported file format. Please upload a PDF, PNG, or JPG file.',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'File exceeds the 10 MB limit. Please choose a smaller file.',
    };
  }

  return { valid: true };
}

export function isValidHttpUrl(value) {
  if (!value) return true;
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate certificate form fields.
 * Title is required; issuer, category, issueDate, verificationUrl, and description are optional.
 */
export function validateCertificateForm(values) {
  const errors = {};
  const title = (values.title || '').trim();
  const issuer = (values.issuer || '').trim();
  const category = values.category || 'Other';
  const issueDate = (values.issueDate || '').trim();
  const verificationUrl = (values.verificationUrl || '').trim();
  const description = values.description || '';

  if (!title) {
    errors.title = 'Certificate title is required.';
  } else if (title.length > 160) {
    errors.title = 'Title must be 160 characters or fewer.';
  }

  if (issuer.length > 120) {
    errors.issuer = 'Issuer must be 120 characters or fewer.';
  }

  if (category && !VALID_CATEGORY_IDS.has(category)) {
    errors.category = 'Please select a valid category.';
  }

  if (issueDate && issueDate > getTodayISO()) {
    errors.issueDate = 'Issue date cannot be in the future.';
  }

  if (verificationUrl && !isValidHttpUrl(verificationUrl)) {
    errors.verificationUrl = 'Enter a valid URL starting with https:// or http://.';
  }

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    errors.description = `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
