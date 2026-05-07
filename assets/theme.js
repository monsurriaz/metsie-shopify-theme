/**
 * ============================================================
 * METSIE THEME — theme.js
 * Quiet Luxury / Scandinavian Minimalism
 * Version: 1.0.0
 * ============================================================
 *
 * TABLE OF CONTENTS
 * 1.  Utilities & Helpers
 * 2.  Scroll Reveal (IntersectionObserver)
 * 3.  Mobile Menu Toggle
 * 4.  Cart Drawer
 * 5.  Accordion Component
 * 6.  Quantity Selector
 * 7.  GEO Detection
 * 8.  Currency Conversion Utility
 * 9.  Language Detection Utility
 * 10. Cookie Consent Handler (GDPR)
 * 11. Lazy Image Loading
 * 12. Smooth Scroll
 * 13. Header Sticky / Scroll Behavior
 * 14. Search Modal
 * 15. Localization Form (Currency / Language Switcher)
 * 16. Initialization
 * ============================================================
 */

'use strict';

/* ============================================================
   1. UTILITIES & HELPERS
   ============================================================ */

/**
 * Debounce: limits function call frequency.
 * @param {Function} fn
 * @param {number} delay - ms
 * @returns {Function}
 */
function debounce(fn, delay = 200) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Throttle: executes at most once per interval.
 * @param {Function} fn
 * @param {number} interval - ms
 * @returns {Function}
 */
function throttle(fn, interval = 100) {
  let lastTime = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastTime >= interval) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
}

/**
 * Traps focus within a given element (for modals / drawers).
 * @param {HTMLElement} el
 * @param {Function} onEscape - callback for Escape key
 * @returns {Function} cleanup function
 */
function trapFocus(el, onEscape) {
  const focusable = el.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  function handleKeydown(e) {
    if (e.key === 'Escape' && onEscape) {
      onEscape();
      return;
    }
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  el.addEventListener('keydown', handleKeydown);
  if (first) first.focus();

  return () => el.removeEventListener('keydown', handleKeydown);
}

/**
 * Emit a custom event.
 * @param {string} name
 * @param {*} detail
 * @param {HTMLElement} target
 */
function emit(name, detail = {}, target = document) {
  target.dispatchEvent(new CustomEvent(`metsie:${name}`, { detail, bubbles: true }));
}

/**
 * Cookie utilities.
 */
const Cookie = {
  get(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  },
  set(name, value, days = 365) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  },
  remove(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
  }
};


/* ============================================================
   2. SCROLL REVEAL (IntersectionObserver)
   ============================================================ */

function initScrollReveal() {
  if (!('IntersectionObserver' in window)) {
    // Fallback: reveal all immediately
    document.querySelectorAll('[data-reveal], [data-reveal-group]').forEach(el => {
      el.classList.add('is-revealed');
    });
    return;
  }

  const options = {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-revealed');
      observer.unobserve(entry.target);
    });
  }, options);

  document.querySelectorAll('[data-reveal], [data-reveal-group]').forEach(el => {
    observer.observe(el);
  });
}


/* ============================================================
   3. MOBILE MENU TOGGLE
   ============================================================ */

function initMobileMenu() {
  const nav = document.getElementById('mobile-nav');
  const openBtn = document.querySelector('[data-mobile-menu-open]');
  const closeBtn = document.querySelector('[data-mobile-menu-close]');
  const overlay = document.querySelector('.mobile-nav__overlay');

  if (!nav || !openBtn) return;

  let removeFocusTrap = null;

  function openMenu() {
    nav.classList.add('is-open');
    nav.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    openBtn.setAttribute('aria-expanded', 'true');
    removeFocusTrap = trapFocus(nav, closeMenu);
    emit('mobile-menu:opened');
  }

  function closeMenu() {
    nav.classList.remove('is-open');
    nav.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    openBtn.setAttribute('aria-expanded', 'false');
    if (removeFocusTrap) { removeFocusTrap(); removeFocusTrap = null; }
    openBtn.focus();
    emit('mobile-menu:closed');
  }

  openBtn.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  if (overlay) overlay.addEventListener('click', closeMenu);
}


/* ============================================================
   4. CART DRAWER
   ============================================================ */

