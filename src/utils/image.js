const MAX_INPUT_BYTES = 15 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 450 * 1024;

function loadImage(file) {
  const objectUrl = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ image, objectUrl });
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("This image format isn't supported by this browser. Choose a JPG, PNG, or WebP photo."));
    };
    image.src = objectUrl;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("The browser could not encode this photo.")), type, quality);
    } catch {
      reject(new Error("The browser could not encode this photo."));
    }
  });
}

async function canDecode(blob) {
  if (typeof createImageBitmap === "function") {
    try {
      const decoded = await createImageBitmap(blob);
      const valid = decoded.width > 0 && decoded.height > 0;
      decoded.close?.();
      if (valid) return true;
    } catch {
      // Older browsers may not decode a generated blob with ImageBitmap.
    }
  }
  const { image, objectUrl } = await loadImage(blob);
  const valid = image.naturalWidth > 0 && image.naturalHeight > 0;
  URL.revokeObjectURL(objectUrl);
  return valid;
}

// Decode with the browser's regular image decoder (which handles phone photos
// and EXIF orientation), crop to a square, then verify the encoded result.
export async function fileToProfilePhotoDataUrl(file, { maxSize = 320, zoom = 1 } = {}) {
  if (!file) throw new Error("Choose a photo before uploading.");
  if (file.size > MAX_INPUT_BYTES) throw new Error("This image is larger than 15 MB.");
  if (file.type && !file.type.toLowerCase().startsWith("image/")) {
    throw new Error("Choose an image file for your profile photo.");
  }

  const { image, objectUrl } = await loadImage(file);
  try {
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    if (!width || !height) throw new Error("The selected image has no readable dimensions.");

    const safeZoom = Math.max(1, Math.min(2.5, Number(zoom) || 1));
    const cropSize = Math.min(width, height) / safeZoom;
    const sx = (width - cropSize) / 2;
    const sy = (height - cropSize) / 2;
    const dimensions = [...new Set([maxSize, 256, 192, 128].map((value) => Math.min(maxSize, value)))];
    let best = null;

    for (const dimension of dimensions) {
      const canvas = document.createElement("canvas");
      canvas.width = dimension;
      canvas.height = dimension;
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("Image processing is unavailable in this browser.");
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(image, sx, sy, cropSize, cropSize, 0, 0, dimension, dimension);

      // JPEG keeps typical portrait photos small. PNG is a lossless fallback
      // for browsers that produce a broken JPEG from a particular source.
      const encodings = [
        ...[0.9, 0.82, 0.72, 0.62, 0.52].map((quality) => ({ type: "image/jpeg", quality })),
        { type: "image/png" },
      ];
      for (const encoding of encodings) {
        let blob;
        try {
          blob = await canvasToBlob(canvas, encoding.type, encoding.quality);
        } catch {
          continue;
        }
        if (!blob.size || !blob.type.startsWith("image/")) continue;
        if (!best || blob.size < best.size) best = blob;
        if (blob.size > MAX_OUTPUT_BYTES) continue;
        try {
          if (!(await canDecode(blob))) continue;
        } catch {
          continue;
        }

        const reader = new FileReader();
        const dataUrl = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(String(reader.result || ""));
          reader.onerror = () => reject(new Error("The browser could not prepare this photo. Please try again."));
          reader.readAsDataURL(blob);
        });
        if (!dataUrl.startsWith(`data:${blob.type};base64,`)) continue;
        return dataUrl;
      }
    }

    if (best && best.size > MAX_OUTPUT_BYTES) {
      throw new Error("This photo is too detailed to save here. Choose a smaller photo or crop it closer.");
    }
    throw new Error("The selected photo could not be prepared. Please choose another JPG, PNG, or WebP image.");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
