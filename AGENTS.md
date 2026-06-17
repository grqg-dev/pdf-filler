# PDF Form Filler — Agent Notes

## Overview
A browser-based PDF form-filling app. Users upload a PDF, add text and checkbox annotations on top of it, then download a flattened PDF with the annotations rendered in.

Everything runs client-side; no server is required.

## Tech stack
- **Vite 8** + **React 19** + **TypeScript** (strict mode)
- **Tailwind CSS v4** with the Vite plugin
- **pdfjs-dist** for PDF rendering
- **html2canvas** for rasterizing the annotation overlay
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
│   └── useKeyboardShortcuts.ts # global Delete/Escape handling
├── store/
│   ├── useAppStore.ts     # tool, scale, selectedId, font size, file
│   └── useAnnotationStore.ts   # annotations grouped by page
├── utils/
│   ├── constants.ts       # defaults, sizes, colors
│   ├── geometry.ts        # clamp, constrainRectToBounds
│   └── pdfExport.ts       # composite canvas + annotations → jsPDF
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
- All annotation positions and sizes are stored in **CSS pixels relative to the rendered page container**.
- This keeps the UI and export coordinate systems identical.

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

### Selection / deletion
- Selected annotations show a blue border.
- A delete button appears on hover.
- First click turns the button red (confirm state); second click deletes.
- `Delete` / `Backspace` removes the selected annotation.
- `Escape` deselects.

### Export
1. For each page, create an offscreen canvas at the rendered CSS size.
2. Draw the PDF canvas onto it.
3. Use `html2canvas` on the annotation overlay.
4. Composite the annotation image on top.
5. Add the composite image to a `jsPDF` document at the original page dimensions in points.

## Conventions
- Components are small and single-responsibility.
- Hooks extract logic from UI components.
- `React.memo` and stable callbacks are used on annotation items to keep the UI fast.
- Pointer events are used for drag/resize interactions.
- Tailwind utility classes are used for styling.

## Known limitations / notes
- The output PDF is rasterized (image-based), not text-selectable.
- Existing PDF form fields are **not** auto-detected; all fields are placed manually.
- Large PDFs with many pages will take longer to export because each page is rasterized.
- The PDF worker is loaded via a Vite-friendly URL import in `usePdfDocument.ts`.

## Testing
- The app can be tested with `agent-browser`:
  ```bash
  npm run dev
  agent-browser open http://localhost:5173
  ```
- A sample PDF can be generated with `jsPDF` for quick smoke tests.
