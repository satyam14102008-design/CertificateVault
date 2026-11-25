import { apiFetchBlob, apiRequest } from './api';
import { renderPdfFirstPageUrl } from '../utils/pdfThumbnail';

const VIEW_MODE_KEY = 'cv_view_mode_v1';
const previewUrlCache = new Map();
const inflightPreviewRequests = new Map();

function getCacheKey(certificate) {
  return `${certificate.id}:${certificate.file?.storagePath || ''}:${certificate.updatedAt || ''}`;
}

export function invalidatePreviewCache(certificateId) {
  for (const [key, url] of previewUrlCache.entries()) {
    if (key.startsWith(`${certificateId}:`)) {
      URL.revokeObjectURL(url);
      previewUrlCache.delete(key);
    }
  }
}

function normalizeCertificate(raw) {
  if (!raw) return null;
  const hasFile = Boolean(raw.storage_path);
  return {
    id: raw.id,
    ownerId: raw.owner_id,
    title: raw.title || '',
    issuer: raw.issuer || '',
    category: raw.category || 'Other',
    issueDate: raw.issue_date || '',
    verificationUrl: raw.certificate_url || '',
    description: raw.description || '',
    isFavorite: Boolean(raw.is_favorite),
    file: hasFile
      ? {
          name: raw.original_filename || 'certificate',
          type: raw.file_type || 'application/octet-stream',
          size: raw.file_size || 0,
          storagePath: raw.storage_path,
        }
      : null,
    createdAt: raw.created_at || '',
    updatedAt: raw.updated_at || '',
  };
}

function normalizeStats(rawStats) {
  if (!rawStats) return null;
  return {
    total: rawStats.total || 0,
    favorites: rawStats.favorites || 0,
    courses: rawStats.courses || 0,
    internships: rawStats.internships || 0,
    hackathons: rawStats.hackathons || 0,
    filesAttachedCount: rawStats.files_attached_count || 0,
    storageUsedBytes: rawStats.storage_used_bytes || 0,
    byCategory: rawStats.by_category || [],
    issuers: rawStats.issuers || [],
  };
}

export async function listCertificates(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.category && params.category !== 'All') query.set('category', params.category);
  if (params.issuer && params.issuer !== 'All') query.set('issuer', params.issuer);
  if (params.favoritesOnly) query.set('favorites_only', 'true');
  if (params.sort) query.set('sort', params.sort);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  const res = await apiRequest(`/api/certificates${qs ? `?${qs}` : ''}`);
  return {
    items: (res.items || []).map(normalizeCertificate),
    total: res.total || 0,
    stats: normalizeStats(res.stats),
  };
}

export async function getCertificate(id) {
  const raw = await apiRequest(`/api/certificates/${encodeURIComponent(id)}`);
  return normalizeCertificate(raw);
}

export async function uploadCertificateFile(certificateId, file, onProgress) {
  if (onProgress) onProgress(35);
  const formData = new FormData();
  formData.append('certificate_id', certificateId);
  formData.append('file', file);

  const raw = await apiRequest('/api/files/upload', {
    method: 'POST',
    body: formData,
  });
  if (onProgress) onProgress(100);
  return normalizeCertificate(raw);
}

export async function deleteAttachedFile(certificateId) {
  invalidatePreviewCache(certificateId);
  const raw = await apiRequest(`/api/files/${encodeURIComponent(certificateId)}`, {
    method: 'DELETE',
  });
  return normalizeCertificate(raw);
}

