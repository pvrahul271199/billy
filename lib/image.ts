export type ImageKind = "photo" | "logo" | "signature" | "qr";

const MAX_SIZE = 800;

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("This file can't be read as an image."));
    };
    img.src = url;
  });
}

/**
 * Resize an image so its longest side is at most 800px and return a data URL.
 * Logos, signatures and QR codes stay PNG (keeps transparency and sharp edges);
 * photos are compressed to JPEG.
 */
export async function processImage(file: Blob, kind: ImageKind): Promise<string> {
  const img = await loadImage(file);
  const scale = Math.min(1, MAX_SIZE / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser can't process images.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);

  if (kind === "signature") knockOutPaper(ctx, width, height);

  return kind === "photo" ? canvas.toDataURL("image/jpeg", 0.85) : canvas.toDataURL("image/png");
}

/**
 * Make paper-white pixels transparent so a photographed signature sits cleanly
 * on the invoice. Light pixels fade out gradually to keep ink edges smooth.
 */
function knockOutPaper(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const data = ctx.getImageData(0, 0, width, height);
  const px = data.data;
  const solid = 170; // at or below this brightness: keep fully opaque
  const clear = 225; // at or above: fully transparent
  for (let i = 0; i < px.length; i += 4) {
    const brightness = 0.299 * px[i]! + 0.587 * px[i + 1]! + 0.114 * px[i + 2]!;
    if (brightness >= clear) {
      px[i + 3] = 0;
    } else if (brightness > solid) {
      px[i + 3] = Math.round(px[i + 3]! * (1 - (brightness - solid) / (clear - solid)));
    }
  }
  ctx.putImageData(data, 0, 0);
}