const CartDrawer = (() => {
  let drawer, overlay, closeBtn, removeFocusTrap = null;

  function init() {
    drawer = document.getElementById('cart-drawer');
    if (!drawer) return;

    overlay = drawer.querySelector('.cart-drawer__overlay');
    closeBtn = drawer.querySelector('[data-cart-drawer-close]');

    document.querySelectorAll('[data-cart-open]').forEach(btn => {
      btn.addEventListener('click', open);
    });

    if (closeBtn) closeBtn.addEventListener('click', close);
    if (overlay) overlay.addEventListener('click', close);

    // Listen for Shopify cart events
    document.addEventListener('metsie:cart:updated', refreshDrawer);
  }

  function open() {
    if (!drawer) return;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    removeFocusTrap = trapFocus(drawer, close);
    emit('cart-drawer:opened');
  }

  function close() {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (removeFocusTrap) { removeFocusTrap(); removeFocusTrap = null; }
    emit('cart-drawer:closed');
  }

  async function refreshDrawer() {
    try {
      const response = await fetch('/?section_id=cart-drawer');
      if (!response.ok) return;
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const newContent = doc.querySelector('.cart-drawer__body');
      const currentContent = drawer.querySelector('.cart-drawer__body');
      if (newContent && currentContent) {
        currentContent.innerHTML = newContent.innerHTML;
      }
      updateCartCount();
    } catch (err) {
      console.warn('[Metsie] Cart drawer refresh failed:', err);
    }
  }

  async function updateCartCount() {
    try {
      const data = await fetch('/cart.js').then(r => r.json());
      const countEls = document.querySelectorAll('[data-cart-count]');
      countEls.forEach(el => {
        el.textContent = data.item_count;
        el.style.display = data.item_count > 0 ? '' : 'none';
      });
      window.__METSIE = window.__METSIE || {};
      window.__METSIE.cartItemCount = data.item_count;
    } catch (err) {
      console.warn('[Metsie] Cart count update failed:', err);
    }
  }

  /**
   * Add item to cart via AJAX.
   * @param {Object} params - { id, quantity, properties }
   * @returns {Promise<Object>}
   */
  async function addItem(params) {
    const routes = window.__METSIE?.routes || {};
    const url = routes.cartAdd || '/cart/add.js';

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.description || 'Add to cart failed');
    }

    const data = await response.json();
    emit('cart:updated', { item: data });
    await updateCartCount();
    if (window.__METSIE?.settings?.cartType === 'drawer') {
      await refreshDrawer();
      open();
    }
    return data;
  }

  /**
   * Update item quantity.
   * @param {number} line - line item index (1-based)
   * @param {number} quantity
   * @returns {Promise<Object>}
   */
  async function updateItem(line, quantity) {
    const routes = window.__METSIE?.routes || {};
    const url = routes.cartChange || '/cart/change.js';

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ line, quantity })
    });

    if (!response.ok) throw new Error('Cart update failed');
    const data = await response.json();
    emit('cart:updated', { cart: data });
    await updateCartCount();
    await refreshDrawer();
    return data;
  }

  return { init, open, close, addItem, updateItem, refreshDrawer, updateCartCount };
})();


/* ============================================================
   5. ACCORDION COMPONENT
   ============================================================ */

function initAccordions() {
  document.querySelectorAll('.accordion').forEach(accordion => {
    const triggers = accordion.querySelectorAll('.accordion__trigger');

    triggers.forEach(trigger => {
      const item = trigger.closest('.accordion__item');
      const content = item.querySelector('.accordion__content');

      if (!content) return;

      trigger.setAttribute('aria-expanded', item.classList.contains('is-open') ? 'true' : 'false');
      trigger.setAttribute('aria-controls', content.id || '');

      trigger.addEventListener('click', () => {
        const isOpen = item.classList.contains('is-open');

        // Close all siblings if accordion is exclusive
        if (accordion.dataset.exclusive !== 'false') {
          accordion.querySelectorAll('.accordion__item.is-open').forEach(openItem => {
            if (openItem !== item) {
              openItem.classList.remove('is-open');
              openItem.querySelector('.accordion__trigger').setAttribute('aria-expanded', 'false');
            }
          });
        }

        item.classList.toggle('is-open', !isOpen);
        trigger.setAttribute('aria-expanded', String(!isOpen));

        emit('accordion:toggled', { item, isOpen: !isOpen });
      });
    });
  });
}


