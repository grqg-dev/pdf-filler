# PDF Form Filler

A fast, polished, browser-based PDF form filler. Upload any PDF, click anywhere to add text or checkbox annotations, then download a flattened PDF with your annotations baked in. Everything runs client-side — no server required.

## Features

- **Upload PDFs** via drag-and-drop or file picker
- **Text annotations** with adjustable font size
- **Checkbox annotations** for yes/no fields
- **Click to place**, **drag to move**
- **Two-click delete** with a clear confirm state
- **Keyboard shortcuts**: `Delete`/`Backspace` to remove selected, `Esc` to deselect
- **Zoom** in and out
- **Export** a flattened PDF that looks exactly like the editor

## Tech stack

- [Vite 8](https://vitejs.dev/) + [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [pdfjs-dist](https://github.com/mozilla/pdf.js) for PDF rendering
- [html2canvas](https://html2canvas.hertzen.com/) for rasterizing annotations
- [jsPDF](https://github.com/parallax/jsPDF) for generating the output PDF
- [Zustand](https://github.com/pmndrs/zustand) for state management

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:5173 in your browser.

## Usage

1. Drop a PDF onto the upload area or click to browse.
2. Select the **Text** tool and click anywhere on the page to add a text field. Start typing immediately.
3. Use the font-size picker under the Text tool to change the size of the selected or newly created text annotation.
4. Select the **Check** tool and click to drop a checkbox. Click the checkbox to toggle it.
5. Drag annotations to reposition them.
6. Hover an annotation and click the trash icon, then confirm, to delete it.
7. Click **Export** to download the flattened PDF.

## Development

```bash
npm run dev      # start dev server
npm run build    # production build
npm run lint     # ESLint
npm run preview  # preview production build
```

## Project structure

```
src/
├── components/        # React components
│   ├── annotations/   # TextAnnotation, CheckboxAnnotation, DeleteButton, AnnotationLayer
│   ├── layout/        # AppLayout, Header, Sidebar, ToolbarButton
│   ├── upload/        # PdfUploader
│   └── viewer/        # PdfViewer, PageRenderer, PageCanvas, PageErrorBoundary
├── hooks/             # Custom React hooks
├── store/             # Zustand stores
├── utils/             # Helpers and PDF export logic
├── types/             # Shared TypeScript types
└── workers/           # pdf.js worker entry
```

## How it works

- PDF pages are rendered to `<canvas>` elements via `pdfjs-dist`.
- An absolutely-positioned HTML overlay sits on top of each page and holds the annotations.
- Annotation positions are stored in CSS pixels relative to the rendered page, so the UI and export share the same coordinate system.
- On export, each page is composited from the rendered canvas plus a rasterized snapshot of the annotation overlay, then written to a new PDF with `jsPDF`.

## Notes

- The exported PDF is rasterized (image-based), not text-selectable.
- Existing PDF form fields are **not** auto-detected; annotations are placed manually.
- Large PDFs with many pages will take longer to export because every page is rasterized.

## License

MIT
