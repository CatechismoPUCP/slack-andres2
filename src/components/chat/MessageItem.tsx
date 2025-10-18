import { useState } from "react";
import { format } from "date-fns";
import { MoreVertical, Pencil, Trash, FileText, ExternalLink } from "lucide-react";
import { MessageWithUser } from "@/types/app";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface MessageItemProps {
  message: MessageWithUser;
  currentUserId: string;
  onUpdate: (messageId: string, content: string) => void;
  onDelete: (messageId: string) => void;
  isAdmin?: boolean;
  isRegulator?: boolean;
}

export function MessageItem({
  message,
  currentUserId,
  onUpdate,
  onDelete,
  isAdmin = false,
  isRegulator = false,
}: MessageItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content || "");
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const isOwnMessage = message.user_id === currentUserId;
  const canDelete = isOwnMessage || isAdmin || isRegulator;
  const timestamp = format(new Date(message.created_at), "h:mm a");

  const isImageFile = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  };

  const isPdfFile = (url: string) => {
    return /\.pdf$/i.test(url);
  };

  const handleSaveEdit = () => {
    if (editContent.trim()) {
      onUpdate(message.id, editContent);
      setIsEditing(false);
    }
  };

  if (message.is_deleted) {
    return (
      <div className="group px-6 py-2 hover:bg-accent/50 transition-colors">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={message.user.avatar_url} />
            <AvatarFallback>
              {message.user.name?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{message.user.name}</span>
              <span className="text-xs text-muted-foreground">{timestamp}</span>
            </div>
            <p className="text-sm text-muted-foreground italic">
              This message was deleted
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group px-6 py-2 hover:bg-accent/50 transition-colors">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={message.user.avatar_url} />
          <AvatarFallback>
            {message.user.name?.[0]?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{message.user.name}</span>
            {isAdmin && <Badge variant="destructive" className="text-xs">Admin</Badge>}
            {isRegulator && !isAdmin && <Badge variant="secondary" className="text-xs">Regulator</Badge>}
            <span className="text-xs text-muted-foreground">{timestamp}</span>
            {message.updated_at !== message.created_at && (
              <span className="text-xs text-muted-foreground">(edited)</span>
            )}
          </div>
          {isEditing ? (
            <div className="mt-1">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[60px]"
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={handleSaveEdit}>
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(message.content || "");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div 
                className="text-sm mt-1 whitespace-pre-wrap break-words prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: message.content || "" }}
              />
              
              {message.file_url && (
                <div className="mt-2">
                  {isImageFile(message.file_url) ? (
                    <img 
                      src={message.file_url} 
                      alt="Attachment" 
                      loading="lazy"
                      className="max-w-md rounded-md border border-border cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setLightboxOpen(true)}
                    />
                  ) : isPdfFile(message.file_url) ? (
                    <a 
                      href={message.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-muted hover:bg-muted/80 transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      View PDF
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : (
                    <a 
                      href={message.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-muted hover:bg-muted/80 transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      Download File
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        {!isEditing && (canDelete || isOwnMessage) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOwnMessage && (
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(message.id)}
                  className="text-destructive"
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Image Lightbox */}
      {message.file_url && isImageFile(message.file_url) && (
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden">
            <img
              src={message.file_url}
              alt="Full size image"
              className="w-full h-auto"
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
