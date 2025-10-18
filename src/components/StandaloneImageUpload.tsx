import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

interface StandaloneImageUploadProps {
  value: string;
  onChange: (url: string) => void;
}

export function StandaloneImageUpload({ value, onChange }: StandaloneImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Please upload an image smaller than 2MB");
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `workspaces/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("workspace-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("workspace-images")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      onChange(publicUrl);

      toast.success("Image uploaded successfully");
    } catch (error: any) {
      toast.error(error.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange("");
  };

  return (
    <div className="space-y-4">
      {!value ? (
        <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
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
          <div className="rounded-lg overflow-hidden border-2">
            <img
              src={value}
              alt="Workspace preview"
              className="w-full h-48 object-cover"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
