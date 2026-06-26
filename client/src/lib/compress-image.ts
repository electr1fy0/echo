const MAX_DIMENSION = 1920;
const QUALITY = 0.8;

export async function compressImage(file: File): Promise<File> {
  if (file.type === "image/gif" || file.type === "image/avif") return file;
  if (!file.type.startsWith("image/")) return file;
  if (file.size < 100 * 1024) return file;

  const img = await loadImage(file);
  let { width, height } = img;

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    if (width > height) {
      height = Math.round((height * MAX_DIMENSION) / width);
      width = MAX_DIMENSION;
    } else {
      width = Math.round((width * MAX_DIMENSION) / height);
      height = MAX_DIMENSION;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.drawImage(img, 0, 0, width, height);
  URL.revokeObjectURL(img.src);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", QUALITY),
  );
  if (!blob) return file;

  return new File([blob], file.name.replace(/\.\w+$/, ".webp"), {
    type: "image/webp",
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}
