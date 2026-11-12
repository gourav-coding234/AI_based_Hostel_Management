// Decode an image in the browser, center-crop it to a square avatar, and
// compress it enough to keep the profile document comfortably below limits.
export async function fileToResizedJpegBlob(file, { maxSize = 320, zoom = 1 } = {}) {
  if (!file) throw new Error("Choose a photo before uploading.");
  if (file.size > 15 * 1024 * 1024) throw new Error("This image is larger than 15 MB.");
  if (file.type && !file.type.toLowerCase().startsWith("image/")) {
    throw new Error("Choose an image file for your profile photo.");
  }

  let image;
  let objectUrl = "";
  try {
    if (typeof createImageBitmap === "function") {
      try {
        image = await createImageBitmap(file, { imageOrientation: "from-image" });
      } catch {
        // Some browsers decode formats through <img> even when ImageBitmap
        // does not support them. Try the browser's regular image decoder next.
      }
    }
    if (!image) {
      objectUrl = URL.createObjectURL(file);
      image = await new Promise((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = () => reject(new Error("This image format isn't supported by this browser. Choose a JPG, PNG, or WebP photo."));
        element.src = objectUrl;
      });
    }

    const width = image.width || image.naturalWidth;
    const height = image.height || image.naturalHeight;
    if (!width || !height) throw new Error("The selected image has no readable dimensions.");
    const cropSize = Math.min(width, height) / Math.max(1, Math.min(2.5, Number(zoom) || 1));
    const sx = (width - cropSize) / 2;
    const sy = (height - cropSize) / 2;
    const canvas = document.createElement("canvas");
    canvas.width = maxSize;
    canvas.height = maxSize;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image processing is unavailable in this browser.");
    context.drawImage(image, sx, sy, cropSize, cropSize, 0, 0, maxSize, maxSize);

    let bestBlob = null;
    for (const dimension of [maxSize, 256, 192, 128]) {
      if (canvas.width !== dimension) {
        const resized = document.createElement("canvas");
        resized.width = dimension;
        resized.height = dimension;
        const resizedContext = resized.getContext("2d");
        if (!resizedContext) continue;
        resizedContext.drawImage(canvas, 0, 0, dimension, dimension);
        for (const quality of [0.82, 0.68, 0.54, 0.4, 0.28]) {
          const blob = await new Promise((resolve) => resized.toBlob(resolve, "image/jpeg", quality));
          if (blob && (!bestBlob || blob.size < bestBlob.size)) bestBlob = blob;
          if (blob && blob.size <= 200 * 1024) return blob;
        }
      } else {
        for (const quality of [0.82, 0.68, 0.54, 0.4, 0.28]) {
          const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
          if (blob && (!bestBlob || blob.size < bestBlob.size)) bestBlob = blob;
          if (blob && blob.size <= 200 * 1024) return blob;
        }
      }
    }
    if (!bestBlob || bestBlob.size > 200 * 1024) {
      throw new Error("This photo could not be compressed small enough. Try a smaller image.");
    }
    return bestBlob;
  } finally {
    if (typeof image?.close === "function") image.close();
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}