/* ============================================================
   6. QUANTITY SELECTOR
   ============================================================ */

function initQuantitySelectors() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.quantity-selector__btn');
    if (!btn) return;

    const selector = btn.closest('.quantity-selector');
    const input = selector?.querySelector('.quantity-selector__input');
    if (!input) return;

    const delta = btn.dataset.direction === 'up' ? 1 : -1;
    const min = parseInt(input.min, 10) || 1;
    const max = parseInt(input.max, 10) || Infinity;
    const current = parseInt(input.value, 10) || 1;
    const next = Math.min(max, Math.max(min, current + delta));

    input.value = next;
    input.dispatchEvent(new Event('change', { bubbles: true }));

    // Update button disabled states
    selector.querySelector('[data-direction="down"]').disabled = next <= min;
    selector.querySelector('[data-direction="up"]').disabled = next >= max;
  });

  // Input validation
  document.addEventListener('change', (e) => {
    if (!e.target.classList.contains('quantity-selector__input')) return;
    const input = e.target;
    const min = parseInt(input.min, 10) || 1;
    const max = parseInt(input.max, 10) || Infinity;
    const val = parseInt(input.value, 10);

    if (isNaN(val) || val < min) input.value = min;
    if (val > max) input.value = max;

    const selector = input.closest('.quantity-selector');
    if (selector) {
      selector.querySelector('[data-direction="down"]').disabled = parseInt(input.value) <= min;
      selector.querySelector('[data-direction="up"]').disabled = parseInt(input.value) >= max;
    }
  });
}


/* ============================================================
   7. GEO DETECTION
   ============================================================ */

/**
 * Detects visitor's country, currency, and language using ipapi.co.
 * Result is stored in window.__GEO and cached in sessionStorage.
 * @returns {Promise<Object>} { country, currency, language, detected }
 */
async function detectGeo() {
  // Return cached result within session
  const cached = sessionStorage.getItem('metsie_geo');
  if (cached) {
    try {
      const geo = JSON.parse(cached);
      window.__GEO = geo;
      emit('geo:detected', geo);
      return geo;
    } catch (_) { /* ignore parse error */ }
  }

  try {
    const response = await fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout ? AbortSignal.timeout(4000) : undefined
    });

    if (!response.ok) throw new Error('GEO API returned ' + response.status);

    const data = await response.json();

    const geo = {
      country: data.country_code || null,
      country_name: data.country_name || null,
      currency: data.currency || null,
      language: data.languages ? data.languages.split(',')[0].split('-')[0] : null,
      continent: data.continent_code || null,
      is_eu: data.in_eu || false,
      detected: true
    };

    window.__GEO = geo;
    sessionStorage.setItem('metsie_geo', JSON.stringify(geo));
    emit('geo:detected', geo);

    return geo;
  } catch (err) {
    console.warn('[Metsie] GEO detection failed:', err);
    const fallback = { country: null, currency: null, language: navigator.language?.split('-')[0] || 'en', detected: false };
    window.__GEO = fallback;
    return fallback;
  }
}


/* ============================================================
   8. CURRENCY CONVERSION UTILITY
   ============================================================ */

/**
 * Basic currency conversion helper.
 * In production, plug in real exchange rate data (Shopify Markets handles
 * this natively). This utility is a client-side stub for display only.
 */
const CurrencyUtil = (() => {
  // Fallback static rates (EUR base). Replace with live API for production.
  const RATES = {
    EUR: 1,
    USD: 1.09,
    GBP: 0.86,
    CHF: 0.97,
    SEK: 11.25,
    NOK: 11.75,
    DKK: 7.46,
    PLN: 4.27,
    CZK: 24.85,
    JPY: 162.0,
    AUD: 1.64,
    CAD: 1.48
  };

  const SYMBOLS = {
    EUR: '€',
    USD: '$',
    GBP: '£',
    CHF: 'CHF',
    SEK: 'kr',
    NOK: 'kr',
    DKK: 'kr',
    PLN: 'zł',
    CZK: 'Kč',
    JPY: '¥',
    AUD: 'A$',
    CAD: 'C$'
  };

  /**
   * Convert a price from one currency to another.
   * @param {number} amount - amount in `from` currency
   * @param {string} from   - ISO currency code (e.g. 'EUR')
   * @param {string} to     - ISO currency code (e.g. 'USD')
   * @returns {number}
   */
  function convert(amount, from = 'EUR', to = 'EUR') {
    if (from === to) return amount;
    const rateFrom = RATES[from.toUpperCase()] || 1;
    const rateTo = RATES[to.toUpperCase()] || 1;
    return (amount / rateFrom) * rateTo;
  }

  /**
   * Format a price with currency symbol.
   * @param {number} amount
   * @param {string} currency
   * @param {string} locale
   * @returns {string}
   */
  function format(amount, currency = 'EUR', locale = 'en') {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency.toUpperCase(),
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (_) {
      const symbol = SYMBOLS[currency.toUpperCase()] || currency;
      return `${symbol}${amount.toFixed(2)}`;
    }
  }

  return { convert, format, RATES, SYMBOLS };
})();


