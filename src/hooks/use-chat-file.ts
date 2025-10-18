import { supabase } from "@/integrations/supabase/client";

export function useChatFile() {
  const getPublicUrl = (filePath: string): string => {
    if (filePath.startsWith("http")) {
      return filePath; // Already a full URL
    }

    const { data } = supabase.storage
      .from("chat-files")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const getFileType = (url: string): "image" | "pdf" | "other" => {
    const lowerUrl = url.toLowerCase();
    
    if (lowerUrl.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      return "image";
    }
    
    if (lowerUrl.endsWith(".pdf")) {
      return "pdf";
    }
    
    return "other";
  };

  const isImage = (url: string): boolean => {
    return getFileType(url) === "image";
  };

  const isPdf = (url: string): boolean => {
    return getFileType(url) === "pdf";
  };

  return {
    getPublicUrl,
    getFileType,
    isImage,
    isPdf,
  };
}