export async function createCertificate(data, file = null, onProgress) {
  if (onProgress) onProgress(15);
  const payload = {
    title: data.title.trim(),
    issuer: (data.issuer || '').trim(),
    category: data.category || 'Other',
    issue_date: data.issueDate || '',
    certificate_url: (data.verificationUrl || '').trim(),
    description: (data.description || '').trim(),
    is_favorite: Boolean(data.isFavorite),
  };

  const createdRaw = await apiRequest('/api/certificates', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const created = normalizeCertificate(createdRaw);

  if (file) {
    try {
      return await uploadCertificateFile(created.id, file, onProgress);
    } catch (uploadErr) {
      // Roll back empty metadata record if initial file upload failed so user doesn't get half-created state
      await apiRequest(`/api/certificates/${encodeURIComponent(created.id)}`, {
        method: 'DELETE',
      }).catch(() => {});
      throw uploadErr;
    }
  }

  if (onProgress) onProgress(100);
  return created;
}

export async function updateCertificate(id, data, newFile = null, onProgress) {
  if (onProgress) onProgress(20);
  const payload = {};
  if (data.title !== undefined) payload.title = data.title.trim();
  if (data.issuer !== undefined) payload.issuer = (data.issuer || '').trim();
  if (data.category !== undefined) payload.category = data.category;
  if (data.issueDate !== undefined) payload.issue_date = data.issueDate || '';
  if (data.verificationUrl !== undefined) payload.certificate_url = (data.verificationUrl || '').trim();
  if (data.description !== undefined) payload.description = (data.description || '').trim();
  if (data.isFavorite !== undefined) payload.is_favorite = Boolean(data.isFavorite);

  let updated = normalizeCertificate(
    await apiRequest(`/api/certificates/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  );

  if (data.removeExistingFile && !newFile && updated.file) {
    updated = await deleteAttachedFile(id);
  }

  if (newFile) {
    invalidatePreviewCache(id);
    updated = await uploadCertificateFile(id, newFile, onProgress);
  } else if (onProgress) {
    onProgress(100);
  }

  return updated;
}

export async function deleteCertificate(id) {
  invalidatePreviewCache(id);
  await apiRequest(`/api/certificates/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return { id };
}

export async function toggleFavorite(certificate) {
  const raw = await apiRequest(`/api/certificates/${encodeURIComponent(certificate.id)}`, {
    method: 'PUT',
    body: JSON.stringify({ is_favorite: !certificate.isFavorite }),
  });
  return normalizeCertificate(raw);
}

export async function getCachedImageThumbnailUrl(certificate) {
  const mime = certificate?.file?.type || '';
  const isImage = mime.startsWith('image/');
  const isPdf = mime === 'application/pdf';
  if (!isImage && !isPdf) return null;

  const key = getCacheKey(certificate);
  if (previewUrlCache.has(key)) {
    return previewUrlCache.get(key);
  }
  if (inflightPreviewRequests.has(key)) {
    return inflightPreviewRequests.get(key);
  }

  const req = apiFetchBlob(`/api/files/${encodeURIComponent(certificate.id)}/preview`)
    .then(async ({ blob }) => {
      const objectUrl = isPdf
        ? await renderPdfFirstPageUrl(blob)
        : URL.createObjectURL(blob);
      if (objectUrl) {
        previewUrlCache.set(key, objectUrl);
      }
      return objectUrl;
    })
    .finally(() => {
      inflightPreviewRequests.delete(key);
    });

  inflightPreviewRequests.set(key, req);
  return req;
}

export async function getCertificateFilePreview(certificate) {
  if (!certificate?.file) return null;
  const { blob, filename, contentType } = await apiFetchBlob(
    `/api/files/${encodeURIComponent(certificate.id)}/preview`
  );
  return {
    url: URL.createObjectURL(blob),
    blob,
    name: filename || certificate.file.name,
    type: contentType || certificate.file.type,
    size: blob.size || certificate.file.size,
  };
}

export async function downloadCertificateFile(certificate) {
  if (!certificate?.file) {
    throw new Error('No downloadable file is attached to this certificate.');
  }
  const { blob, filename } = await apiFetchBlob(
    `/api/files/${encodeURIComponent(certificate.id)}/download`
  );
  const name = filename || certificate.file.name || 'certificate';
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return { filename: name };
}

export async function exportCertificates(format = 'json') {
  const { blob, filename } = await apiFetchBlob(
    `/api/certificates/export?format=${encodeURIComponent(format)}`
  );
  const fallbackName = `certificatevault-backup.${format === 'csv' ? 'csv' : 'json'}`;
  const finalName = filename || fallbackName;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = finalName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return { filename: finalName };
}

export function getViewPreference() {
  try {
    const value = localStorage.getItem(VIEW_MODE_KEY);
    return value === 'list' ? 'list' : 'grid';
  } catch {
    return 'grid';
  }
}

export function setViewPreference(mode) {
  try {
    localStorage.setItem(VIEW_MODE_KEY, mode === 'list' ? 'list' : 'grid');
  } catch {
    // ignore storage errors
  }
}
