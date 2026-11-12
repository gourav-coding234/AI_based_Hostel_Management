// Resizes and compresses an image file in the browser, returning a base64
// data URL small enough to store directly on the user's Firestore profile
// doc (no Firebase Storage bucket/rules setup required for a simple avatar).

export async function fileToResizedDataUrl(file, { maxSize = 320 } = {}) {
  if (!file) throw new Error("Choose a photo before uploading.");
  if (["image/heic", "image/heif"].includes(file.type.toLowerCase())) {
    throw new Error("This photo is HEIC/HEIF. Save or share it as JPG, PNG, or WebP, then try again.");
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type.toLowerCase())) {
    throw new Error("Choose a JPG, PNG, or WebP image.");
  }
  if (file.size > 15 * 1024 * 1024) throw new Error("This image is larger than 15 MB.");

  const image = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read that file. Check the file and try again."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Couldn't open that image. Try another JPG, PNG, or WebP file."));
      img.onload = () => resolve(img);
      img.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });

  let bestBlob = null;
  for (const dimension of [maxSize, 256, 192, 128]) {
    const scale = Math.min(1, dimension / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Image processing is unavailable in this browser.");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.82, 0.7, 0.58, 0.46, 0.34, 0.25]) {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      if (blob && (!bestBlob || blob.size < bestBlob.size)) bestBlob = blob;
      if (blob && blob.size <= 100 * 1024) return blobToDataUrl(blob);
    }
  }
  if (!bestBlob || bestBlob.size > 200 * 1024) {
    throw new Error("This photo could not be compressed below 200 KB. Choose a smaller or simpler image.");
  }
  return blobToDataUrl(bestBlob);
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't prepare the compressed photo for saving."));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(blob);
  });
}
