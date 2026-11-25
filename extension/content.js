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

  let savedUrlSet = new Set();

  function parseCourseraDate(text) {
    const match = (text || '').match(
      /(?:Completed|Issued)\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i
    );
    if (!match) return '';
    const month = MONTHS[match[1].toLowerCase()];
    const year = match[2];
    const candidate = `${year}-${month}-01`;
    const today = new Date().toISOString().slice(0, 10);
    // Backend rejects future dates; if candidate month matches/exceeds current month, clamp to today
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

  function extractCourseraCardData(viewLink) {
    const certificateUrl = normalizeUrl(viewLink.href);

    // Walk up to find the containing card element
    let card = viewLink.closest('li, article, [data-testid*="card"], [class*="card"], [class*="Card"]');
    if (!card) {
      card = viewLink.parentElement?.parentElement?.parentElement || viewLink.parentElement;
    }

    const rawText = (card?.innerText || '').split('\n').map((s) => s.trim()).filter(Boolean);

    // Try explicit heading elements first
    const headingEl = card?.querySelector('h1, h2, h3, h4, [data-testid*="title"], [class*="title"]');
    let title = headingEl?.textContent?.trim() || '';

    const ignoredPatterns = /^(Add to LinkedIn|View certificate|Completed |Issued |Course|Specialization|Professional Certificate|Save to Vault|In Vault)/i;
    const usefulLines = rawText.filter((line) => !ignoredPatterns.test(line));

    if (!title && usefulLines.length > 0) {
      title = usefulLines[0];
    }

    // Issuer is typically the line right after the title or right before "Completed ..."
    let issuer = 'Coursera';
    const titleIdx = usefulLines.findIndex((l) => l === title);
    if (titleIdx !== -1 && usefulLines[titleIdx + 1]) {
      issuer = usefulLines[titleIdx + 1];
    } else if (usefulLines.length > 1 && usefulLines[1] !== title) {
      issuer = usefulLines[1];
    }

    const issueDate = parseCourseraDate(card?.innerText || '');

    return {
      title: (title || 'Coursera Certificate').slice(0, 160),
      issuer: issuer.slice(0, 120),
      category: 'Courses',
      issue_date: issueDate,
      certificate_url: certificateUrl,
      description: '',
      is_favorite: false,
    };
  }

  async function syncSavedUrls() {
    try {
      const resp = await chrome.runtime.sendMessage({ type: 'CV_GET_SAVED_URLS' });
      if (resp?.ok && Array.isArray(resp.urls)) {
        savedUrlSet = new Set(resp.urls.map(normalizeUrl));
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
      const isAlreadySaved = savedUrlSet.has(certUrl);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cv-inline-btn';
      btn.dataset.cvUrl = certUrl;

      if (isAlreadySaved) {
        updateButtonState(btn, 'saved', 'In Vault ✓');
      } else {
        updateButtonState(btn, 'idle', '+ Save to Vault');
      }

      btn.addEventListener('click', async (event) => {
        event.preventDefault();
        event.stopPropagation();

        const payload = extractCourseraCardData(link);
        updateButtonState(btn, 'loading', 'Saving...');

        try {
          const resp = await chrome.runtime.sendMessage({
            type: 'CV_QUICK_SAVE',
            payload,
          });
          if (resp?.ok) {
            savedUrlSet.add(certUrl);
            updateButtonState(btn, 'saved', 'Saved ✓');
          } else {
            const msg = resp?.status === 401
              ? 'Sign in via extension icon'
              : resp?.error || 'Save failed';
            updateButtonState(btn, 'error', msg);
            if (resp?.status !== 401) {
              setTimeout(() => updateButtonState(btn, 'idle', '+ Save to Vault'), 3000);
            }
          }
        } catch {
          updateButtonState(btn, 'error', 'Retry');
        }
      });

      link.insertAdjacentElement('afterend', btn);
    }
  }

  function refreshSavedButtonBadges() {
    document.querySelectorAll('.cv-inline-btn').forEach((btn) => {
      const url = btn.dataset.cvUrl;
      if (url && savedUrlSet.has(url) && !btn.disabled) {
        updateButtonState(btn, 'saved', 'In Vault ✓');
      }
    });
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

    return {
      title: cleanTitle || 'Verified Certificate',
      issuer,
      category: 'Courses',
      issue_date: '',
      certificate_url: normalizeUrl(window.location.href),
      description: '',
      is_favorite: false,
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
    if (!isSingleCertificatePage() || document.querySelector('.cv-floating-wrap')) return;

    const currentUrl = normalizeUrl(window.location.href);
    const wrap = document.createElement('div');
    wrap.className = 'cv-floating-wrap';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cv-floating-btn';
    if (savedUrlSet.has(currentUrl)) {
      btn.classList.add('cv-floating-btn-saved');
      btn.textContent = 'In CertificateVault ✓';
      btn.disabled = true;
    } else {
      btn.textContent = '+ Save to CertificateVault';
    }

    btn.addEventListener('click', async () => {
      const payload = inferPageMetadata();
      btn.disabled = true;
      btn.textContent = 'Saving to Vault...';
      btn.classList.remove('cv-floating-btn-error');

      try {
        const resp = await chrome.runtime.sendMessage({
          type: 'CV_QUICK_SAVE',
          payload,
        });
        if (resp?.ok) {
          savedUrlSet.add(currentUrl);
          btn.classList.add('cv-floating-btn-saved');
          btn.textContent = 'Saved to CertificateVault ✓';
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
