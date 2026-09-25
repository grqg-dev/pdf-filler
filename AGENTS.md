# PDF Form Filler — Agent Notes

## Overview
A browser-based PDF form-filling app. Users upload a PDF, add text and checkbox annotations on top of it, then download a flattened PDF with the annotations rendered in.

Everything runs client-side; no server is required.

## Tech stack
- **Vite 8** + **React 19** + **TypeScript** (strict mode)
- **Tailwind CSS v4** with the Vite plugin
- **pdfjs-dist** for PDF rendering
- **jsPDF** for generating the output PDF
- **Zustand** for state management
- **lucide-react** for icons
- **uuid** for annotation IDs

## Project structure
```
src/
├── components/
│   ├── annotations/       # TextAnnotation, CheckboxAnnotation, DeleteButton, AnnotationLayer
│   ├── layout/            # AppLayout, Header, Sidebar, ToolbarButton
│   ├── upload/            # PdfUploader
│   ├── viewer/            # PdfViewer, PageRenderer, PageCanvas, PageErrorBoundary
│   └── export/            # (export lives in hooks/utils)
├── hooks/
│   ├── usePdfDocument.ts  # load PDF with pdf.js
│   ├── useRenderPage.ts   # render a page to a canvas
│   ├── useAnnotationActions.ts # annotation CRUD helpers
│   ├── useExportPdf.ts    # orchestrate PDF export
│   ├── useDragResize.ts   # shared move/resize pointer handling
│   └── useKeyboardShortcuts.ts # global Delete/Escape handling
├── store/
│   ├── useAppStore.ts     # tool, scale, selectedId, font size, file
│   └── useAnnotationStore.ts   # annotations grouped by page
├── utils/
│   ├── constants.ts       # defaults, sizes, colors
│   ├── geometry.ts        # clamp, constrainRectToBounds
│   ├── textLayout.ts      # word wrap shared by editor + export
│   ├── signature.ts       # load + trim Dr. Ray's signature (from the API)
│   └── pdfExport.ts       # re-render pages at 200 dpi + paint annotations → jsPDF
├── types/
│   └── index.ts           # shared TypeScript types
└── workers/
    └── pdf.worker.ts      # (pdf.js worker configured via URL import)
```

## Running the project
```bash
npm install
npm run dev      # dev server on http://localhost:5173
npm run build    # production build
npm run lint     # ESLint
npm run preview  # preview production build
```

## Architecture decisions

### PDF rendering
- Each page is rendered to a `<canvas>` via `pdfjs-dist` at the current zoom scale.
- The canvas is sized for the device pixel ratio so the output is crisp.
- An absolutely-positioned `<div>` annotation layer sits on top of each canvas and matches its CSS dimensions.

### Annotation coordinates
- All annotation positions and sizes are stored in **page units**: the pdf.js viewport at scale 1 (PDF points, rotation applied).
- The editor multiplies by the zoom to render; the exporter multiplies by `EXPORT_DPI / 72`. Zooming never moves annotations.

### State management
- **Zustand** is used for all global state.
- `useAppStore` holds UI/tool state.
- `useAnnotationStore` holds annotations grouped by page.
- Selectors return stable references where possible to avoid infinite re-render loops (e.g. `EMPTY_ANNOTATIONS`).

### Text annotations
- Implemented as `contentEditable` `<div>`s.
- The DOM text is synced from the store via a `useEffect` so typing does not reset cursor position.
- Newly created text annotations are automatically focused via a selection effect.

### Checkbox annotations
- Fixed-size, no resize handle.
- Click to toggle checked state.
- Drag to move.

### White-out and eraser
- **White-out** (W): drag a white rectangle; a plain click leaves a small default box. Movable/resizable in Select mode.
- **Eraser** (E): freehand white brush; size picker in the sidebar.
- Both render beneath text/checks/signatures, so you can cover old text and type over it.
- Other tools draw "through" white-out; only Select can grab it.

### Signature
- **Sign** (S) places Dr. Ray's real signature. It is fetched from `pdf-upload-url?asset=signature` (staff Bearer auth), which reads `s3://dr-julia-ray-templates/signatures/julia-ray.png`. Never bundle the signature as a static asset: Amplify assets are public.

### Selection / deletion / undo
- Selected annotations show a blue outline, a trash button (one click deletes), and a resize handle.
- `Delete` / `Backspace` removes the selected annotation; `Escape` deselects or stops editing.
- Undo: sidebar button or Ctrl/Cmd+Z (outside a text box). One step per add, move, resize, toggle, or typing session.
- Tool keys: V select, T text, C check, S sign, W white-out, E eraser.

### Export (Download and Fax share it)
1. Re-render each page with pdf.js at `EXPORT_DPI` (200) on an offscreen canvas.
2. Paint annotations with the Canvas 2D API (white-out first, then text/checks/signature). Text wraps with `textLayout.ts`, the same function that sizes the text box in the editor.
3. Add each bitmap to a `jsPDF` page at the original size and orientation.

Rasterising is deliberate: text under white-out is really gone, not hidden behind a shape. Do not reintroduce `html2canvas`; it can't parse Tailwind v4's `oklch`/`oklab` colours and it copies editor chrome into the output.

## Conventions
- Components are small and single-responsibility.
- Hooks extract logic from UI components.
- Pointer events are used for drag/resize interactions.
- Tailwind utility classes are used for styling.

## Known limitations / notes
- The output PDF is rasterized (image-based, 200 dpi), not text-selectable. This is intended.
- Existing PDF form fields are **not** auto-detected; all fields are placed manually.
- Large PDFs with many pages will take longer to export because each page is rasterized.
- The PDF worker is loaded via a Vite-friendly URL import in `usePdfDocument.ts`.

## Testing
- The app can be tested with `agent-browser`:
  ```bash
  npm run dev
  agent-browser open http://localhost:5173
  ```
- The login gate calls `fax-auth`. For local tests, point `VITE_AUTH_API_URL`, `VITE_UPLOAD_URL_API`, and `VITE_SEND_FAX_API` at a local stub. Never test Send Fax against the real API.
- `dr-julia-ray-generated-documents` CORS only allows the Amplify origin and `http://localhost:5173`.
  ```
- A sample PDF can be generated with `jsPDF` for quick smoke tests.
