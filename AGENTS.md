# WebTool (React + TS)

## Overview
- Vite + React + TypeScript single-page app that hosts multiple web tools.
- Routes live in `src/App.tsx` and mirror tools defined in `src/data/tools.ts`.
- Common UI/Theme lives in `src/styles/*.css` and reusable components in `src/components`.

## Commands
- `npm install`
- `npm run dev` (Vite dev server on port `9243`)
- `npm run build`
- `npm run lint`

## Project Structure
- `src/main.tsx`: app entry; global styles are imported here.
- `src/App.tsx`: routes for tools.
- `src/data/tools.ts`: tool list + category metadata for the home page.
- `src/components`: shared UI (Button, Card, DropZone, Toggle, ToolLayout).
- `src/pages`:
  - `convert/*`: conversion tools (Motion Photo, HEIC, MOV, Image Batch).
  - `apps/*`: apps (Camera, Calculator, CSV Viewer, Python Editor, Web Collection).
  - `labs/*`: labs (Equation, PDF Tool, Mega Parser).
- `src/utils`: shared helpers (formula parsing, file helpers, script/style loaders).
- `src/pdf`: Ghostscript WASM worker files used by PDF tool.
- `public`: static assets (icons, manifest, service worker, legacy HTML).

## Conventions
- Use `ToolLayout` for tool pages to keep consistent layout.
- Prefer shared components from `src/components` instead of bespoke buttons/inputs.
- Style tokens live in `src/styles/theme.css`; tool-specific tweaks go in `src/styles/tools.css`.
- New tool flow: add page in `src/pages`, add route in `src/App.tsx`, add entry in `src/data/tools.ts`.

## Notes / Gotchas
- Some tools load libraries from CDNs at runtime (Pyodide, CodeMirror, MathJax, GPU.js, FFmpeg).
- PDF tool uses `src/pdf/worker-init.js` (do not move it to `public/`).
- Type stubs live in `src/types` for non-TS modules (heic2any, pdf worker, globals).
