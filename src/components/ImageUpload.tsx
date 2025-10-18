import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, ImageIcon } from "lucide-react";
import { useWorkspaceValues } from "@/hooks/create-workspace-values";

export function ImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const { imageUrl, updateImageUrl } = useWorkspaceValues();
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload an image file",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please upload an image smaller than 2MB",
      });
      return;
    }

    setUploading(true);

    try {
      // Create storage bucket if it doesn't exist
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some((b) => b.name === "workspace-images");

      if (!bucketExists) {
        await supabase.storage.createBucket("workspace-images", {
          public: true,
          fileSizeLimit: 2097152, // 2MB
        });
      }

      // Upload file
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `workspaces/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("workspace-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("workspace-images")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      updateImageUrl(publicUrl);
      setPreviewUrl(publicUrl);

      toast({
        title: "Image uploaded",
        description: "Your workspace image has been uploaded successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    updateImageUrl("");
    setPreviewUrl("");
  };

  return (
    <div className="space-y-4">
      {!imageUrl && !previewUrl ? (
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-smooth">
          <Label htmlFor="image-upload" className="cursor-pointer">
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium mb-1">Upload workspace image</p>
                <p className="text-sm text-muted-foreground">
                  PNG, JPG or WEBP (max 2MB)
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" disabled={uploading}>
                {uploading ? "Uploading..." : "Choose Image"}
              </Button>
            </div>
          </Label>
          <Input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
        </div>
      ) : (
        <div className="relative group">
          <div className="rounded-lg overflow-hidden border-2 border-border">
            <img
              src={imageUrl || previewUrl}
              alt="Workspace preview"
              className="w-full h-48 object-cover"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-smooth"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
