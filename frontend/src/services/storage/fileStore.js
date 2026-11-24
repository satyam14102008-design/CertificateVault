/**
 * IndexedDB binary file store for CertificateVault.
 * Keeps uploaded certificate Blobs (PDF / PNG / JPG) out of localStorage.
 */

const DB_NAME = 'certificatevault_files_db';
const DB_VERSION = 1;
const STORE_NAME = 'files';

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is unavailable in this browser.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'storageKey' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB.'));
  });
}

/**
 * Save a Blob or File into IndexedDB under a unique storageKey.
 * @param {string} storageKey
 * @param {Blob|File} blob
 * @param {{ name?: string, type?: string, size?: number }} [meta]
 * @returns {Promise<void>}
 */
export async function saveFile(storageKey, blob, meta = {}) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    store.put({
      storageKey,
      blob,
      name: meta.name || blob.name || 'certificate',
      type: meta.type || blob.type || 'application/octet-stream',
      size: meta.size ?? blob.size ?? 0,
      updatedAt: new Date().toISOString(),
    });

    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error || new Error('Failed to save file to IndexedDB.'));
    };
  });
}

/**
 * Retrieve a stored file record from IndexedDB.
 * @param {string} storageKey
 * @returns {Promise<{ storageKey: string, blob: Blob, name: string, type: string, size: number } | null>}
 */
export async function getFile(storageKey) {
  if (!storageKey) return null;
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(storageKey);

    request.onsuccess = () => {
      db.close();
      resolve(request.result || null);
    };
    request.onerror = () => {
      db.close();
      reject(request.error || new Error('Failed to read file from IndexedDB.'));
    };
  });
}

/**
 * Delete a file record from IndexedDB.
 * @param {string} storageKey
 * @returns {Promise<void>}
 */
export async function deleteFile(storageKey) {
  if (!storageKey) return;
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(storageKey);

    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error || new Error('Failed to delete file from IndexedDB.'));
    };
  });
}

/**
 * Clear every stored file from IndexedDB.
 * @returns {Promise<void>}
 */
export async function clearAllFiles() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error || new Error('Failed to clear IndexedDB files.'));
    };
  });
}

/**
 * Sum the byte size of all stored blobs in IndexedDB.
 * @returns {Promise<number>}
 */
export async function getStoredBytesTotal() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      db.close();
      const items = request.result || [];
      const total = items.reduce((acc, item) => acc + (item.size || item.blob?.size || 0), 0);
      resolve(total);
    };
    request.onerror = () => {
      db.close();
      reject(request.error || new Error('Failed to compute stored bytes.'));
    };
  });
}

/**
 * Generate a valid single-page PDF 1.4 Blob for seed PDF certificates
 * so iframe preview and file download work seamlessly out-of-the-box.
 * @param {{ title: string, issuer: string, issueDate: string, category: string }} cert
 * @returns {Blob}
 */
export function buildSeedPdfBlob(cert) {
  const clean = (str) =>
    String(str || '')
      .replace(/[^\x20-\x7E]/g, '')
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .slice(0, 72);

  const streamContent = [
    'BT',
    '/F1 11 Tf',
    '0.145 0.388 0.922 rg',
    '72 720 Td',
    '(CERTIFICATEVAULT VERIFIED CREDENTIAL) Tj',
    '0 0 0 rg',
    '/F1 20 Tf',
    '0 -36 Td',
    `(${clean(cert.title)}) Tj`,
    '/F1 13 Tf',
    '0.278 0.333 0.412 rg',
    '0 -28 Td',
    `(Issued by: ${clean(cert.issuer)}) Tj`,
    '0 -22 Td',
    `(Category: ${clean(cert.category)}   |   Issue Date: ${clean(cert.issueDate)}) Tj`,
    '0 -34 Td',
    '(Awarded to: Aarav Sharma) Tj',
    '0 -26 Td',
    '/F1 10 Tf',
    '(This PDF credential is stored locally in CertificateVault demo mode.) Tj',
    'ET',
  ].join('\n');

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }
  const xrefPos = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
}

/**
 * Convert an SVG data URL thumbnail into a real PNG Blob via offscreen canvas
 * so seed image certificates download and preview as real PNGs.
 * @param {string} svgDataUrl
 * @returns {Promise<Blob>}
 */
export async function buildSeedPngBlob(svgDataUrl) {
  if (!svgDataUrl || typeof document === 'undefined') {
    return new Blob([], { type: 'image/png' });
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 960;
      canvas.height = 630;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        resolve(blob || new Blob([], { type: 'image/png' }));
      }, 'image/png');
    };
    img.onerror = () => resolve(new Blob([], { type: 'image/png' }));
    img.src = svgDataUrl;
  });
}
