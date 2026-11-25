import { clearAuthSession, getStoredConfig, saveCertificateFromExtension } from './api.js';

chrome.runtime.onInstalled.addListener(() => {
  // MV3 service worker initialized
});

function slugifyFilename(title) {
  const cleaned = (title || 'certificate')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${cleaned || 'certificate'}.png`;
}

async function fetchImageAsPngFile(imageUrl, title) {
  if (!imageUrl) return null;
  try {
    const resp = await fetch(imageUrl);
    if (!resp.ok) return null;
    const rawBlob = await resp.blob();
    if (!rawBlob || rawBlob.size < 1000) return null;

    // Decode and re-encode cleanly to PNG so backend magic-byte validation passes regardless of source format (WebP/JPG/PNG)
    if (typeof createImageBitmap === 'function' && typeof OffscreenCanvas === 'function') {
      const bitmap = await createImageBitmap(rawBlob);
      if (bitmap.width < 100 || bitmap.height < 60) {
        bitmap.close?.();
        return null;
      }
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close?.();
      const pngBlob = await canvas.convertToBlob({ type: 'image/png' });
      return new File([pngBlob], slugifyFilename(title), { type: 'image/png' });
    }

    if (rawBlob.type === 'image/png' || rawBlob.type === 'image/jpeg') {
      const ext = rawBlob.type === 'image/jpeg' ? 'jpg' : 'png';
      return new File([rawBlob], slugifyFilename(title).replace(/\.png$/, `.${ext}`), {
        type: rawBlob.type,
      });
    }
    return null;
  } catch {
    return null;
  }
}

async function uploadFileToExistingCertificate(certificateId, file) {
  const { token, apiUrl } = await getStoredConfig();
  if (!token) {
    const err = new Error('Please sign in to upload certificate files.');
    err.status = 401;
    throw err;
  }

  const formData = new FormData();
  formData.append('certificate_id', certificateId);
  formData.append('file', file);

  const resp = await fetch(`${apiUrl}/api/files/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (resp.status === 401) {
    await clearAuthSession();
    const err = new Error('Session expired. Please sign in again.');
    err.status = 401;
    throw err;
  }

  const data = await resp.json().catch(() => null);
  if (!resp.ok) {
    const err = new Error(data?.detail || `Upload failed (${resp.status})`);
    err.status = resp.status;
    throw err;
  }
  return data;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message !== 'object') return false;

  if (message.type === 'CV_GET_SAVED_URLS') {
    (async () => {
      try {
        const { token, apiUrl } = await getStoredConfig();
        if (!token) {
          sendResponse({ ok: false, status: 401, items: [] });
          return;
        }
        const resp = await fetch(`${apiUrl}/api/certificates?limit=500`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resp.status === 401) {
          await clearAuthSession();
          sendResponse({ ok: false, status: 401, items: [] });
          return;
        }
        if (!resp.ok) {
          sendResponse({ ok: false, status: resp.status, items: [] });
          return;
        }
        const data = await resp.json();
        const items = (data.items || [])
          .filter((item) => Boolean(item.certificate_url))
          .map((item) => ({
            id: item.id,
            certificate_url: item.certificate_url,
            has_file: Boolean(item.storage_path),
          }));
        sendResponse({ ok: true, items });
      } catch (err) {
        sendResponse({ ok: false, error: err?.message || 'Network error', items: [] });
      }
    })();
    return true;
  }

  if (message.type === 'CV_QUICK_SAVE') {
    (async () => {
      try {
        const file = await fetchImageAsPngFile(message.imageUrl, message.payload?.title);
        const created = await saveCertificateFromExtension({
          metadata: message.payload,
          file,
        });
        sendResponse({ ok: true, certificate: created, attachedImage: Boolean(file) });
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

  if (message.type === 'CV_ATTACH_IMAGE') {
    (async () => {
      try {
        const file = await fetchImageAsPngFile(message.imageUrl, message.title);
        if (!file) {
          sendResponse({ ok: false, error: 'Could not read certificate image from this card.' });
          return;
        }
        const updated = await uploadFileToExistingCertificate(message.certificateId, file);
        sendResponse({ ok: true, certificate: updated });
      } catch (err) {
        sendResponse({
          ok: false,
          status: err?.status || 500,
          error: err?.message || 'Failed to attach certificate image.',
        });
      }
    })();
    return true;
  }

  return false;
});
