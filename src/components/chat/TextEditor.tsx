import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { MenuBar } from "./MenuBar";
import { Button } from "@/components/ui/button";
import { Send, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useColorPreferences } from "@/providers/color-preferences";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChatFileUpload } from "./ChatFileUpload";

interface TextEditorProps {
  onSend: (content: string, fileUrl?: string) => void;
  isSending?: boolean;
  channelName: string;
}

export function TextEditor({ onSend, isSending, channelName }: TextEditorProps) {
  const { color } = useColorPreferences();
  const [fileDialogOpen, setFileDialogOpen] = useState(false);
  const [pendingFileUrl, setPendingFileUrl] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: `Message #${channelName}`,
      }),
    ],
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none focus:outline-none p-4 min-h-[100px] max-h-[200px] overflow-y-auto",
          color === "green"
            ? "bg-[#0d2818]"
            : color === "blue"
            ? "bg-[#0a1829]"
            : "bg-background"
        ),
      },
    },
    onUpdate: ({ editor }) => {
      // Optional: Handle updates
    },
  });

  const handleSend = () => {
    if (!editor) return;

    const html = editor.getHTML();
    const text = editor.getText();

    // Allow sending if there's content or a file
    if (text.trim().length < 2 && !pendingFileUrl) return;

    onSend(pendingFileUrl ? "" : html, pendingFileUrl || undefined);
    editor.commands.clearContent();
    setPendingFileUrl(null);
  };

  const handleFileUploaded = (fileUrl: string) => {
    setPendingFileUrl(fileUrl);
    setFileDialogOpen(false);
    // Automatically send the file
    onSend("", fileUrl);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isDisabled = !editor || (editor.getText().trim().length < 2 && !pendingFileUrl) || isSending;

  const bgClass =
    color === "green"
      ? "bg-[#0d2818] border-[#1a3d2b]"
      : color === "blue"
      ? "bg-[#0a1829] border-[#1a2f4a]"
      : "bg-background border-border";

  return (
    <>
      <div className={cn("border-t", bgClass)} onKeyDown={handleKeyDown}>
        <MenuBar editor={editor} />
        <EditorContent editor={editor} />
        <div className="flex items-center justify-between p-2 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Attach file"
            onClick={() => setFileDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleSend}
            disabled={isDisabled}
            size="icon"
            className="h-8 w-8"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={fileDialogOpen} onOpenChange={setFileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
            <DialogDescription>
              Upload an image or PDF to share in the chat (max 50MB)
            </DialogDescription>
          </DialogHeader>
          <ChatFileUpload
            onFileUploaded={handleFileUploaded}
            onCancel={() => setFileDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
