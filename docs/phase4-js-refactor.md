# Phase 4 — JS Refactor Plan

**When to do this:** After Phase 3 (Figma gap analysis) is complete.
**Rule:** One component per session and commit.

---

## Dead Code to Remove

### 1. `initMobileMenu()` (lines ~167–199)
Looks for `#mobile-nav` and `[data-mobile-menu-open]`. Neither element exists in the theme — the mobile menu is in `sections/mobile-menu.liquid` and uses Alpine `x-data="mobileMenu()"`. This function returns immediately at `if (!nav || !openBtn) return;`.

**Action:** Delete `initMobileMenu()` entirely. Remove its call from `DOMContentLoaded`.

### 2. `CartDrawer.init()` call in `DOMContentLoaded` (line ~1020)
`CartDrawer.init()` looks for `#cart-drawer` (doesn't exist), `.cart-drawer__overlay` (doesn't exist), `[data-cart-drawer-close]` (doesn't exist) and returns early every time. Does nothing.

**Action:** Remove `CartDrawer.init()` call from `DOMContentLoaded`. Keep `CartDrawer.addItem()` — it IS called by `initAddToCartForms()`.

### 3. `initHeaderScroll()` (lines ~743+)
Manages `.is-sticky` and `.is-hidden` classes directly on `.site-header`. The Alpine `siteHeader()` component in `sections/header.liquid` now handles the same behaviour reactively. Dual scroll listeners will fire simultaneously and potentially conflict.

**Action:** Delete `initHeaderScroll()`. Remove its call from `DOMContentLoaded`. All header scroll behaviour is owned by Alpine.

---

## Refactors (not bugs, do when ready)

### Extract components into separate files
Per CLAUDE.md naming: `assets/component-[name].js`

| Current location | Extract to |
|---|---|
| `cartDrawer()` in `sections/cart-drawer.liquid` | `assets/component-cart-drawer.js` |
| `mobileMenu()` in `sections/mobile-menu.liquid` | `assets/component-mobile-menu.js` |
| `siteHeader()` in `sections/header.liquid` | `assets/component-header.js` |

Then load each file with `{{ 'component-cart-drawer.js' | asset_url | script_tag }}` at the bottom of the corresponding section.

**Why bother:** Keeps sections smaller and makes it easier to test/update JS in isolation. Also allows deduplication if a component is used in multiple places.

### CartDrawer.addItem public API
Currently `CartDrawer` is a module defined with an IIFE in theme.js. It's exposed as `window.Metsie.CartDrawer`. After removing the dead `init()` code, the only public method needed is `addItem()`. Consider simplifying:

```js
async function addToCart({ id, quantity, properties }) {
  const res = await fetch('/cart/add.js', { method: 'POST', ... });
  const item = await res.json();
  document.dispatchEvent(new CustomEvent('open-cart-drawer'));
  return item;
}
window.Metsie.addToCart = addToCart;
```

---

## Things NOT to touch in Phase 4

- `initScrollReveal()` — used for scroll-triggered animations, separate from header
- `initAccordions()` — product page accordions, no Alpine overlap
- `initQuantitySelectors()` — may overlap with cart drawer quantity selectors; audit before removing
- `initAddToCartForms()` — calls `CartDrawer.addItem()`, keep working
- `initSearchModal()` — check if there is an Alpine-based search modal first
- `initLocalizationForm()` — check if `snippets/localization-form.liquid` uses Alpine or vanilla JS
- `initLazyImages()` — standalone, fine

---

## Checklist for Phase 4

- [ ] Remove `initMobileMenu()` + call
- [ ] Remove `CartDrawer.init()` call (keep `addItem`)
- [ ] Remove `initHeaderScroll()` + call
- [ ] Verify Alpine scroll behaviour still works after removing `initHeaderScroll()`
- [ ] Extract `cartDrawer()` to `assets/component-cart-drawer.js`
- [ ] Extract `mobileMenu()` to `assets/component-mobile-menu.js`
- [ ] Extract `siteHeader()` to `assets/component-header.js`
- [ ] Update each section to load its own component JS file
- [ ] Simplify `CartDrawer.addItem` API if desired
- [ ] Run full regression: open/close cart, open/close mobile menu, header scroll, transparent header