/* ============================================================
   9. LANGUAGE DETECTION UTILITY
   ============================================================ */

/**
 * Detects the visitor's preferred language and optionally redirects
 * to the corresponding Shopify locale.
 */
const LanguageUtil = (() => {
  const SUPPORTED = ['en', 'de', 'fr'];
  const DEFAULT = 'en';

  /**
   * Returns best-matching supported language for the visitor.
   * Priority: GEO language → browser language → default.
   * @returns {string} ISO 639-1 code
   */
  function detect() {
    const geoLang = window.__GEO?.language;
    if (geoLang && SUPPORTED.includes(geoLang)) return geoLang;

    const browserLangs = navigator.languages || [navigator.language || DEFAULT];
    for (const lang of browserLangs) {
      const code = lang.split('-')[0].toLowerCase();
      if (SUPPORTED.includes(code)) return code;
    }

    return DEFAULT;
  }

  /**
   * Returns the Shopify locale URL prefix for a language code.
   * @param {string} lang
   * @returns {string}
   */
  function getLocalePrefix(lang) {
    const map = { en: '/en', de: '/de', fr: '/fr' };
    return map[lang] || '/en';
  }

  return { detect, getLocalePrefix, SUPPORTED, DEFAULT };
})();


/* ============================================================
   10. COOKIE CONSENT HANDLER (GDPR)
   ============================================================ */

function initCookieConsent() {
  const banner = document.getElementById('gdpr-banner');
  if (!banner) return;

  const CONSENT_KEY = 'metsie_cookie_consent';
  const consent = Cookie.get(CONSENT_KEY);

  if (consent) return; // Already consented

  // Show banner after short delay
  setTimeout(() => {
    banner.classList.add('is-visible');
    banner.removeAttribute('hidden');
    banner.setAttribute('aria-hidden', 'false');
    emit('gdpr:banner-shown');
  }, 1200);

  // Accept all
  const acceptBtn = banner.querySelector('[data-gdpr-accept]');
  if (acceptBtn) {
    acceptBtn.addEventListener('click', () => {
      Cookie.set(CONSENT_KEY, 'accepted', 365);
      hideBanner();
      emit('gdpr:accepted');
      enableAnalytics();
    });
  }

  // Decline / manage
  const declineBtn = banner.querySelector('[data-gdpr-decline]');
  if (declineBtn) {
    declineBtn.addEventListener('click', () => {
      Cookie.set(CONSENT_KEY, 'declined', 90);
      hideBanner();
      emit('gdpr:declined');
    });
  }

  function hideBanner() {
    banner.classList.remove('is-visible');
    banner.setAttribute('aria-hidden', 'true');
  }

  function enableAnalytics() {
    // Fire GTM / GA events now that consent is given
    if (typeof gtag === 'function') {
      gtag('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'granted'
      });
    }
    if (window.dataLayer) {
      window.dataLayer.push({ event: 'cookie_consent_given' });
    }
  }
}


/* ============================================================
   11. LAZY IMAGE LOADING
   ============================================================ */

