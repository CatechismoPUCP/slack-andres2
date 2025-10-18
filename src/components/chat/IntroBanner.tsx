import { Hash, User } from "lucide-react";
import { format } from "date-fns";

interface IntroBannerProps {
  type: "channel" | "dm";
  name: string;
  createdAt: string;
}

export function IntroBanner({ type, name, createdAt }: IntroBannerProps) {
  const formattedDate = format(new Date(createdAt), "MMMM d, yyyy");

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
          {type === "channel" ? (
            <Hash className="h-8 w-8 text-primary" />
          ) : (
            <User className="h-8 w-8 text-primary" />
          )}
        </div>
      </div>
      
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">
          {type === "channel" ? `Welcome to #${name}` : `This is the beginning of your conversation with ${name}`}
        </h2>
        <p className="text-sm text-muted-foreground">
          {type === "channel" 
            ? `This channel was created on ${formattedDate}. This is the very beginning of the #${name} channel.`
            : `This conversation started on ${formattedDate}.`
          }
        </p>
      </div>

      {type === "channel" && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Post messages, share files, and collaborate with your team here.
          </p>
        </div>
      )}
    </div>
  );
}
