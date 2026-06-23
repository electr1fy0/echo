import { useState } from "react";
import { uploadImage, uploadImagePresigned } from "@/api/upload";
import { toast } from "@/lib/toast";

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File): Promise<string | null> => {
    if (!["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"].includes(file.type)) {
      toast.error("Unsupported file type");
      return null;
    }
    if (file.size > 6 * 1024 * 1024) {
      toast.error("File too large (max 6MB)");
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
        toast.error("Upload failed");
        return null;
      }
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading };
}
