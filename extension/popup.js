import {
  clearAuthSession,
  getStoredConfig,
  loginOwner,
  saveCertificateFromExtension,
  verifySession,
} from './api.js';

const authPill = document.getElementById('auth-pill');
const feedbackBanner = document.getElementById('feedback-banner');
const loginView = document.getElementById('login-view');
const saveView = document.getElementById('save-view');

const loginForm = document.getElementById('login-form');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginSubmit = document.getElementById('login-submit');
const openWebappLoginBtn = document.getElementById('open-webapp-login');

const sessionEmailEl = document.getElementById('session-email');
const openDashboardBtn = document.getElementById('open-dashboard-btn');
const logoutBtn = document.getElementById('logout-btn');

const saveForm = document.getElementById('save-form');
const titleInput = document.getElementById('cert-title');
const urlInput = document.getElementById('cert-url');
const clearUrlBtn = document.getElementById('clear-url-btn');
const issuerInput = document.getElementById('cert-issuer');
const categorySelect = document.getElementById('cert-category');
const dateInput = document.getElementById('cert-date');
const fileInput = document.getElementById('cert-file');
const fileChip = document.getElementById('file-chip');
const fileChipName = document.getElementById('file-chip-name');
const clearFileBtn = document.getElementById('clear-file-btn');
const descriptionInput = document.getElementById('cert-description');
const saveSubmit = document.getElementById('save-submit');

const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg'];
const MAX_FILE_BYTES = 10 * 1024 * 1024;

function showBanner(message, type = 'success') {
  feedbackBanner.textContent = message;
  feedbackBanner.className = `banner banner-${type}`;
}

function hideBanner() {
  feedbackBanner.className = 'banner hidden';
  feedbackBanner.textContent = '';
}

function setAuthState(owner) {
  if (owner) {
    authPill.textContent = 'Connected';
    authPill.className = 'auth-pill auth-pill-online';
    sessionEmailEl.textContent = owner.email;
    loginView.classList.add('hidden');
    saveView.classList.remove('hidden');
  } else {
    authPill.textContent = 'Signed out';
    authPill.className = 'auth-pill auth-pill-offline';
    saveView.classList.add('hidden');
    loginView.classList.remove('hidden');
  }
}

async function prefillFromActiveTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    if (tab.title && !titleInput.value.trim()) {
      titleInput.value = tab.title.trim().slice(0, 160);
    }
    if (tab.url && (tab.url.startsWith('https://') || tab.url.startsWith('http://'))) {
      urlInput.value = tab.url;
    }
  } catch {
    // Active tab unavailable on restricted browser pages
  }
}

function initDateMax() {
  const today = new Date().toISOString().slice(0, 10);
  dateInput.max = today;
}

fileInput.addEventListener('change', () => {
  hideBanner();
  const file = fileInput.files?.[0];
  if (!file) {
    fileChip.classList.add('hidden');
    return;
  }

  const lower = file.name.toLowerCase();
  if (!ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
    fileInput.value = '';
    fileChip.classList.add('hidden');
    showBanner('Only PDF, PNG, or JPG files are allowed.', 'error');
    return;
  }

  if (file.size > MAX_FILE_BYTES) {
    fileInput.value = '';
    fileChip.classList.add('hidden');
    showBanner('File exceeds the 10 MB limit.', 'error');
    return;
  }

  fileChipName.textContent = `${file.name} (${Math.max(1, Math.round(file.size / 1024))} KB)`;
  fileChip.classList.remove('hidden');
});

clearFileBtn.addEventListener('click', () => {
  fileInput.value = '';
  fileChip.classList.add('hidden');
});

clearUrlBtn.addEventListener('click', () => {
  urlInput.value = '';
});

openWebappLoginBtn.addEventListener('click', async () => {
  const { frontendUrl } = await getStoredConfig();
  chrome.tabs.create({ url: `${frontendUrl}/login` });
});

openDashboardBtn.addEventListener('click', async () => {
  const { frontendUrl } = await getStoredConfig();
  chrome.tabs.create({ url: `${frontendUrl}/certificates` });
});

logoutBtn.addEventListener('click', async () => {
  await clearAuthSession();
  hideBanner();
  setAuthState(null);
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideBanner();

  const email = loginEmail.value.trim();
  const password = loginPassword.value;
  if (!email || !password) {
    showBanner('Enter both email and password.', 'error');
    return;
  }

  loginSubmit.disabled = true;
  loginSubmit.textContent = 'Signing in...';
  try {
    const owner = await loginOwner(email, password);
    loginPassword.value = '';
    setAuthState(owner);
    await prefillFromActiveTab();
    showBanner('Signed in to CertificateVault.', 'success');
  } catch (err) {
    showBanner(err.message || 'Sign in failed.', 'error');
  } finally {
    loginSubmit.disabled = false;
    loginSubmit.textContent = 'Sign In';
  }
});

saveForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideBanner();

  const title = titleInput.value.trim();
  const certificateUrl = urlInput.value.trim();
  const file = fileInput.files?.[0] || null;

  if (!title) {
    showBanner('Certificate title is required.', 'error');
    return;
  }

  if (certificateUrl && !(certificateUrl.startsWith('https://') || certificateUrl.startsWith('http://'))) {
    showBanner('URL must start with https:// or http://.', 'error');
    return;
  }

  if (!certificateUrl && !file) {
    showBanner('Provide the page URL, attach a file, or both.', 'error');
    return;
  }

  saveSubmit.disabled = true;
  saveSubmit.textContent = file ? 'Uploading & Saving...' : 'Saving...';

  try {
    await saveCertificateFromExtension({
      metadata: {
        title,
        issuer: issuerInput.value.trim(),
        category: categorySelect.value,
        issue_date: dateInput.value || '',
        certificate_url: certificateUrl,
        description: descriptionInput.value.trim(),
        is_favorite: false,
      },
      file,
    });

    fileInput.value = '';
    fileChip.classList.add('hidden');
    showBanner(`Saved "${title}" to CertificateVault!`, 'success');
  } catch (err) {
    if (err.status === 401) {
      setAuthState(null);
    }
    showBanner(err.message || 'Unable to save certificate.', 'error');
  } finally {
    saveSubmit.disabled = false;
    saveSubmit.textContent = 'Save Certificate';
  }
});

async function init() {
  initDateMax();
  try {
    const owner = await verifySession();
    setAuthState(owner);
    if (owner) {
      await prefillFromActiveTab();
    }
  } catch (err) {
    setAuthState(null);
    showBanner(err.message || 'Cannot reach CertificateVault backend.', 'error');
  }
}

init();
