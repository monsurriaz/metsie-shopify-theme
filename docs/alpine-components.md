# Alpine.js Component Map

Alpine.js v3.14.8 is loaded in `layout/theme.liquid` with `defer`:
```html
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.8/dist/cdn.min.js"></script>
<style>[x-cloak]{display:none!important}</style>
```

`[x-cloak]` hides Alpine-controlled elements until Alpine initialises, preventing a flash of visible content on load.

---

## Active Components

| Component | File | x-data | Trigger |
|---|---|---|---|
| `siteHeader()` | `sections/header.liquid` | `<header>` | Scroll event via `init()` |
| `mobileMenu()` | `sections/mobile-menu.liquid` | root div | `@open-mobile-menu.window` |
| `cartDrawer()` | `sections/cart-drawer.liquid` | `.cart-drawer` | `@open-cart-drawer.window` |
| `addressManager()` | `sections/customers-addresses.liquid` | `.customers-page` | `@click` buttons |

---

## Component Details

### `siteHeader()`
**State:** `isSticky`, `isTransparent`, `hideOnScroll`, `isScrolled`, `isHidden`, `lastScrollY`

**CSS classes applied:** `is-sticky`, `is-transparent`, `is-scrolled`, `is-hidden`

**Behaviour:**
- `isScrolled` → true when `scrollY > 20` (triggers opaque background, box-shadow)
- `isTransparent` → false when `scrollY >= 60` (transparent-over-hero mode)
- `isHidden` → true when scrolling down past 80px (only when `hideOnScroll` setting is on)
- `isHidden` → false immediately when scrolling up

**Setting that controls `hideOnScroll`:** Theme editor → Header → "Hide header when scrolling down"

---

### `mobileMenu()`
**State:** `isOpen`

**Open trigger:** `$dispatch('open-mobile-menu')` from hamburger button in `sections/header.liquid`

**Close trigger:** `@click="close()"` on close button; `@keydown.escape.window="close()"`

**x-cloak:** The panel should have `x-cloak` to prevent flash — verify this is present in the section.

---

### `cartDrawer()`
**State:** `isOpen`, `loading`, `items[]`, `totalPrice`, `itemCount`

**Open trigger:** `$dispatch('open-cart-drawer')` from:
1. Cart link in header (`sections/header.liquid`)
2. After successful add-to-cart (`CartDrawer.addItem()` in `assets/theme.js`)

**Close trigger:** `@click="close()"` on backdrop and close button; `@keydown.escape.window="close()"`

**Data source:** Fetches `/cart.js` on open; updates via `/cart/change.js`

**Note:** `assets/theme.js` has a legacy `CartDrawer.init()` that returns early (no-op). It does NOT conflict with this Alpine component. See `cart-drawer-plan.md` for full details.

---

### `addressManager()`
**State:** `showNew`, `editId`

**Methods:** `openNew()` — shows the new address form; `openEdit(id)` — shows edit form for that address ID

**Initial state:** `showNew` starts as `true` if customer has zero addresses, `false` otherwise.

---

## Event Bus Pattern

Alpine components communicate via window-level custom events (not Alpine's `$store`):

| Event name | Dispatched by | Handled by |
|---|---|---|
| `open-mobile-menu` | Hamburger button in header | `mobileMenu()` → `open()` |
| `open-cart-drawer` | Cart link in header; `CartDrawer.addItem()` | `cartDrawer()` → `open()` |
| `close-cart-drawer` | (not currently used) | — |

To dispatch from any element: `$dispatch('open-cart-drawer')` (Alpine) or `window.dispatchEvent(new CustomEvent('open-cart-drawer'))` (vanilla JS).

---

## x-cloak Usage

Add `x-cloak` to any element that should be invisible until Alpine runs:
- Overlay panels (mobile menu, cart drawer)
- Any element that starts hidden via `x-show`

Elements with `x-show` that start as `false` will flicker visible for a frame before Alpine hides them — `x-cloak` prevents this.

Check that `sections/mobile-menu.liquid` and `sections/cart-drawer.liquid` have `x-cloak` on their root panels.

---

## Adding a New Alpine Component

1. Add `x-data="myComponent()"` to the root element in the section/snippet
2. Define `function myComponent() { return { ... } }` in a `<script>` tag at the bottom of the section
3. Use `x-show`, `@click`, `:class` etc. on child elements
4. If the component needs to be triggered globally, use `@my-event-name.window="handler()"` and dispatch via `$dispatch('my-event-name')` or `window.dispatchEvent(new CustomEvent('my-event-name'))`
5. In Phase 4, extract the function to `assets/component-[name].js` and load it with `script_tag`
