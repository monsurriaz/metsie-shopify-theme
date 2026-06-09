# Metsie Shopify Theme

Custom Shopify Online Store 2.0 theme built from the Metsie Figma design.

The original generated theme contained extensive validation and architecture
issues. The project is being refactored section by section into a maintainable,
merchant-editable Shopify theme.

## Current Status

The project is currently in **Phase 2: Block architecture**.

- Phase 1: Bug fixes and deployment validation - completed
- Phase 2: Convert sections from flat settings to block-based architecture - current
- Phase 3: Figma gap analysis and visual completion
- Phase 4: JavaScript component refactor

During Phase 2, work on one section at a time and avoid unrelated CSS or
JavaScript changes.

## Tech Stack

- Shopify Online Store 2.0
- Liquid
- JSON templates
- Alpine.js for interactivity
- CSS custom properties for design tokens
- Shopify CLI and Theme Check
- No CSS framework
- No JavaScript build step

## Getting Started

### Prerequisites

- Access to the development Shopify store
- Shopify CLI installed and authenticated
- Git

### Local Development

```bash
shopify theme dev
```

Shopify CLI will print a local preview URL and a theme-editor URL.

### Validation

Run Theme Check before committing:

```bash
shopify theme check
```

The repository may contain existing Theme Check findings unrelated to the
section currently being worked on. Do not include unrelated fixes in the same
commit.

## Project Structure

```text
assets/      Global CSS, JavaScript, fonts, and theme assets
blocks/      Theme blocks
config/      Global theme settings and saved setting data
layout/      Root HTML shells
locales/     Theme translations
sections/    Merchant-editable page sections
snippets/    Reusable Liquid partials
templates/   JSON page templates
```

### Important Files

- `layout/theme.liquid` - root shell for storefront pages
- `layout/password.liquid` - root shell for password-protected store mode
- `assets/theme.css` - global theme styles and typography utilities
- `assets/theme.js` - main JavaScript entry point
- `snippets/css-variables.liquid` - central design-token source
- `snippets/product-card.liquid` - reusable product-card implementation
- `config/settings_schema.json` - global merchant settings
- `config/settings_data.json` - saved merchant values; do not edit manually

## Shopify Architecture

- All page templates belong in `templates/` as JSON files.
- Templates reference sections from `sections/`.
- Every section must contain a `{% schema %}` block.
- Use blocks for merchant-controlled content and repeatable elements.
- Use section settings for layout-level configuration.
- Snippets are reusable partials and must not contain schema.
- Keep layout files focused on the document shell.
- Both layouts must include `{{ content_for_header }}` and
  `{{ content_for_layout }}`.

The password page is configured through `templates/password.json` and
`sections/password.liquid`. Its section setting supports either password access
or a coming-soon newsletter form, never both simultaneously.

## Design System

Before writing CSS, inspect `snippets/css-variables.liquid`.

Use existing CSS custom properties for colors, typography, spacing, layout,
transitions, shadows, and z-index values. Do not introduce hardcoded design
values when a token already exists.

Common typography utilities in `assets/theme.css`:

- `.text-heading-primary`
- `.text-body-primary`
- `.text-body-light`

Common design tokens:

```css
var(--color-deep-navy)
var(--color-cream)
var(--color-near-black)
var(--font-heading)
var(--font-body)
var(--space-4)
var(--space-8)
var(--page-width)
var(--transition-base)
```

## Interactivity

- Preserve existing Alpine.js behavior.
- Use Alpine.js for new interactive UI.
- Do not mix manual event listeners into UI already controlled by Alpine.
- Keep global JavaScript in `assets/theme.js`.
- Name extracted components `assets/component-[name].js`.

## Development Workflow

1. Confirm the current project phase.
2. Inspect the relevant template, section, snippets, styles, and scripts.
3. Check `snippets/css-variables.liquid` before changing CSS.
4. Make one focused section or fix at a time.
5. Test mobile, tablet, and desktop behavior when visuals change.
6. Run `shopify theme check`.
7. Review the Git diff before committing.

Do not combine refactoring, visual changes, and bug fixes in one commit.

## Git Workflow

The `main` branch is connected to Shopify through GitHub integration.

- Work on the `dev` branch.
- Never commit broken code to `main`.
- Keep commits limited to one section or one fix.
- Merge to `main` only after verification.

Commit prefixes:

```text
fix: description
feat: description
refactor: description
```

## Coding Standards

- Prefer existing theme patterns over new abstractions.
- Keep Liquid markup above the section schema.
- Use semantic HTML.
- Keep CSS DRY and token-driven.
- Use `image_url` for Shopify images.
- Render product cards through `snippets/product-card.liquid`.
- Avoid inline styles.
- Do not manually edit `config/settings_data.json`.
- Do not place page-specific logic in layout files.
- Do not leave browser console errors.

## Additional Documentation

- `AGENTS.md` - active architecture, workflow, and phase instructions
- `PROJECT_CONTEXT.md` - detailed page and component reference
- `CLAUDE.md` - mirrored project instructions for supported tooling

