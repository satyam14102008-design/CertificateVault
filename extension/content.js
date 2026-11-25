(() => {
  const MONTHS = {
    january: '01',
    february: '02',
    march: '03',
    april: '04',
    may: '05',
    june: '06',
    july: '07',
    august: '08',
    september: '09',
    october: '10',
    november: '11',
    december: '12',
  };

  let savedItemsMap = new Map();

  function parseCourseraDate(text) {
    const match = (text || '').match(
      /(?:Completed|Issued)\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i
    );
    if (!match) return '';
    const month = MONTHS[match[1].toLowerCase()];
    const year = match[2];
    const candidate = `${year}-${month}-01`;
    const today = new Date().toISOString().slice(0, 10);
    return candidate > today ? today : candidate;
  }

  function normalizeUrl(href) {
    try {
      const url = new URL(href, window.location.origin);
      return `${url.origin}${url.pathname}${url.search}`;
    } catch {
      return href || '';
    }
  }

  function findCardContainer(viewLink) {
    let node = viewLink.parentElement;
    for (let i = 0; i < 6 && node; i += 1) {
      const text = (node.innerText || '').trim();
      if (text.length > 25 && text.length < 900 && (node.querySelector('h2, h3, h4') || text.includes('Completed'))) {
        return node;
      }
      node = node.parentElement;
    }
    return viewLink.closest('li, article, [data-testid*="card"]') || viewLink.parentElement;
  }

  function findLargestImageUrl(container) {
    if (!container) return '';
    const imgs = Array.from(container.querySelectorAll('img'));
    let bestSrc = '';
    let bestArea = 0;

    for (const img of imgs) {
      const src = img.currentSrc || img.src || '';
      if (!src) continue;
      const w = img.naturalWidth || img.clientWidth || 0;
      const h = img.naturalHeight || img.clientHeight || 0;
      const area = w * h;
      // Ignore small university/partner logos (~40x40) so we never save a tiny logo as the certificate
      if (w >= 160 && h >= 100 && area > bestArea) {
        bestArea = area;
        bestSrc = src;
      }
    }
    return bestSrc;
  }

  function extractCourseraCardData(viewLink) {
    const certificateUrl = normalizeUrl(viewLink.href);
    const card = findCardContainer(viewLink);
    const rawText = (card?.innerText || '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const headingEl = card?.querySelector('h1, h2, h3, h4, [data-testid*="title"], [class*="title"]');
    let title = headingEl?.textContent?.trim() || '';

    const ignoredPatterns =
      /^(Add to LinkedIn|View certificate|Completed |Issued |Course|Specialization|Professional Certificate|\+ Save to Vault|\+ Attach Image|In Vault|Saved|Image Attached)/i;
    const usefulLines = rawText.filter((line) => !ignoredPatterns.test(line));

    if (!title && usefulLines.length > 0) {
      title = usefulLines[0];
    }

    let issuer = 'Coursera';
    const titleIdx = usefulLines.findIndex((l) => l === title);
    if (titleIdx !== -1 && usefulLines[titleIdx + 1]) {
      issuer = usefulLines[titleIdx + 1];
    } else if (usefulLines.length > 1 && usefulLines[1] !== title) {
      issuer = usefulLines[1];
    }

    const issueDate = parseCourseraDate(card?.innerText || '');
    const imageUrl = findLargestImageUrl(card);

    return {
      payload: {
        title: (title || 'Coursera Certificate').slice(0, 160),
        issuer: issuer.slice(0, 120),
        category: 'Courses',
        issue_date: issueDate,
        certificate_url: certificateUrl,
        description: '',
        is_favorite: false,
      },
      imageUrl,
    };
  }

  async function syncSavedUrls() {
    try {
      const resp = await chrome.runtime.sendMessage({ type: 'CV_GET_SAVED_URLS' });
      if (resp?.ok && Array.isArray(resp.items)) {
        const nextMap = new Map();
        for (const item of resp.items) {
          nextMap.set(normalizeUrl(item.certificate_url), {
            id: item.id,
            has_file: Boolean(item.has_file),
          });
        }
        savedItemsMap = nextMap;
      }
    } catch {
      // Ignore if service worker is waking up
    }
  }

  function updateButtonState(btn, state, label) {
    btn.classList.remove('cv-inline-btn-saved', 'cv-inline-btn-error');
    if (state === 'saved') {
      btn.classList.add('cv-inline-btn-saved');
      btn.disabled = true;
    } else if (state === 'error') {
      btn.classList.add('cv-inline-btn-error');
      btn.disabled = false;
    } else if (state === 'loading') {
      btn.disabled = true;
    } else {
      btn.disabled = false;
    }
    btn.textContent = label;
  }

  function applySavedStateToButton(btn, certUrl) {
    const existing = savedItemsMap.get(certUrl);
    if (!existing) {
      updateButtonState(btn, 'idle', '+ Save to Vault');
    } else if (!existing.has_file) {
      updateButtonState(btn, 'idle', '+ Attach Image');
    } else {
      updateButtonState(btn, 'saved', 'In Vault ✓');
    }
  }

  async function handleCardButtonClick(btn, link) {
    const certUrl = normalizeUrl(link.href);
    const { payload, imageUrl } = extractCourseraCardData(link);
    const existing = savedItemsMap.get(certUrl);
    updateButtonState(btn, 'loading', existing ? 'Attaching...' : 'Saving...');

    try {
      if (existing && !existing.has_file) {
        const resp = await chrome.runtime.sendMessage({
          type: 'CV_ATTACH_IMAGE',
          certificateId: existing.id,
          certificateUrl: certUrl,
          imageUrl,
          title: payload.title,
        });
        if (resp?.ok) {
          savedItemsMap.set(certUrl, { id: existing.id, has_file: true });
          updateButtonState(btn, 'saved', 'Image Attached ✓');
          refreshBatchSyncButton();
          return true;
        }
        const msg =
          resp?.status === 401
            ? 'Sign in via extension icon'
            : resp?.error || 'Attach failed';
        updateButtonState(btn, 'error', msg);
        if (resp?.status !== 401) {
          setTimeout(() => applySavedStateToButton(btn, certUrl), 3000);
        }
        return false;
      }

      const resp = await chrome.runtime.sendMessage({
        type: 'CV_QUICK_SAVE',
        payload,
        imageUrl,
      });
      if (resp?.ok) {
        savedItemsMap.set(certUrl, {
          id: resp.certificate?.id,
          has_file: Boolean(resp.attachedImage),
        });
        updateButtonState(
          btn,
          'saved',
          resp.attachedImage ? 'Saved + Image ✓' : 'Saved ✓'
        );
        refreshBatchSyncButton();
        return true;
      }
      const msg =
        resp?.status === 401
          ? 'Sign in via extension icon'
          : resp?.error || 'Save failed';
      updateButtonState(btn, 'error', msg);
      if (resp?.status !== 401) {
        setTimeout(() => applySavedStateToButton(btn, certUrl), 3000);
      }
      return false;
    } catch {
      updateButtonState(btn, 'error', 'Retry');
      return false;
    }
  }

  function injectCourseraListButtons() {
    const links = Array.from(document.querySelectorAll('a')).filter((a) => {
      const text = (a.textContent || '').trim().toLowerCase();
      const href = a.getAttribute('href') || '';
      return text === 'view certificate' || href.includes('/account/accomplishments/');
    });

    for (const link of links) {
      const parent = link.parentElement;
      if (!parent || parent.querySelector('.cv-inline-btn')) continue;

      const certUrl = normalizeUrl(link.href);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cv-inline-btn';
      btn.dataset.cvUrl = certUrl;

      applySavedStateToButton(btn, certUrl);

      btn.addEventListener('click', async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await handleCardButtonClick(btn, link);
      });

      link.insertAdjacentElement('afterend', btn);
    }
  }

  function refreshBatchSyncButton() {
    if (isSingleCertificatePage()) return;
    const missingBtns = Array.from(document.querySelectorAll('.cv-inline-btn')).filter((btn) => {
      const url = btn.dataset.cvUrl;
      const item = url ? savedItemsMap.get(url) : null;
      return item && !item.has_file && !btn.disabled;
    });

    let wrap = document.querySelector('.cv-batch-wrap');
    if (missingBtns.length === 0) {
      wrap?.remove();
      return;
    }

    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'cv-floating-wrap cv-batch-wrap';

      const batchBtn = document.createElement('button');
      batchBtn.type = 'button';
      batchBtn.className = 'cv-floating-btn';
      batchBtn.addEventListener('click', async () => {
        const targets = Array.from(document.querySelectorAll('.cv-inline-btn')).filter((b) => {
          const item = savedItemsMap.get(b.dataset.cvUrl);
          return item && !item.has_file && !b.disabled;
        });
        batchBtn.disabled = true;
        let done = 0;
        for (const targetBtn of targets) {
          done += 1;
          batchBtn.textContent = `Attaching images (${done}/${targets.length})...`;
          targetBtn.click();
          await new Promise((r) => setTimeout(r, 450));
        }
        batchBtn.disabled = false;
        refreshBatchSyncButton();
      });

      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'cv-floating-close';
      closeBtn.textContent = '×';
      closeBtn.setAttribute('aria-label', 'Dismiss batch attach button');
      closeBtn.addEventListener('click', () => wrap.remove());

      wrap.appendChild(batchBtn);
      wrap.appendChild(closeBtn);
      document.body.appendChild(wrap);
    }

    const btnEl = wrap.querySelector('.cv-floating-btn');
    if (btnEl && !btnEl.disabled) {
      btnEl.textContent = `+ Attach ${missingBtns.length} Missing Images`;
    }
  }

  function refreshSavedButtonBadges() {
    document.querySelectorAll('.cv-inline-btn').forEach((btn) => {
      const url = btn.dataset.cvUrl;
      if (url && !btn.disabled && btn.textContent !== 'Saving...' && btn.textContent !== 'Attaching...') {
        applySavedStateToButton(btn, url);
      }
    });
    refreshBatchSyncButton();
  }

  function inferPageMetadata() {
    const host = window.location.hostname.replace(/^www\./, '');
    let issuer = '';
    if (host.includes('coursera.org')) issuer = 'Coursera';
    else if (host.includes('freecodecamp.org')) issuer = 'freeCodeCamp';
    else if (host.includes('udemy.com')) issuer = 'Udemy';
    else if (host.includes('credly.com')) issuer = 'Credly';
    else if (host.includes('hackerrank.com')) issuer = 'HackerRank';
    else if (host.includes('cloudskillsboost.google') || host.includes('skills.google')) {
      issuer = 'Google Cloud';
    }

    const h1 = document.querySelector('h1')?.textContent?.trim() || '';
    const rawTitle = h1 || document.title || 'Verified Certificate';
    const cleanTitle = rawTitle
      .replace(/\s*[|\-–]\s*(Coursera|freeCodeCamp|Udemy|Credly|HackerRank).*$/i, '')
      .trim()
      .slice(0, 160);

    const imageUrl = findLargestImageUrl(document.querySelector('main') || document.body);

    return {
      payload: {
        title: cleanTitle || 'Verified Certificate',
        issuer,
        category: 'Courses',
        issue_date: '',
        certificate_url: normalizeUrl(window.location.href),
        description: '',
        is_favorite: false,
      },
      imageUrl,
    };
  }

  function isSingleCertificatePage() {
    const href = window.location.href;
    return (
      href.includes('/account/accomplishments/certificate/') ||
      href.includes('/account/accomplishments/specialization/') ||
      href.includes('/account/accomplishments/verify/') ||
      href.includes('/verify/') ||
      href.includes('freecodecamp.org/certification/') ||
      href.includes('credly.com/badges/') ||
      href.includes('hackerrank.com/certificates/') ||
      href.includes('udemy.com/certificate/')
    );
  }

  function injectFloatingSaveButton() {
    if (!isSingleCertificatePage() || document.querySelector('.cv-floating-wrap:not(.cv-batch-wrap)')) {
      return;
    }

    const currentUrl = normalizeUrl(window.location.href);
    const wrap = document.createElement('div');
    wrap.className = 'cv-floating-wrap';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cv-floating-btn';

    const existing = savedItemsMap.get(currentUrl);
    if (existing?.has_file) {
      btn.classList.add('cv-floating-btn-saved');
      btn.textContent = 'In CertificateVault ✓';
      btn.disabled = true;
    } else if (existing) {
      btn.textContent = '+ Attach Image to Vault';
    } else {
      btn.textContent = '+ Save to CertificateVault';
    }

    btn.addEventListener('click', async () => {
      const { payload, imageUrl } = inferPageMetadata();
      const currentExisting = savedItemsMap.get(currentUrl);
      btn.disabled = true;
      btn.textContent = currentExisting ? 'Attaching Image...' : 'Saving to Vault...';
      btn.classList.remove('cv-floating-btn-error');

      try {
        if (currentExisting && !currentExisting.has_file) {
          const resp = await chrome.runtime.sendMessage({
            type: 'CV_ATTACH_IMAGE',
            certificateId: currentExisting.id,
            certificateUrl: currentUrl,
            imageUrl,
            title: payload.title,
          });
          if (resp?.ok) {
            savedItemsMap.set(currentUrl, { id: currentExisting.id, has_file: true });
            btn.classList.add('cv-floating-btn-saved');
            btn.textContent = 'Image Attached ✓';
          } else {
            btn.disabled = false;
            btn.classList.add('cv-floating-btn-error');
            btn.textContent =
              resp?.status === 401
                ? 'Sign in via CertificateVault icon first'
                : resp?.error || 'Attach failed — click to retry';
          }
          return;
        }

        const resp = await chrome.runtime.sendMessage({
          type: 'CV_QUICK_SAVE',
          payload,
          imageUrl,
        });
        if (resp?.ok) {
          savedItemsMap.set(currentUrl, {
            id: resp.certificate?.id,
            has_file: Boolean(resp.attachedImage),
          });
          btn.classList.add('cv-floating-btn-saved');
          btn.textContent = resp.attachedImage
            ? 'Saved + Image ✓'
            : 'Saved to CertificateVault ✓';
        } else {
          btn.disabled = false;
          btn.classList.add('cv-floating-btn-error');
          btn.textContent =
            resp?.status === 401
              ? 'Sign in via CertificateVault icon first'
              : resp?.error || 'Save failed — click to retry';
        }
      } catch {
        btn.disabled = false;
        btn.classList.add('cv-floating-btn-error');
        btn.textContent = 'Error — click to retry';
      }
    });

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'cv-floating-close';
    closeBtn.title = 'Dismiss';
    closeBtn.setAttribute('aria-label', 'Dismiss Save to CertificateVault button');
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => wrap.remove());

    wrap.appendChild(btn);
    wrap.appendChild(closeBtn);
    document.body.appendChild(wrap);
  }

  let debounceTimer = null;
  function scanPage() {
    if (window.location.hostname.includes('coursera.org')) {
      injectCourseraListButtons();
    }
    injectFloatingSaveButton();
  }

  async function init() {
    await syncSavedUrls();
    scanPage();
    refreshSavedButtonBadges();

    const observer = new MutationObserver(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        scanPage();
        refreshSavedButtonBadges();
      }, 250);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  init();
})();