function initLazyImages() {
  // Native lazy loading — just ensure loading="lazy" is set
  // Fallback for browsers that don't support it natively
  if ('loading' in HTMLImageElement.prototype) {
    document.querySelectorAll('img[data-src]').forEach(img => {
      img.src = img.dataset.src;
      if (img.dataset.srcset) img.srcset = img.dataset.srcset;
    });
    return;
  }

  // IntersectionObserver fallback
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('img[data-src]').forEach(img => {
      img.src = img.dataset.src;
      if (img.dataset.srcset) img.srcset = img.dataset.srcset;
    });
    return;
  }

  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const img = entry.target;
      if (img.dataset.src) {
        img.src = img.dataset.src;
        delete img.dataset.src;
      }
      if (img.dataset.srcset) {
        img.srcset = img.dataset.srcset;
        delete img.dataset.srcset;
      }
      img.classList.add('is-loaded');
      imageObserver.unobserve(img);
    });
  }, { rootMargin: '200px 0px' });

  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });
}


/* ============================================================
   12. SMOOTH SCROLL
   ============================================================ */

function initSmoothScroll() {
  // CSS scroll-behavior: smooth handles most cases.
  // This handles offset for sticky header.
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const hash = link.getAttribute('href');
    if (hash === '#') return;

    const target = document.querySelector(hash);
    if (!target) return;

    e.preventDefault();

    const header = document.querySelector('.site-header');
    const headerHeight = header ? header.offsetHeight : 0;
    const targetTop = target.getBoundingClientRect().top + window.scrollY - headerHeight - 16;

    window.scrollTo({ top: targetTop, behavior: 'smooth' });
    history.pushState(null, '', hash);
  });
}


/* ============================================================
   13. HEADER STICKY / SCROLL BEHAVIOR
   ============================================================ */

function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const isSticky = header.dataset.sticky === 'true' || header.classList.contains('site-header--sticky');
  const isTransparent = header.classList.contains('site-header--transparent');

  if (!isSticky && !isTransparent) return;

  let lastScroll = 0;
  const THRESHOLD = 80;

  function onScroll() {
    const currentScroll = window.scrollY;

    if (isTransparent) {
      header.classList.toggle('is-sticky', currentScroll > THRESHOLD);
    }

    // Hide/show header on scroll direction
    if (isSticky && currentScroll > THRESHOLD * 2) {
      if (currentScroll > lastScroll) {
        header.classList.add('is-hidden');
      } else {
        header.classList.remove('is-hidden');
      }
    } else {
      header.classList.remove('is-hidden');
    }

    lastScroll = currentScroll;
  }

  window.addEventListener('scroll', throttle(onScroll, 50), { passive: true });
  onScroll(); // Run on init
}


/* ============================================================
   14. SEARCH MODAL
   ============================================================ */

function initSearchModal() {
  const modal = document.getElementById('search-modal');
  const openBtns = document.querySelectorAll('[data-search-open]');
  const closeBtn = document.querySelector('[data-search-close]');
  const input = modal?.querySelector('.search-modal__input');

  if (!modal) return;

  let removeFocusTrap = null;

  function open() {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    removeFocusTrap = trapFocus(modal, close);
    if (input) setTimeout(() => input.focus(), 50);
    emit('search-modal:opened');
  }

  function close() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (removeFocusTrap) { removeFocusTrap(); removeFocusTrap = null; }
    emit('search-modal:closed');
  }

  openBtns.forEach(btn => btn.addEventListener('click', open));
  if (closeBtn) closeBtn.addEventListener('click', close);

  // Close on Escape
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
}


/* ============================================================
   15. LOCALIZATION FORM (CURRENCY / LANGUAGE SWITCHER)
   ============================================================ */

function initLocalizationForm() {
  const form = document.getElementById('localization-form');
  const triggers = document.querySelectorAll('[data-localization-open]');
  const closeBtn = document.querySelector('[data-localization-close]');
  const overlay = form?.querySelector('.localization-form__overlay');

  if (!form) return;

  let removeFocusTrap = null;

  function open() {
    form.classList.add('is-open');
    form.setAttribute('aria-hidden', 'false');
    removeFocusTrap = trapFocus(form, close);
    emit('localization:opened');
  }

  function close() {
    form.classList.remove('is-open');
    form.setAttribute('aria-hidden', 'true');
    if (removeFocusTrap) { removeFocusTrap(); removeFocusTrap = null; }
    emit('localization:closed');
  }

  triggers.forEach(btn => btn.addEventListener('click', open));
  if (closeBtn) closeBtn.addEventListener('click', close);
  if (overlay) overlay.addEventListener('click', close);
}


/* ============================================================
   16. PRODUCT PAGE: ADD TO CART FORM
   ============================================================ */

