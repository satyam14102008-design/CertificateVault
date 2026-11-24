/**
 * Central API client wrapper for the CertificateVault FastAPI backend.
 */

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

let authTokenProvider = () => null;
let unauthorizedHandler = null;

export function setAuthTokenProvider(provider) {
  authTokenProvider = typeof provider === 'function' ? provider : () => null;
}

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = typeof handler === 'function' ? handler : null;
}

export class ApiError extends Error {
  constructor(message, status, code = 'API_ERROR', details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function buildHeaders(options = {}) {
  const token = authTokenProvider();
  const isFormData = options.body instanceof FormData;
  return {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
}

function extractErrorMessage(payload, status) {
  if (!payload) return `Request failed with status ${status}`;
  if (typeof payload === 'string') return payload;
  if (Array.isArray(payload.detail) && payload.detail.length > 0) {
    const first = payload.detail[0];
    return first?.msg || `Validation error (${status})`;
  }
  return payload.detail || payload.message || `Request failed with status ${status}`;
}

export async function apiRequest(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  let response;

  try {
    response = await fetch(url, {
      ...options,
      headers: buildHeaders(options),
    });
  } catch (networkErr) {
    throw new ApiError(
      'Unable to reach the CertificateVault server. Make sure the backend is running.',
      0,
      'NETWORK_ERROR',
      networkErr?.message || null
    );
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && unauthorizedHandler && !options.skipAuthRedirect) {
      unauthorizedHandler();
    }
    throw new ApiError(
      extractErrorMessage(payload, response.status),
      response.status,
      'HTTP_ERROR',
      payload
    );
  }

  return payload;
}

export async function apiFetchBlob(path) {
  const url = `${API_BASE_URL}${path}`;
  let response;

  try {
    response = await fetch(url, {
      method: 'GET',
      headers: buildHeaders(),
    });
  } catch (networkErr) {
    throw new ApiError(
      'Unable to reach the CertificateVault server.',
      0,
      'NETWORK_ERROR',
      networkErr?.message || null
    );
  }

  if (!response.ok) {
    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json')
      ? await response.json().catch(() => null)
      : null;
    if (response.status === 401 && unauthorizedHandler) {
      unauthorizedHandler();
    }
    throw new ApiError(
      extractErrorMessage(payload, response.status),
      response.status,
      'HTTP_ERROR',
      payload
    );
  }

  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition') || '';
  const match = disposition.match(/filename="([^"]+)"/i);
  return {
    blob,
    filename: match ? match[1] : null,
    contentType: response.headers.get('content-type') || blob.type,
  };
}

export { API_BASE_URL };
