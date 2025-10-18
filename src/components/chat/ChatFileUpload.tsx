import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface ChatFileUploadProps {
  onFileUploaded: (fileUrl: string) => void;
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
  onCancel?: () => void;
}

export function ChatFileUpload({
  onFileUploaded,
  onUploadStart,
  onUploadEnd,
  onCancel,
}: ChatFileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Maximum file size is 50MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only images (JPEG, PNG, GIF, WebP) and PDFs are allowed",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    onUploadStart?.();
    setProgress(0);

    try {
      const fileExt = selectedFile.name.split(".").pop();
      const isImage = selectedFile.type.startsWith("image/");
      const prefix = isImage ? "img" : "pdf";
      const fileName = `chat/${prefix}-${crypto.randomUUID()}.${fileExt}`;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload file
      const { data, error } = await supabase.storage
        .from("chat-files")
        .upload(fileName, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("chat-files")
        .getPublicUrl(data.path);

      setProgress(100);
      onFileUploaded(publicUrl);

      toast({
        title: "File uploaded",
        description: "Your file has been uploaded successfully",
      });

      // Reset state
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setProgress(0);
      onUploadEnd?.();
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onCancel?.();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            id="file-upload-input"
          />
          <label htmlFor="file-upload-input" className="flex-1">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={uploading}
              asChild
            >
              <span className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                {selectedFile ? selectedFile.name : "Choose file"}
              </span>
            </Button>
          </label>
          {selectedFile && !uploading && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleCancel}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {selectedFile && (
          <div className="text-sm text-muted-foreground">
            Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
          </div>
        )}

        {uploading && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground text-center">
              Uploading... {progress}%
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={uploading}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