function initAddToCartForms() {
  document.querySelectorAll('[data-product-form]').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = form.querySelector('[type="submit"]');
      if (!submitBtn) return;

      const originalText = submitBtn.textContent;
      submitBtn.classList.add('btn--loading');
      submitBtn.disabled = true;

      try {
        const formData = new FormData(form);
        const id = formData.get('id');
        const quantity = parseInt(formData.get('quantity'), 10) || 1;

        const properties = {};
        for (const [key, value] of formData.entries()) {
          if (key.startsWith('properties[')) {
            const propKey = key.replace(/^properties\[(.+)\]$/, '$1');
            properties[propKey] = value;
          }
        }

        await CartDrawer.addItem({ id, quantity, properties });
      } catch (err) {
        console.error('[Metsie] Add to cart error:', err);
        const errorEl = form.querySelector('[data-atc-error]');
        if (errorEl) {
          errorEl.textContent = err.message || 'Something went wrong. Please try again.';
          errorEl.style.display = 'block';
          setTimeout(() => { errorEl.style.display = 'none'; }, 5000);
        }
      } finally {
        submitBtn.classList.remove('btn--loading');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  });
}


/* ============================================================
   16b. PRODUCT VARIANT SELECTOR
   ============================================================ */

function initVariantSelectors() {
  document.querySelectorAll('[data-variant-selector]').forEach(container => {
    const form = container.closest('[data-product-form]') || container.closest('form');
    const idInput = form?.querySelector('input[name="id"]');
    const priceEl = document.querySelector('[data-product-price]');
    const comparePriceEl = document.querySelector('[data-product-compare-price]');
    const addToCartBtn = form?.querySelector('[type="submit"]');
    const stockEl = document.querySelector('[data-product-inventory]');

    if (!idInput) return;

    container.querySelectorAll('[data-variant-option]').forEach(option => {
      option.addEventListener('change', () => {
        const selected = container.querySelectorAll('[data-variant-option]:checked');
        const values = Array.from(selected).map(el => el.value);

        // Find matching variant from embedded JSON
        const productJson = document.getElementById('product-json');
        if (!productJson) return;

        try {
          const product = JSON.parse(productJson.textContent);
          const variant = product.variants.find(v =>
            values.every((val, idx) => v.options[idx] === val)
          );

          if (!variant) return;

          idInput.value = variant.id;

          if (priceEl) {
            const money = formatMoney(variant.price);
            priceEl.textContent = money;
          }

          if (comparePriceEl && variant.compare_at_price > variant.price) {
            comparePriceEl.textContent = formatMoney(variant.compare_at_price);
            comparePriceEl.style.display = '';
          } else if (comparePriceEl) {
            comparePriceEl.style.display = 'none';
          }

          if (addToCartBtn) {
            addToCartBtn.disabled = !variant.available;
            if (!variant.available) {
              addToCartBtn.textContent = '[SOLD OUT]';
            }
          }

          if (stockEl) {
            const threshold = window.__METSIE?.settings?.inventoryThreshold || 5;
            if (variant.inventory_management && variant.inventory_quantity <= threshold && variant.inventory_quantity > 0) {
              stockEl.textContent = `[ONLY ${variant.inventory_quantity} LEFT]`;
              stockEl.style.display = '';
            } else {
              stockEl.style.display = 'none';
            }
          }

          // Update URL without reload
          const url = new URL(window.location);
          url.searchParams.set('variant', variant.id);
          history.replaceState({}, '', url.toString());

          emit('variant:selected', { variant });
        } catch (err) {
          console.warn('[Metsie] Variant selection error:', err);
        }
      });
    });
  });

  function formatMoney(cents) {
    const mf = window.__METSIE?.moneyFormat || '€{{amount}}';
    const amount = (cents / 100).toFixed(2);
    return mf.replace('{{amount}}', amount).replace('{{amount_no_decimals}}', Math.floor(cents / 100));
  }
}


/* ============================================================
   17. STICKY ADD TO CART
   ============================================================ */

function initStickyAtc() {
  const stickyBar = document.getElementById('sticky-atc');
  if (!stickyBar) return;

  const trigger = document.querySelector('[data-atc-trigger]');
  if (!trigger) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      stickyBar.classList.toggle('is-visible', !entry.isIntersecting);
    });
  }, { threshold: 0, rootMargin: '-10px' });

  observer.observe(trigger);
}


