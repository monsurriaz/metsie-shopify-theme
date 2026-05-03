# Cart Drawer — Fix Plan & Architecture

## Problem Summary

Before the Alpine.js fix, `sections/cart-drawer.liquid` had:
- `.cart-drawer__backdrop` — `x-show="isOpen"` was **not processed** (Alpine never loaded)
- Result: backdrop/blur was always visible on every page

## Root Cause (Fixed)

Alpine.js was never loaded in `layout/theme.liquid`.
**Fix applied:** Added CDN script tag to `<head>` in theme.liquid:
```html
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.8/dist/cdn.min.js"></script>
<style>[x-cloak]{display:none!important}</style>
```
After this fix, `x-show="isOpen"` on the backdrop processes correctly — it starts hidden because `isOpen: false` in `cartDrawer()`.

## Current Architecture

### Alpine component (`sections/cart-drawer.liquid`)
- `x-data="cartDrawer()"` on the root `.cart-drawer` div
- Trigger: `@open-cart-drawer.window="open()"` — listens on window for a custom event
- Backdrop: `x-show="isOpen"` with Alpine x-transition classes
- Panel: `x-show="isOpen"` with slide-in x-transition classes
- `isOpen: false` — correct default, drawer starts closed

### How it's opened
From `sections/header.liquid`:
```html
<a @click.prevent="$dispatch('open-cart-drawer')">CART (0)</a>
```
This dispatches `open-cart-drawer` as a CustomEvent that bubbles to window.

### Cart data fetching
- `open()` calls `fetchCart()` → `GET /cart.js`
- `updateItem()` → `POST /cart/change.js`
- Both update reactive `items`, `totalPrice`, `itemCount`

## Conflict: theme.js `CartDrawer` vs Alpine `cartDrawer()`

`assets/theme.js` has a `CartDrawer` module that:
- Looks for `document.getElementById('cart-drawer')` (no element with this ID exists in the section)
- Looks for `.cart-drawer__overlay` (class is `.cart-drawer__backdrop` in the section)
- Looks for `[data-cart-drawer-close]` (attribute not present in the section)

**Conclusion: the theme.js CartDrawer module's `init()` returns early** — it never attaches any listeners. It does nothing. The Alpine component is the only active implementation.

However, `assets/theme.js` also calls `CartDrawer.addItem()` from `initAddToCartForms()`. This IS used. It calls `/cart/add.js` and then dispatches `open-cart-drawer` event, which correctly triggers the Alpine component.

## What to verify after Alpine.js fix

1. Refresh the store — backdrop should NOT be visible on load
2. Click CART (0) in header — drawer should slide in from the right
3. Click backdrop or press Escape — drawer should close
4. Add a product to cart — drawer should open with the item

## Defensive CSS (optional)

If you want a CSS-only fallback in case Alpine fails to initialise:
```css
/* Hide backdrop and panel unless drawer is open */
.cart-drawer:not(.is-open) .cart-drawer__backdrop,
.cart-drawer:not(.is-open) .cart-drawer__panel {
  display: none;
}
```
Alpine adds `.is-open` class via `:class="{ 'is-open': isOpen }"`. If Alpine loads, `x-show` takes over and this CSS becomes irrelevant. If Alpine fails, this CSS keeps the drawer closed.

## Phase 4 Cleanup (do not do now)

- Remove `CartDrawer.init()` from theme.js `DOMContentLoaded` block (it does nothing)
- Keep `CartDrawer.addItem()` — it is used by `initAddToCartForms()`
- Consider moving `addItem` to a standalone utility function
- Remove dead `initMobileMenu()` from theme.js (see `phase4-js-refactor.md`)