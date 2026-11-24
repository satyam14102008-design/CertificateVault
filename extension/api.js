export const DEFAULT_API_BASE_URL = 'http://localhost:8000';
export const DEFAULT_FRONTEND_URL = 'http://localhost:5173';

const STORAGE_KEYS = {
  TOKEN: 'cv_ext_token',
  EMAIL: 'cv_ext_email',
  API_URL: 'cv_ext_api_url',
  FRONTEND_URL: 'cv_ext_frontend_url',
};

export async function getStoredConfig() {
  const result = await chrome.storage.local.get([
    STORAGE_KEYS.TOKEN,
    STORAGE_KEYS.EMAIL,
    STORAGE_KEYS.API_URL,
    STORAGE_KEYS.FRONTEND_URL,
  ]);
  return {
    token: result[STORAGE_KEYS.TOKEN] || null,
    email: result[STORAGE_KEYS.EMAIL] || null,
    apiUrl: (result[STORAGE_KEYS.API_URL] || DEFAULT_API_BASE_URL).replace(/\/$/, ''),
    frontendUrl: (result[STORAGE_KEYS.FRONTEND_URL] || DEFAULT_FRONTEND_URL).replace(/\/$/, ''),
  };
}

export async function saveAuthSession(token, email) {
  await chrome.storage.local.set({
    [STORAGE_KEYS.TOKEN]: token,
    [STORAGE_KEYS.EMAIL]: email,
  });
}

export async function clearAuthSession() {
  await chrome.storage.local.remove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.EMAIL]);
}

export async function saveEndpointSettings(apiUrl, frontendUrl) {
  await chrome.storage.local.set({
    [STORAGE_KEYS.API_URL]: apiUrl.trim().replace(/\/$/, ''),
    [STORAGE_KEYS.FRONTEND_URL]: frontendUrl.trim().replace(/\/$/, ''),
  });
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null);

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    if (data && typeof data === 'object') {
      if (Array.isArray(data.detail) && data.detail[0]?.msg) {
        message = data.detail[0].msg;
      } else if (data.detail) {
        message = data.detail;
      }
    }
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }
  return data;
}

export async function loginOwner(email, password) {
  const { apiUrl } = await getStoredConfig();
  const response = await fetch(`${apiUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await parseResponse(response);
  await saveAuthSession(data.access_token, data.user.email);
  return data.user;
}

export async function verifySession() {
  const { token, apiUrl } = await getStoredConfig();
  if (!token) return null;

  const response = await fetch(`${apiUrl}/api/auth/me`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 401) {
    await clearAuthSession();
    return null;
  }
  return parseResponse(response);
}

export async function saveCertificateFromExtension({ metadata, file }) {
  const { token, apiUrl } = await getStoredConfig();
  if (!token) {
    const err = new Error('Please sign in to save certificates.');
    err.status = 401;
    throw err;
  }

  const createRes = await fetch(`${apiUrl}/api/certificates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(metadata),
  });

  if (createRes.status === 401) {
    await clearAuthSession();
    const err = new Error('Session expired. Please sign in again.');
    err.status = 401;
    throw err;
  }

  const created = await parseResponse(createRes);

  if (file) {
    const formData = new FormData();
    formData.append('certificate_id', created.id);
    formData.append('file', file);

    const uploadRes = await fetch(`${apiUrl}/api/files/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!uploadRes.ok) {
      // Roll back empty metadata record if file upload fails
      await fetch(`${apiUrl}/api/certificates/${encodeURIComponent(created.id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
      await parseResponse(uploadRes);
    }

    return parseResponse(uploadRes);
  }

  return created;
}