/* ============================================================
   17. AJAX FILTERING FOR COLLECTIONS
   ============================================================ */

function initAjaxFilters() {
  const section = document.querySelector('[data-ajax-filters]');
  if (!section) return;

  let controller = null;

  function setLoading(on) {
    section.querySelector('.collection-grid-wrap')?.classList.toggle('is-loading', on);
  }

  function updateDOM(sectionHtml) {
    const doc = new DOMParser().parseFromString(sectionHtml, 'text/html');
    ['.collection-grid-wrap', '.collection-count', '.active-filters'].forEach(sel => {
      const fresh = doc.querySelector(sel);
      const live = section.querySelector(sel);
      if (fresh && live) live.replaceWith(fresh);
    });
    window.Metsie?.observeCards?.();
    section.querySelector('.collection-grid-wrap')
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function fetchFiltered(url, { pushHistory = true } = {}) {
    if (controller) controller.abort();
    controller = new AbortController();
    setLoading(true);

    const fetchUrl = new URL(url, window.location.origin);
    fetchUrl.searchParams.set('sections', 'collection-products');

    fetch(fetchUrl.toString(), { signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        updateDOM(data['collection-products']);
        if (pushHistory) history.pushState({}, '', url);
      })
      .catch(err => {
        if (err.name !== 'AbortError') window.location.href = url;
      })
      .finally(() => setLoading(false));
  }

  function mergeSortParam(baseUrl, sortValue) {
    const sortUrl = new URL(sortValue, window.location.origin);
    const current = new URL(baseUrl);
    const params = new URLSearchParams(current.search);
    const sortBy = sortUrl.searchParams.get('sort_by');
    sortBy ? params.set('sort_by', sortBy) : params.delete('sort_by');
    return `${current.pathname}?${params.toString()}`;
  }

  section.addEventListener('change', e => {
    const select = e.target.closest('.sort-select');
    if (select) {
      e.stopPropagation();
      fetchFiltered(mergeSortParam(window.location.href, select.value));
      return;
    }
    const form = e.target.closest('.filter-form');
    if (form && e.target.type === 'checkbox') {
      e.stopPropagation();
      const params = new URLSearchParams(new FormData(form));
      fetchFiltered(`${form.action}?${params.toString()}`);
    }
  }, true);

  section.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    if (
      a.closest('.pagination') ||
      a.closest('.active-filters') ||
      a.closest('.collection-empty') ||
      a.classList.contains('clear-filters')
    ) {
      e.preventDefault();
      fetchFiltered(a.href);
    } else if (a.closest('.sort-accordion')) {
      e.preventDefault();
      fetchFiltered(mergeSortParam(window.location.href, a.href));
    }
  });

  window.addEventListener('popstate', () => {
    fetchFiltered(window.location.href, { pushHistory: false });
  });
}


/* ============================================================
   18. MAIN INITIALIZATION
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('is-loaded');

  // Remove no-js class (also done inline in theme.liquid)
  document.documentElement.classList.remove('no-js');

  // Core UI
  initScrollReveal();
  initMobileMenu();
  CartDrawer.init();
  initAccordions();
  initQuantitySelectors();
  initAddToCartForms();
  initVariantSelectors();
  initStickyAtc();
  initAjaxFilters();

  // Navigation & Modals
  initHeaderScroll();
  initSearchModal();
  initLocalizationForm();
  initSmoothScroll();

  // Media
  initLazyImages();

  // Privacy / Legal
  initCookieConsent();


  // GEO (async — does not block UI)
  if (window.__METSIE?.settings?.enableGeoRedirect) {
    detectGeo().then(geo => {
      if (!geo.detected) return;

      // Auto-suggest locale if different from current
      const currentLocale = window.__METSIE?.locale || 'en';
      const detectedLang = LanguageUtil.detect();

      if (detectedLang !== currentLocale && LanguageUtil.SUPPORTED.includes(detectedLang)) {
        emit('geo:locale-mismatch', { detected: detectedLang, current: currentLocale });
      }
    });
  }

  emit('theme:ready');
});

// Expose public API for use in sections and snippets
window.Metsie = {
  CartDrawer,
  CurrencyUtil,
  LanguageUtil,
  Cookie,
  detectGeo,
  emit,
  debounce,
  throttle,
  trapFocus
};
