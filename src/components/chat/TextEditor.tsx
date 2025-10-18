import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { MenuBar } from "./MenuBar";
import { Button } from "@/components/ui/button";
import { Send, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useColorPreferences } from "@/providers/color-preferences";

interface TextEditorProps {
  onSend: (content: string) => void;
  isSending?: boolean;
  channelName: string;
}

export function TextEditor({ onSend, isSending, channelName }: TextEditorProps) {
  const { color } = useColorPreferences();

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

    // Minimum 2 characters validation
    if (text.trim().length < 2) return;

    onSend(html);
    editor.commands.clearContent();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isDisabled = !editor || editor.getText().trim().length < 2 || isSending;

  const bgClass =
    color === "green"
      ? "bg-[#0d2818] border-[#1a3d2b]"
      : color === "blue"
      ? "bg-[#0a1829] border-[#1a2f4a]"
      : "bg-background border-border";

  return (
    <div className={cn("border-t", bgClass)} onKeyDown={handleKeyDown}>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
      <div className="flex items-center justify-between p-2 border-t border-border">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Attach file (coming soon)"
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
  );
}
