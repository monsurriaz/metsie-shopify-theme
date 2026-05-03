# Project: [Client Name] Shopify Theme

## Project Overview
Custom Shopify theme built from a Figma design.
Original code was AI-generated (Perplexity) from Figma — 
contained 370+ errors and architectural issues.
Currently being refactored and completed by a developer.

## Current Phase
See PHASES below for what is active right now.
Always check the current phase before doing anything.

## Tech Stack
- Shopify OS 2.0 (JSON templates + sections + blocks)
- Liquid templating language
- Alpine.js for all interactivity (keep Alpine, do not convert to vanilla JS)
- CSS custom properties for design tokens
- No CSS framework (no Tailwind, no Bootstrap)
- assets/theme.js is the main JS entry point

## Shopify Theme Architecture Rules
- All templates live in templates/ as .json files (not .liquid)
- Every template references sections defined in sections/
- Every section must have a {% schema %} block
- Sections use blocks for all merchant-customizable elements
- Snippets are reusable partials with no schema
- layout/theme.liquid is the root shell for all pages
- layout/password.liquid is only for password-protected store mode
- Both layout files must have {{ content_for_header }} in <head>
- Both layout files must have {{ content_for_layout }} in <body>
- config/settings_schema.json defines global theme settings
- config/settings_data.json stores saved setting values — never edit manually

## Section Architecture Rules (critical)
Every section must follow this structure:

1. Liquid markup at top — renders the section
2. {% schema %} at bottom — defines settings and blocks
3. Use blocks for any element the merchant should control:
   - Text elements (headings, descriptions)
   - Buttons
   - Images
   - Toggleable features
4. Use section settings only for layout-level config:
   - Section padding
   - Background color
   - Container width

Example block types for product section:
- title
- price  
- variant_picker
- quantity_selector
- buy_buttons
- description
- custom_liquid

## Alpine.js Rules
- Keep all Alpine.js as-is unless it is broken
- All new interactivity should use Alpine.js
- Use x-data, x-show, x-on, @click conventions
- Do not mix vanilla JS event listeners with Alpine where Alpine already handles it

## File Naming Conventions
- Sections: sections/[feature-name].liquid
- Snippets: snippets/[feature-name].liquid  
- JS components: assets/component-[name].js
- CSS: assets/[feature-name].css

## Git Workflow
- Main branch is connected to Shopify via GitHub integration
- Never commit broken code to main
- Work on dev branch, merge to main only when verified
- Commit granularity: one section or one fix per commit
- Commit format: 
  fix: description (for bug fixes)
  feat: description (for new features)
  refactor: description (for restructuring)

## Phases

### Phase 1 — Bug fixes (COMPLETED)
- Fixed 370 shopify theme check errors
- Fixed all Shopify deployment validation errors
- All templates rendering correctly

### Phase 2 — Block architecture (CURRENT)
- Convert every section from flat settings to block-based
- One section per session
- Do not touch CSS or JS during this phase
- Only change schema and Liquid structure

### Phase 3 — Figma gap analysis
- Side by side Figma vs live theme comparison
- Implement missing sections or pages
- Fix visual gaps per section
- One section per session and commit

### Phase 4 — JS refactor
- Audit assets/theme.js
- Extract features into class-based component files
- Keep Alpine.js
- One component per session and commit

## What NOT to do
- Never edit config/settings_data.json manually
- Never put logic in layout files (only structure)
- Never write inline styles — use CSS custom properties
- Never mix phases — if in Phase 2, only do block refactoring
- Never refactor and fix bugs in the same commit
