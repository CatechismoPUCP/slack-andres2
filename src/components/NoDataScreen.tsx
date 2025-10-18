import { Button } from "@/components/ui/button";
import { MessageSquarePlus } from "lucide-react";

interface NoDataScreenProps {
  workspaceName: string;
  onCreateChannel: () => void;
}

export function NoDataScreen({ workspaceName, onCreateChannel }: NoDataScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="max-w-md text-center space-y-6">
        <MessageSquarePlus className="w-16 h-16 mx-auto text-muted-foreground" />
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome to {workspaceName}
          </h1>
          <p className="text-muted-foreground">
            Get started by creating your first channel to organize conversations by topic
          </p>
        </div>
        <Button 
          onClick={onCreateChannel}
          size="lg"
          className="mt-4"
        >
          <MessageSquarePlus className="w-5 h-5 mr-2" />
          Create Channel
        </Button>
      </div>
    </div>
  );
}
