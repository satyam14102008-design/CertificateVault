import { clearAuthSession, getStoredConfig, saveCertificateFromExtension } from './api.js';

chrome.runtime.onInstalled.addListener(() => {
  // MV3 service worker initialized
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message !== 'object') return false;

  if (message.type === 'CV_GET_SAVED_URLS') {
    (async () => {
      try {
        const { token, apiUrl } = await getStoredConfig();
        if (!token) {
          sendResponse({ ok: false, status: 401, urls: [] });
          return;
        }
        const resp = await fetch(`${apiUrl}/api/certificates?limit=500`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resp.status === 401) {
          await clearAuthSession();
          sendResponse({ ok: false, status: 401, urls: [] });
          return;
        }
        if (!resp.ok) {
          sendResponse({ ok: false, status: resp.status, urls: [] });
          return;
        }
        const data = await resp.json();
        const urls = (data.items || [])
          .map((item) => item.certificate_url)
          .filter(Boolean);
        sendResponse({ ok: true, urls });
      } catch (err) {
        sendResponse({ ok: false, error: err?.message || 'Network error', urls: [] });
      }
    })();
    return true;
  }

  if (message.type === 'CV_QUICK_SAVE') {
    (async () => {
      try {
        const created = await saveCertificateFromExtension({
          metadata: message.payload,
          file: null,
        });
        sendResponse({ ok: true, certificate: created });
      } catch (err) {
        sendResponse({
          ok: false,
          status: err?.status || 500,
          error: err?.message || 'Failed to save certificate.',
        });
      }
    })();
    return true;
  }

  return false;
});
