# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

懒猴工具箱 (Lazy Monkey Tool Kit) — a Vue 3 + Vite online tools collection. All processing happens client-side (no backend). Built entirely with AI (Cursor Composer).

## Commands

- `npm install` — install dependencies
- `npm run dev` — start dev server on http://localhost:3000
- `npm run build` — production build to dist/
- `npm run preview` — preview production build

No test runner or linter is configured.

## Architecture

**Layout** (`App.vue`): Fixed header (60px) + sidebar nav (150px, dark #2c3e50) + scrollable main content area. Global styles are in `<style>` blocks (no external CSS framework). WeChat browser detection overlay on mount.

**Routing** (`src/router/index.js`): Vue Router with Web History mode. All tool pages are lazy-loaded view components. Unknown routes redirect to `/`.

**Each tool is a standalone view** in `src/views/`. Views use Options API (`export default { data(), methods: ... }`). Common patterns across views:
- Drag-and-drop + click-to-upload file selection
- Clipboard paste support (paste event listener on the upload area)
- Toast notifications via global `this.$toast()` plugin (never use `alert()`)
- Canvas-based image processing (convert, compress, crop)

**State management** (`src/stores/appStore.js`): Minimal Pinia store. Most views manage their own local state.

**Key dependencies**: `cropperjs` (image cropping), `qrcode` (QR generation), `qr-scanner` (QR decoding).

## Conventions

- JavaScript only — no TypeScript
- Kebab-case for view filenames, PascalCase for component references
- UI text is in Chinese (简体中文)
- New tools follow the pattern: add route → create view in `src/views/` → add menu item in `App.vue` sidebar
