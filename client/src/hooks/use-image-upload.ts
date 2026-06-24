import { useState } from "react";
import { uploadImage, uploadImagePresigned } from "@/api/upload";
import { toastManager } from "@/components/ui/toast";

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File): Promise<string | null> => {
    if (
      ![
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/avif",
        "image/gif",
      ].includes(file.type)
    ) {
      toastManager.add({ title: "Unsupported file type", type: "error" });
      return null;
    }
    if (file.size > 6 * 1024 * 1024) {
      toastManager.add({ title: "File too large (max 6MB)", type: "error" });
      return null;
    }

    setUploading(true);
    try {
      const url = await uploadImagePresigned(file);
      return url;
    } catch {
      try {
        const url = await uploadImage(file);
        return url;
      } catch {
        toastManager.add({ title: "Upload failed", type: "error" });
        return null;
      }
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading };
}
