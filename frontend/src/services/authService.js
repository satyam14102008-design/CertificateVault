import { apiRequest } from './api';

const TOKEN_KEY = 'cv_auth_token';

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

export function setStoredToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export function clearStoredToken() {
  setStoredToken(null);
}

export async function login(email, password) {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    skipAuthRedirect: true,
  });
}

export async function getMe() {
  return apiRequest('/api/auth/me', {
    method: 'GET',
    skipAuthRedirect: true,
  });
}
