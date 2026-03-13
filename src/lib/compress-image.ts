const MAX_DIMENSION = 2048;
const TARGET_SIZE = 1024 * 1024; // 1 Mo cible
const INITIAL_QUALITY = 0.85;

export async function compressImage(file: File): Promise<File> {
  // Skip non-compressible formats or already small files
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }
  if (file.size <= TARGET_SIZE) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Redimensionner si trop grand
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      // Compression progressive : baisser la qualité si encore trop gros
      let quality = INITIAL_QUALITY;
      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            if (blob.size > TARGET_SIZE && quality > 0.4) {
              quality -= 0.1;
              tryCompress();
            } else {
              const compressed = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: file.lastModified,
              });
              resolve(compressed);
            }
          },
          "image/jpeg",
          quality
        );
      };
      tryCompress();

      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}
