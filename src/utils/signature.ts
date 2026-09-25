import { getSignatureDataUrl } from "./api";

export interface LoadedSignature {
  src: string;
  /** width / height of the trimmed image */
  aspect: number;
}

let cached: Promise<LoadedSignature> | null = null;

/** Fetch the signature once per session and trim transparent margins. */
export function loadSignature(): Promise<LoadedSignature> {
  if (!cached) {
    cached = getSignatureDataUrl()
      .then(trimTransparent)
      .catch((err) => {
        cached = null;
        throw err;
      });
  }
  return cached;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode signature image"));
    img.src = src;
  });
}

async function trimTransparent(src: string): Promise<LoadedSignature> {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { src, aspect: img.naturalWidth / img.naturalHeight };
  ctx.drawImage(img, 0, 0);

  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return { src, aspect: width / height };

  const pad = 4;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;

  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  out.getContext("2d")?.drawImage(canvas, minX, minY, w, h, 0, 0, w, h);
  return { src: out.toDataURL("image/png"), aspect: w / h };
}
